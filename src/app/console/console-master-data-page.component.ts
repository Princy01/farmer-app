import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { ConsoleAdminService } from './console-admin.service';
import { ConsoleCity, ConsoleLocation, ConsoleState } from './console-admin.models';

@Component({
  selector: 'app-console-master-data-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  templateUrl: './console-master-data-page.component.html',
  styleUrls: ['./console-master-data-page.component.scss'],
})
export class ConsoleMasterDataPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  protected isLoading = true;
  protected isSaving = false;
  protected errorMessage: string | null = null;

  protected states: ConsoleState[] = [];
  protected cities: ConsoleCity[] = [];
  protected locations: ConsoleLocation[] = [];

  protected readonly stateForm = this.fb.nonNullable.group({
    state_name: ['', [Validators.required, Validators.maxLength(50)]],
    state_shortname: ['', [Validators.required, Validators.maxLength(10)]],
  });

  protected readonly cityForm = this.fb.nonNullable.group({
    city_name: ['', [Validators.required, Validators.maxLength(50)]],
    city_shortname: ['', [Validators.required, Validators.maxLength(5)]],
    state_id: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly locationForm = this.fb.nonNullable.group({
    location_name: ['', [Validators.required, Validators.maxLength(50)]],
    state_id: [0, [Validators.required, Validators.min(1)]],
    city_id: [0, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ConsoleAdminService,
    private readonly toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.locationForm.controls.state_id.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.locationForm.patchValue({ city_id: 0 }, { emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected get citiesForSelectedState(): ConsoleCity[] {
    const stateId = this.locationForm.controls.state_id.value;
    return this.cities.filter((city) => city.state_id === stateId);
  }

  protected async createState(): Promise<void> {
    if (this.stateForm.invalid || this.isSaving) {
      this.stateForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.service.createState(this.stateForm.getRawValue())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: async () => {
          this.stateForm.reset({ state_name: '', state_shortname: '' });
          await this.presentToast('State added successfully.');
          this.loadData();
        },
        error: async (error) => {
          await this.presentToast(error?.error?.error || 'We could not add the state right now.');
        },
      });
  }

  protected async createCity(): Promise<void> {
    if (this.cityForm.invalid || this.isSaving) {
      this.cityForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.service.createCity(this.cityForm.getRawValue())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: async () => {
          this.cityForm.reset({ city_name: '', city_shortname: '', state_id: 0 });
          await this.presentToast('City added successfully.');
          this.loadData();
        },
        error: async (error) => {
          await this.presentToast(error?.error?.error || 'We could not add the city right now.');
        },
      });
  }

  protected async createLocation(): Promise<void> {
    if (this.locationForm.invalid || this.isSaving) {
      this.locationForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.service.createLocation(this.locationForm.getRawValue())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: async () => {
          this.locationForm.reset({ location_name: '', state_id: 0, city_id: 0 });
          await this.presentToast('Location added successfully.');
          this.loadData();
        },
        error: async (error) => {
          await this.presentToast(error?.error?.error || 'We could not add the location right now.');
        },
      });
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      states: this.service.getStates(),
      cities: this.service.getCities(),
      locations: this.service.getLocations(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: ({ states, cities, locations }) => {
          this.states = states;
          this.cities = cities;
          this.locations = locations;
        },
        error: () => {
          this.errorMessage = 'We could not load master data right now.';
        },
      });
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2400,
      position: 'top',
      color: 'dark',
    });
    await toast.present();
  }
}
