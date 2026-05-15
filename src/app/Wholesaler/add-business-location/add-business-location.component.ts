import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack, camera, location } from 'ionicons/icons';
import { AddBusinessService, State, City, Location, BusinessType, BusinessBranch, BranchAddressResolutionResponse } from './add-business.service';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessBranchWithNames } from '../business-locations/business-locations.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
	selector: 'app-add-business-location',
	templateUrl: './add-business-location.component.html',
	styleUrls: ['./add-business-location.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule,
		TranslatePipe,
	]
})
export class AddBusinessLocationComponent implements OnInit, OnDestroy {
	businessForm: FormGroup;
	isEditMode = false;
	locationId: number | null = null;
	pageTitle = 'Add Business Location';
	states: State[] = [];
	cities: City[] = [];
	locations: Location[] = [];
	filteredCities: City[] = [];
	filteredLocations: Location[] = [];
	citySearchTerm = '';
	locationSearchTerm = '';
	showCitySuggestions = false;
	showLocationSuggestions = false;
	businessTypes: BusinessType[] = [];
	capturedImage: string = '';
	latitude: number = 0;
	longitude: number = 0;
	locationCaptureSource: string = '';
	locationCaptured: boolean = false;
	isResolvingAddress = false;
	showAddressResolutionChecking = false;
	addressResolution: BranchAddressResolutionResponse | null = null;
	private addressResolutionLoadingTimer: ReturnType<typeof setTimeout> | null = null;
	private isHydratingLocationContext = false;
	private captureReferenceState: number | null = null;
	private captureReferenceCity: number | null = null;
	private captureReferenceLocation: number | null = null;
	private captureReferenceAddress = '';

	fieldLabels: { [key: string]: string } = {
		shopName: 'ADD_BUSINESS_FORM.SHOP_NAME',
		number: 'ADD_BUSINESS_FORM.PHONE_NUMBER',
		location: 'ADD_BUSINESS_FORM.LOCATION',
		state: 'ADD_BUSINESS_FORM.STATE',
		city: 'ADD_BUSINESS_FORM.CITY',
		address: 'ADD_BUSINESS_FORM.ADDRESS',
		email: 'ADD_BUSINESS_FORM.EMAIL',
		gstNumber: 'ADD_BUSINESS_FORM.GST_NUMBER',
		privilegedUser: 'ADD_BUSINESS_FORM.PRIVILEGED_USER',
		b_type_id: 'ADD_BUSINESS_FORM.BUSINESS_TYPE',
		establishedYear: 'ADD_BUSINESS_FORM.ESTABLISHED_YEAR',
		active_status: 'ADD_BUSINESS_FORM.ACTIVE_STATUS'
	};

	private destroy$ = new Subject<void>();

	constructor(
		private formBuilder: FormBuilder,
		private addBusinessService: AddBusinessService,
		private router: Router,
		private route: ActivatedRoute,
		private toastController: ToastController,
		private loadingController: LoadingController,
		private alertController: AlertController,
		private authService: AuthService,
		private translate: TranslateService
	) {
		addIcons({ save, arrowBack, camera, location });

		this.businessForm = this.formBuilder.group({
			shopName: ['', Validators.required],
			number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
			state: [null, Validators.required],
			city: [null, Validators.required],
			location: [null, Validators.required],
			address: ['', Validators.required],
			email: ['', [Validators.required, Validators.email]],
			gstNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
			privilegedUser: [false],
			active_status: [true],
			b_type_id: [null],
			establishedYear: ['', [Validators.pattern(/^[0-9]{4}$/)]]
		});
	}

	ngOnInit() {
		if (!this.authService.isAuthenticated()) {
			this.showAuthError();
			return;
		}
		if (!this.authService.hasRole || !this.authService.hasRole('wholesaler')) {
			this.showUnauthorizedError();
			return;
		}

		this.route.queryParams.subscribe(params => {
			if (params['mode'] === 'edit' && params['locationId']) {

				this.isEditMode = true;
				this.locationId = +params['locationId'];
				this.pageTitle = this.translate.instant('ADD_BUSINESS_FORM.EDIT_PAGE_TITLE');
				this.loadLocationData();
			}
		});

		this.loadBusinessTypes();
		this.loadStates();

		this.businessForm.get('state')?.valueChanges
			.pipe(
				switchMap((stateId) => {
					this.businessForm.patchValue({ city: null, location: null }, { emitEvent: false });
					this.cities = [];
					this.locations = [];
					this.filteredCities = [];
					this.filteredLocations = [];
					this.citySearchTerm = '';
					this.locationSearchTerm = '';
					this.showCitySuggestions = false;
					this.showLocationSuggestions = false;
					this.addressResolution = null;

					if (stateId) {
						return this.addBusinessService.getCitiesOfState(stateId);
					}
					return EMPTY;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (data: City[]) => {
					this.cities = data;
					void this.invalidateCaptureIfLocationChanged();
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_CITIES'),
						'danger'
					);
				}
			});

		this.businessForm.get('city')?.valueChanges
			.pipe(
				switchMap((cityId) => {
					this.businessForm.get('location')?.setValue(null, { emitEvent: false });
					this.locations = [];
					this.filteredLocations = [];
					this.locationSearchTerm = '';
					this.showLocationSuggestions = false;
					this.addressResolution = null;

					if (cityId) {
						return this.addBusinessService.getLocationsByCity(cityId);
					}
					return EMPTY;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (data: Location[]) => {
					this.locations = data;
					this.requestAddressResolution();
					void this.invalidateCaptureIfLocationChanged();
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_LOCATIONS'),
						'danger'
					);
				}
			});

		this.businessForm.get('location')?.valueChanges
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				if (this.addressResolution) {
					this.requestAddressResolution();
				}
				void this.invalidateCaptureIfLocationChanged();
			});

		this.businessForm.get('address')?.valueChanges
			.pipe(
				debounceTime(450),
				distinctUntilChanged(),
				takeUntil(this.destroy$)
			)
			.subscribe(() => {
				this.requestAddressResolution();
				void this.invalidateCaptureIfLocationChanged();
			});
	}

	ngOnDestroy() {
		this.clearAddressResolutionLoadingTimer();
		this.destroy$.next();
		this.destroy$.complete();
	}

	async showAuthError() {
		const alert = await this.alertController.create({
			header: this.translate.instant('ADD_BUSINESS_FORM.AUTH_ERROR'),
			message: this.translate.instant('ADD_BUSINESS_FORM.SESSION_EXPIRED'),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.OK'),
					handler: () => {
						this.authService.logout();
						this.router.navigate(['/login']);
					}
				}
			]
		});
		await alert.present();
	}

	async showUnauthorizedError() {
		const alert = await this.alertController.create({
			header: this.translate.instant('ADD_BUSINESS_FORM.ACCESS_DENIED'),
			message: this.translate.instant('ADD_BUSINESS_FORM.NO_PERMISSION'),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.OK'),
					handler: () => {
						this.router.navigate(['/login']);
					}
				}
			]
		});
		await alert.present();
	}

	loadStates() {
		this.addBusinessService.getStates()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: State[]) => {
					this.states = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_STATES'),
						'danger'
					);
				}
			});
	}

	loadCities(stateId: number) {
		this.addBusinessService.getCitiesOfState(stateId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: City[]) => {
					this.cities = data;
					this.filteredCities = [...data];
					this.syncCitySearchFromSelection();
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_CITIES'),
						'danger'
					);
				}
			});
	}

	loadLocations(cityId: number) {
		this.addBusinessService.getLocationsByCity(cityId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: Location[]) => {
					this.locations = data;
					this.filteredLocations = [...data];
					this.syncLocationSearchFromSelection();
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_LOCATIONS'),
						'danger'
					);
				}
			});
	}

	requestAddressResolution() {
		const cityId = this.businessForm.get('city')?.value;
		const address = this.businessForm.get('address')?.value?.trim();
		const selectedLocationId = this.businessForm.get('location')?.value;

		if (!cityId || !address || address.length < 5) {
			this.addressResolution = null;
			this.isResolvingAddress = false;
			this.showAddressResolutionChecking = false;
			this.clearAddressResolutionLoadingTimer();
			return;
		}

		this.isResolvingAddress = true;
		this.showAddressResolutionChecking = false;
		this.clearAddressResolutionLoadingTimer();
		this.addressResolutionLoadingTimer = setTimeout(() => {
			if (this.isResolvingAddress) {
				this.showAddressResolutionChecking = true;
			}
		}, 250);
		this.addBusinessService.resolveBusinessBranchAddress({
			city_id: cityId,
			address,
			selected_location_id: selectedLocationId || null
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (resolution) => {
					this.addressResolution = resolution;
					this.isResolvingAddress = false;
					this.showAddressResolutionChecking = false;
					this.clearAddressResolutionLoadingTimer();
				},
				error: (error) => {
					console.error('Address resolution error:', error);
					this.addressResolution = null;
					this.isResolvingAddress = false;
					this.showAddressResolutionChecking = false;
					this.clearAddressResolutionLoadingTimer();
				}
			});
	}

	onCitySearchChange(event: Event | CustomEvent): void {
		const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
		this.citySearchTerm = String(rawValue);

		const selectedCityId = this.businessForm.get('city')?.value;
		if (selectedCityId) {
			const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
			if (selectedCity && selectedCity.city_name.toLowerCase() !== this.citySearchTerm.trim().toLowerCase()) {
				this.businessForm.patchValue({ city: null, location: null }, { emitEvent: false });
				this.locations = [];
				this.filteredLocations = [];
				this.locationSearchTerm = '';
				this.showLocationSuggestions = false;
				this.addressResolution = null;
			}
		}

		this.filterCities();
		this.showCitySuggestions = !!this.businessForm.get('state')?.value && !this.isEditMode;
	}

	onLocationSearchChange(event: Event | CustomEvent): void {
		const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
		this.locationSearchTerm = String(rawValue);

		const selectedLocationId = this.businessForm.get('location')?.value;
		if (selectedLocationId) {
			const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
			if (selectedLocation && (selectedLocation.location_name ?? '').toLowerCase() !== this.locationSearchTerm.trim().toLowerCase()) {
				this.businessForm.get('location')?.setValue(null, { emitEvent: false });
				this.addressResolution = null;
			}
		}

		this.filterLocations();
		this.showLocationSuggestions = !!this.businessForm.get('city')?.value;
	}

	onCityInputFocus(): void {
		if (!this.businessForm.get('state')?.value || this.isEditMode) {
			return;
		}
		this.filteredCities = [...this.cities];
		this.showCitySuggestions = true;
	}

	onCityInputBlur(): void {
		this.businessForm.get('city')?.markAsTouched();
		setTimeout(() => {
			this.showCitySuggestions = false;
		}, 150);
	}

	onLocationInputFocus(): void {
		if (!this.businessForm.get('city')?.value) {
			return;
		}
		this.filteredLocations = [...this.locations];
		this.showLocationSuggestions = true;
	}

	onLocationInputBlur(): void {
		this.businessForm.get('location')?.markAsTouched();
		setTimeout(() => {
			this.showLocationSuggestions = false;
		}, 150);
	}

	selectCity(city: City, event?: Event): void {
		event?.preventDefault();
		this.businessForm.patchValue({ city: city.id, location: null }, { emitEvent: false });
		this.citySearchTerm = city.city_name;
		this.locationSearchTerm = '';
		this.showCitySuggestions = false;
		this.locations = [];
		this.filteredLocations = [];
		this.addressResolution = null;
		this.loadLocations(city.id);
		this.requestAddressResolution();
	}

	selectLocation(location: Location, event?: Event): void {
		event?.preventDefault();
		this.businessForm.get('location')?.setValue(location.id, { emitEvent: false });
		this.locationSearchTerm = location.location_name ?? '';
		this.showLocationSuggestions = false;
		this.requestAddressResolution();
	}

	clearSelectedCity(): void {
		this.businessForm.patchValue({ city: null, location: null }, { emitEvent: false });
		this.citySearchTerm = '';
		this.locationSearchTerm = '';
		this.locations = [];
		this.filteredLocations = [];
		this.filteredCities = [...this.cities];
		this.showCitySuggestions = false;
		this.showLocationSuggestions = false;
		this.addressResolution = null;
	}

	clearSelectedLocation(): void {
		this.businessForm.get('location')?.setValue(null, { emitEvent: false });
		this.locationSearchTerm = '';
		this.filteredLocations = [...this.locations];
		this.showLocationSuggestions = false;
		this.addressResolution = null;
	}

	private clearAddressResolutionLoadingTimer() {
		if (this.addressResolutionLoadingTimer) {
			clearTimeout(this.addressResolutionLoadingTimer);
			this.addressResolutionLoadingTimer = null;
		}
	}

	applySuggestedLocation() {
		const locationId = this.addressResolution?.resolved_location_id;
		if (!locationId) {
			return;
		}
		this.businessForm.get('location')?.setValue(locationId);
	}

	getAddressResolutionTone(): 'success' | 'warning' | 'medium' {
		if (!this.addressResolution) {
			return 'medium';
		}
		if (this.addressResolution.status === 'resolved') {
			return 'success';
		}
		if (this.addressResolution.status === 'suggested') {
			return 'warning';
		}
		return 'medium';
	}

	getAddressResolutionMessage(): string {
		if (!this.addressResolution) {
			return '';
		}

		switch (this.addressResolution.status) {
			case 'resolved':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_RESOLVED', {
					location: this.addressResolution.resolved_location_name || ''
				});
			case 'suggested':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_SUGGESTED', {
					location: this.addressResolution.resolved_location_name || ''
				});
			case 'unresolved':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_UNRESOLVED');
			default:
				return '';
		}
	}

	getAddressResolutionHint(): string {
		if (!this.addressResolution) {
			return '';
		}

		switch (this.addressResolution.status) {
			case 'resolved':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_HINT_RESOLVED');
			case 'suggested':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_HINT_SUGGESTED');
			case 'unresolved':
				return this.translate.instant('ADD_BUSINESS_FORM.ADDRESS_RESOLUTION_HINT_UNRESOLVED');
			default:
				return '';
		}
	}

	loadBusinessTypes() {
		this.addBusinessService.getBusinessTypes()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: BusinessType[]) => {
					this.businessTypes = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_TYPES'),
						'danger'
					);
				}
			});
	}

	loadLocationData() {
		if (this.locationId) {
			// First try to get data from navigation state (original approach)
			const navigation = this.router.getCurrentNavigation();
			if (navigation && navigation.extras.state) {
				let location = navigation.extras.state['location'] as BusinessBranchWithNames | null;

				if (location) {
					this.isHydratingLocationContext = true;
					// Load cities and locations based on state
					if (location.state_id) {
						this.loadCities(location.state_id);
					}
					if (location.city_id) {
						this.loadLocations(location.city_id);
					}

					// Patch form with navigation state data
					this.businessForm.patchValue({
						shopName: location.shop_name || '',
						number: location.number || '',
						state: location.state_id || null,
						city: location.city_id || null,
						location: location.location_id || null,
						address: location.address || '',
						email: location.email || '',
						gstNumber: location.gst_num || '',
						privilegedUser: location.privilege_user || false,
						active_status: location.active_status ? 1 : 0,
						b_type_id: location.type_id || null,
						establishedYear: location.established_year || ''
					});

					// Load existing image and coordinates if available
					if (location.image) {
						this.capturedImage = location.image;
					}
					if (location.latitude && location.longitude) {
						this.latitude = location.latitude;
						this.longitude = location.longitude;
						this.locationCaptured = true;
						this.updateCaptureReference();
					}

					this.setEditModeFieldStates();
					this.isHydratingLocationContext = false;
					return;
				}
			}

			// Fallback: Load data from API if navigation state is not available
			this.addBusinessService.getBusinessBranchById(this.locationId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (data: BusinessBranch) => {
						this.isHydratingLocationContext = true;
						// Load cities and locations based on state
						if (data.state) {
							this.loadCities(data.state);
						}
						if (data.city_id) {
							this.loadLocations(data.city_id);
						}

						this.businessForm.patchValue({
							shopName: data.shop_name || '',
							number: data.number || '',
							state: data.state || null,
							city: data.city_id || null,
							location: data.location || null,
							address: data.address || '',
							email: data.email || '',
							gstNumber: data.gst_num || '',
							privilegedUser: data.privilege_user || false,
							active_status: data.active_status,
							b_type_id: data.type_id || null,
							establishedYear: data.established_year || ''
						});

						// Load existing image and coordinates
						if (data.image) {
							this.capturedImage = data.image;
						}
						if (data.latitude && data.longitude) {
							this.latitude = data.latitude;
							this.longitude = data.longitude;
							this.locationCaptured = true;
							this.updateCaptureReference();
						}

						this.setEditModeFieldStates();
						this.isHydratingLocationContext = false;
					},
					error: () => {
						this.isHydratingLocationContext = false;
						this.showToast(
							this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_DATA'),
							'danger'
						);
					}
				});
		}
	}

	/**
	 * Set field enabled/disabled states for edit mode
	 */
	private setEditModeFieldStates() {
		if (this.isEditMode) {
			// Disable these fields - they remain readonly in edit mode
			this.businessForm.get('shopName')?.disable();
			this.businessForm.get('state')?.disable();
			this.businessForm.get('city')?.disable();
			this.businessForm.get('gstNumber')?.disable();
			this.businessForm.get('privilegedUser')?.disable();
			this.businessForm.get('b_type_id')?.disable();
			this.businessForm.get('establishedYear')?.disable();
			this.businessForm.get('active_status')?.disable();

			// Enable these fields - they remain editable in edit mode
			this.businessForm.get('number')?.enable();
			this.businessForm.get('location')?.enable();
			this.businessForm.get('address')?.enable();
			this.businessForm.get('email')?.enable();
		}
	}

	/**
	 * Capture shop location image with camera or file input (browser fallback)
	 */
	async captureShopImage() {
		// Detect if running in browser (not on device)
		const isBrowser = !window || !(window as any).Capacitor?.isNativePlatform?.();
		if (isBrowser) {
			await this.captureImageFromBrowserCamera();
			return;
		}
		try {
			const loading = await this.loadingController.create({
				message: this.translate.instant('ADD_BUSINESS_FORM.CAPTURING_IMAGE')
			});
			await loading.present();

			// Request camera permissions
			const permissions = await Camera.checkPermissions();
			if (permissions.camera !== 'granted') {
				const requestResult = await Camera.requestPermissions({ permissions: ['camera'] });
				if (requestResult.camera !== 'granted') {
					loading.dismiss();
					await this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.CAMERA_PERMISSION_DENIED'),
						'warning'
					);
					return;
				}
			}

			// Take photo
			const image = await Camera.getPhoto({
				quality: 90,
				allowEditing: false,
				resultType: CameraResultType.Base64,
				source: CameraSource.Camera,
				saveToGallery: false
			});

			if (!image.base64String) {
				loading.dismiss();
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_FAILED'),
					'danger'
				);
				return;
			}

			// Store the image
			this.capturedImage = `data:image/${image.format};base64,${image.base64String}`;
			await this.getDeviceLocation(loading);

		} catch (error) {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_ERROR'),
				'danger'
			);
		}
	}

	/**
	 * Use browser webcam capture for PWA/laptop flows.
	 */
	async captureImageFromBrowserCamera() {
		try {
			const imageData = await this.captureImageFromBrowserStream();
			if (!imageData) {
				return;
			}

			const loading = await this.loadingController.create({
				message: this.translate.instant('ADD_BUSINESS_FORM.CAPTURING_IMAGE')
			});
			await loading.present();

			this.capturedImage = imageData;
			await this.getBrowserGeolocation(loading);
		} catch (error) {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_ERROR'),
				'danger'
			);
		}
	}

	/**
	 * Use browser webcam to capture a fresh frame for onboarding verification.
	 */
	async captureImageFromBrowserStream(): Promise<string | null> {
		if (!navigator.mediaDevices?.getUserMedia) {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_ERROR'),
				'danger'
			);
			return null;
		}

		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: 'environment'
			},
			audio: false
		});

		return new Promise<string | null>((resolve) => {
			const overlay = document.createElement('div');
			overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:9999;padding:24px;';

			const card = document.createElement('div');
			card.style.cssText = 'background:#fff;border-radius:16px;padding:16px;max-width:720px;width:100%;display:flex;flex-direction:column;gap:12px;';

			const video = document.createElement('video');
			video.autoplay = true;
			video.playsInline = true;
			video.muted = true;
			video.style.cssText = 'width:100%;border-radius:12px;background:#000;max-height:70vh;object-fit:cover;';

			const actions = document.createElement('div');
			actions.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';

			const cancelButton = document.createElement('button');
			cancelButton.type = 'button';
			cancelButton.textContent = this.translate.instant('ADD_BUSINESS_FORM.CANCEL');
			cancelButton.style.cssText = 'padding:10px 16px;border-radius:999px;border:1px solid #d1d5db;background:#fff;color:#111827;cursor:pointer;';

			const captureButton = document.createElement('button');
			captureButton.type = 'button';
			captureButton.textContent = this.translate.instant('ADD_BUSINESS_FORM.CAPTURE_SHOP_IMAGE');
			captureButton.style.cssText = 'padding:10px 16px;border-radius:999px;border:none;background:#1d4ed8;color:#fff;cursor:pointer;';

			actions.append(cancelButton, captureButton);
			card.append(video, actions);
			overlay.append(card);
			document.body.appendChild(overlay);

			const cleanup = () => {
				stream.getTracks().forEach(track => track.stop());
				overlay.remove();
			};

			cancelButton.onclick = () => {
				cleanup();
				resolve(null);
			};

			captureButton.onclick = () => {
				if (!video.videoWidth || !video.videoHeight) {
					return;
				}
				const canvas = document.createElement('canvas');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				const context = canvas.getContext('2d');
				if (!context) {
					cleanup();
					resolve(null);
					return;
				}
				context.drawImage(video, 0, 0, canvas.width, canvas.height);
				const imageData = canvas.toDataURL('image/jpeg', 0.92);
				cleanup();
				resolve(imageData);
			};

			video.srcObject = stream;
			video.onloadedmetadata = () => {
				void video.play();
			};
		});
	}

	/**
	 * Get browser geolocation immediately after webcam capture.
	 */
	async getBrowserGeolocation(loading: HTMLIonLoadingElement) {
		if (!navigator.geolocation) {
			loading.dismiss();
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
				'danger'
			);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				this.latitude = position.coords.latitude;
				this.longitude = position.coords.longitude;
				this.setLocationCaptureMetadata('browser_camera_browser_gps');
				loading.dismiss();
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.LOCATION_FROM_DEVICE'),
					'success'
				);
				await this.confirmLocation();
			},
			async () => {
				loading.dismiss();
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
					'danger'
				);
			},
			{ enableHighAccuracy: true, timeout: 15000 }
		);
	}

	/**
	 * Fallback: Get device location using Geolocation plugin
	 */
	async getDeviceLocation(loading: HTMLIonLoadingElement) {
		try {
			// Check geolocation permissions
			const permissions = await Geolocation.checkPermissions();
			if (permissions.location !== 'granted') {
				const requestResult = await Geolocation.requestPermissions();
				if (requestResult.location !== 'granted') {
					loading.dismiss();
					await this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.LOCATION_PERMISSION_DENIED'),
						'warning'
					);
					return;
				}
			}

			// Get current position
			const position = await Geolocation.getCurrentPosition({
				enableHighAccuracy: true,
				timeout: 15000
			});

			this.latitude = position.coords.latitude;
			this.longitude = position.coords.longitude;
			this.setLocationCaptureMetadata('native_camera_native_gps');

			loading.dismiss();

			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_FROM_DEVICE'),
				'success'
			);

			await this.confirmLocation();

		} catch (error) {
			loading.dismiss();
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
				'danger'
			);
		}
	}

	/**
	 * Show confirmation dialog for captured location
	 */
	async confirmLocation() {
		const alert = await this.alertController.create({
			header: this.translate.instant('ADD_BUSINESS_FORM.CONFIRM_LOCATION'),
			message: this.translate.instant('ADD_BUSINESS_FORM.LOCATION_DETAILS', {
				latitude: this.latitude.toFixed(6),
				longitude: this.longitude.toFixed(6)
			}),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.RETAKE'),
					role: 'cancel',
					handler: () => {
						this.captureShopImage();
					}
				},
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.CONFIRM'),
					handler: () => {
						this.showToast(
							this.translate.instant('ADD_BUSINESS_FORM.LOCATION_CONFIRMED'),
							'success'
						);
					}
				}
			]
		});
		await alert.present();
	}

	/**
	 * Remove captured image and location
	 */
	removeImage() {
		this.capturedImage = '';
		this.latitude = 0;
		this.longitude = 0;
		this.locationCaptureSource = '';
		this.locationCaptured = false;
		this.clearCaptureReference();
	}

	async onSubmit() {
		// Validate location and image are captured
		if (!this.locationCaptured || !this.capturedImage) {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.CAPTURE_LOCATION_FIRST'),
				'warning'
			);
			return;
		}

		if (this.citySearchTerm.trim() && !this.businessForm.get('city')?.value) {
			this.businessForm.get('city')?.markAsTouched();
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.SELECT_CITY_FROM_LIST'),
				'warning'
			);
			return;
		}

		if (this.locationSearchTerm.trim() && !this.businessForm.get('location')?.value) {
			this.businessForm.get('location')?.markAsTouched();
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.SELECT_LOCATION_FROM_LIST'),
				'warning'
			);
			return;
		}

		if (this.businessForm.valid) {
			const loading = await this.loadingController.create({
				message: this.isEditMode ?
					this.translate.instant('ADD_BUSINESS_FORM.UPDATING_LOCATION') :
					this.translate.instant('ADD_BUSINESS_FORM.CREATING_LOCATION')
			});
			await loading.present();

			try {
				// Map form values to backend field names that match BusinessBranch struct
				const formValue = this.businessForm.getRawValue();
				const formData: any = {
					shop_name: formValue.shopName,
					number: formValue.number,
					type_id: formValue.b_type_id || null,
					location: formValue.location,
					state: formValue.state,
					b_city_id: formValue.city,
					address: formValue.address,
					email: formValue.email,
					gst_num: formValue.gstNumber,
					privilege_user: false,
					established_year: formValue.establishedYear || '',
					active_status: true,
					latitude: this.latitude,
					longitude: this.longitude,
					image: this.capturedImage,
					location_capture_source: this.locationCaptureSource || null
				};

				const userId = this.authService.getUserId();
				if (!userId) {
					loading.dismiss();
					await this.showAuthError();
					return;
				}

				if (this.isEditMode && this.locationId) {
					// For update, add the branch_id
					formData.branch_id = this.locationId;
					this.addBusinessService.modifyBusinessBranch(formData)
						.pipe(takeUntil(this.destroy$))
						.subscribe({
							next: async () => {
								loading.dismiss();
								await this.showToast(
									this.translate.instant('ADD_BUSINESS_FORM.UPDATE_SUCCESS'),
									'success'
								);
								this.router.navigate(['/wholesaler/business-locations']);
							},
							error: async () => {
								loading.dismiss();
								await this.showToast(
									this.translate.instant('ADD_BUSINESS_FORM.UPDATE_ERROR'),
									'danger'
								);
							}
						});
				} else {
					this.addBusinessService.createBusinessBranch(formData).subscribe({
						next: async () => {
							loading.dismiss();
							await this.showToast(
								this.translate.instant('ADD_BUSINESS_FORM.CREATE_SUCCESS'),
								'success'
							);
							this.router.navigate(['/wholesaler/business-locations']);
						},
						error: async (error: any) => {
							loading.dismiss();
							console.error('Create error:', error);
							await this.showToast(
								this.translate.instant('ADD_BUSINESS_FORM.CREATE_ERROR'),
								'danger'
							);
						}
					});
				}
			} catch (error) {
				loading.dismiss();
				console.error('Unexpected error:', error);
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.UNEXPECTED_ERROR'),
					'danger'
				);
			}
		} else {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.FILL_REQUIRED_FIELDS'),
				'warning'
			);
			this.markFormGroupTouched();
		}
	}

	async showToast(message: string, color: string) {
		const toast = await this.toastController.create({
			message,
			duration: 3000,
			color,
			position: 'bottom'
		});
		await toast.present();
	}

	markFormGroupTouched() {
		Object.keys(this.businessForm.controls).forEach(key => {
			this.businessForm.get(key)?.markAsTouched();
		});
	}

	private setLocationCaptureMetadata(source: string) {
		this.locationCaptureSource = source;
		this.locationCaptured = true;
		this.updateCaptureReference();
	}

	private updateCaptureReference() {
		this.captureReferenceState = this.getNumericControlValue('state');
		this.captureReferenceCity = this.getNumericControlValue('city');
		this.captureReferenceLocation = this.getNumericControlValue('location');
		this.captureReferenceAddress = this.getNormalizedAddressValue();
	}

	private clearCaptureReference() {
		this.captureReferenceState = null;
		this.captureReferenceCity = null;
		this.captureReferenceLocation = null;
		this.captureReferenceAddress = '';
	}

	private getNumericControlValue(controlName: string): number | null {
		const rawValue = this.businessForm.get(controlName)?.value;
		if (rawValue === null || rawValue === undefined || rawValue === '') {
			return null;
		}
		const numericValue = Number(rawValue);
		return Number.isFinite(numericValue) ? numericValue : null;
	}

	private getNormalizedAddressValue(): string {
		return String(this.businessForm.get('address')?.value || '').trim();
	}

	private hasCompleteLocationContext(
		stateId: number | null,
		cityId: number | null,
		locationId: number | null,
		address: string
	): boolean {
		return stateId !== null && cityId !== null && locationId !== null && address.length > 0;
	}

	private currentFormMatchesCapturedLocation(): boolean {
		return this.captureReferenceState === this.getNumericControlValue('state') &&
			this.captureReferenceCity === this.getNumericControlValue('city') &&
			this.captureReferenceLocation === this.getNumericControlValue('location') &&
			this.captureReferenceAddress === this.getNormalizedAddressValue();
	}

	private async invalidateCaptureIfLocationChanged() {
		if (this.isHydratingLocationContext || !this.locationCaptured || !this.capturedImage) {
			return;
		}

		const currentState = this.getNumericControlValue('state');
		const currentCity = this.getNumericControlValue('city');
		const currentLocation = this.getNumericControlValue('location');
		const currentAddress = this.getNormalizedAddressValue();

		const hasCapturedReference = this.hasCompleteLocationContext(
			this.captureReferenceState,
			this.captureReferenceCity,
			this.captureReferenceLocation,
			this.captureReferenceAddress
		);

		const hasCurrentLocationContext = this.hasCompleteLocationContext(
			currentState,
			currentCity,
			currentLocation,
			currentAddress
		);

		if (!hasCapturedReference) {
			if (hasCurrentLocationContext) {
				this.updateCaptureReference();
			}
			return;
		}

		if (this.currentFormMatchesCapturedLocation()) {
			return;
		}

		this.removeImage();
		await this.showToast(
			this.translate.instant('ADD_BUSINESS_FORM.CAPTURE_REQUIRED_AFTER_LOCATION_CHANGE'),
			'warning'
		);
	}

	getErrorMessage(fieldName: string): string {
		const control = this.businessForm.get(fieldName);
		const fieldLabel = this.translate.instant(this.fieldLabels[fieldName] || fieldName);

		if (control?.errors && control?.touched) {
			if (control.errors['required']) {
				return this.translate.instant('ADD_BUSINESS_FORM.FIELD_REQUIRED', { field: fieldLabel });
			}
			if (control.errors['email']) {
				return this.translate.instant('ADD_BUSINESS_FORM.INVALID_EMAIL');
			}
			if (control.errors['pattern']) {
				switch (fieldName) {
					case 'number':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_PHONE');
					case 'gstNumber':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_GST');
					case 'establishedYear':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_YEAR');
					default:
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_VALUE');
				}
			}
		}
		return '';
	}

	getFormProgress(): number {
		const requiredFields = ['shopName', 'number', 'state', 'city', 'location', 'address', 'email', 'gstNumber', 'pan'];
		const filled = requiredFields.filter(field => {
			const value = this.businessForm.get(field)?.value;
			return value !== null && value !== undefined && value !== '';
		}).length;
		return Math.round((filled / requiredFields.length) * 100);
	}

	goBack() {
		this.router.navigate(['/wholesaler/business-locations']);
	}

	private filterCities(): void {
		const searchTerm = this.citySearchTerm.trim().toLowerCase();
		if (!searchTerm) {
			this.filteredCities = [...this.cities];
			return;
		}

		this.filteredCities = this.cities.filter((city) =>
			city.city_name.toLowerCase().includes(searchTerm) ||
			city.city_shortname.toLowerCase().includes(searchTerm)
		);
	}

	private filterLocations(): void {
		const searchTerm = this.locationSearchTerm.trim().toLowerCase();
		if (!searchTerm) {
			this.filteredLocations = [...this.locations];
			return;
		}

		this.filteredLocations = this.locations.filter((location) =>
			(location.location_name ?? '').toLowerCase().includes(searchTerm)
		);
	}

	private syncCitySearchFromSelection(): void {
		const selectedCityId = this.businessForm.get('city')?.value;
		if (!selectedCityId) {
			return;
		}

		const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
		this.citySearchTerm = selectedCity?.city_name ?? '';
	}

	private syncLocationSearchFromSelection(): void {
		const selectedLocationId = this.businessForm.get('location')?.value;
		if (!selectedLocationId) {
			return;
		}

		const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
		this.locationSearchTerm = selectedLocation?.location_name ?? '';
	}
}