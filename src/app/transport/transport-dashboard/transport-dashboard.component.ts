import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { languageOutline, carOutline, timeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { DeliveryService } from './delivery.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { LanguagePopoverComponent } from './language-popover.component';
import { TranslateApiService } from '@/services/translate-api.service';
import { TransportRequestService } from '../transport-requests/transport-requests.service';

interface Language {
  id: number;
  code: string;
  name: string;
}

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class TransportDashboardComponent implements OnInit, OnDestroy {
  selectedTab = 'active';

  activeDeliveries: any[] = [];
  upcomingDeliveries: any[] = [];
  completedDeliveries: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  isCancellingJob: { [key: number]: boolean } = {};

  languages: Language[] = [];
  currentLanguage = 'English'; // Default

  private destroy$ = new Subject<void>();

  constructor(
    private deliveryService: DeliveryService,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
    private translateApiService: TranslateApiService,
    private transportRequestService: TransportRequestService,
    private alertCtrl: AlertController
  ) {
    this.translate.setDefaultLang('en');
    addIcons({ languageOutline, carOutline, timeOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.loadDeliveries('active');
    this.applyStoredLanguage();
    this.fetchLanguages();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyStoredLanguage() {
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    this.translate.use(savedLang);
  }

  fetchLanguages() {
    this.translateApiService.getLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (langs) => {
          this.languages = langs.map(l => ({ ...l, code: l.code.toLowerCase() }));
          const currentLang = this.translate.currentLang || 'en';
          const lang = this.languages.find(l => l.code === currentLang);
          if (lang) this.currentLanguage = lang.name;
        },
        error: () => {
          // Fallback to default languages if API fails
          this.languages = [
            { id: 1, code: 'en', name: 'English' },
            { id: 2, code: 'hi', name: 'हिंदी' }
          ];
        }
      });
  }


  setLanguage(langCode: string) {
    // Ensure language code is lowercase to match JSON files (en.json, hi.json)
    const normalizedLangCode = langCode.toLowerCase();

    this.translate.use(normalizedLangCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const lang = this.languages.find(l => l.code.toLowerCase() === normalizedLangCode);
        this.currentLanguage = lang ? lang.name : 'English';
        // Save to localStorage for persistence
        localStorage.setItem('preferred_language', normalizedLangCode);
      },
      error: () => {
        this.translate.use('en').pipe(takeUntil(this.destroy$)).subscribe();
        this.currentLanguage = 'English';
        localStorage.setItem('preferred_language', 'en');
      }
    });
  }

  saveLanguagePreference(langCode: string) {
    // Normalize to lowercase for consistency
    const normalizedLangCode = langCode.toLowerCase();
    const lang = this.languages.find(l => l.code.toLowerCase() === normalizedLangCode);

    if (lang) {
      // Save to backend
      this.translateApiService.setLanguagePreference(lang.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.setLanguage(normalizedLangCode);
          },
          error: () => {
            // Still change language locally even if backend save fails
            this.setLanguage(normalizedLangCode);
          }
        });
    }
  }

  async openLanguagePopover(event: Event) {
    const currentLangCode = this.languages.find(l => l.name === this.currentLanguage)?.code.toLowerCase() || 'en';
    const popover = await this.popoverCtrl.create({
      component: LanguagePopoverComponent,
      event: event,
      translucent: true,
      componentProps: {
        languages: this.languages,
        currentLanguage: currentLangCode,
        onSelect: (lang: Language) => this.saveLanguagePreference(lang.code)
      }
    });
    await popover.present();
  }

  onTabChange() {
    this.loadDeliveries(this.selectedTab);
  }

  loadDeliveries(tab: string) {
    this.isLoading = true;
    this.errorMessage = null;
    let serviceCall: Observable<any>;

    switch (tab) {
      case 'active':
        serviceCall = this.deliveryService.getActiveDeliveries();
        break;
      case 'upcoming':
        serviceCall = this.deliveryService.getUpcomingDeliveries();
        break;
      case 'completed':
        serviceCall = this.deliveryService.getCompletedDeliveries();
        break;
      default:
        return;
    }

    serviceCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          switch (tab) {
            case 'active':
              this.activeDeliveries = res.deliveries || [];
              break;
            case 'upcoming':
              this.upcomingDeliveries = res.deliveries || [];
              break;
            case 'completed':
              this.completedDeliveries = res.deliveries || [];
              break;
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          // Use translation key from error message or fallback
          this.errorMessage = err.message || 'TRANSPORT_DASHBOARD.LOAD_DELIVERIES_ERROR';
        }
      });
  }

  getPickupLocations(orders: any[]): string {


    const pickupLocations = new Set<string>();

    orders.forEach((order: any) => {
      if (order.pickup_branch && order.pickup_branch.branch_address) {
        pickupLocations.add(order.pickup_branch.branch_address);
      }
    });
    const prefix = pickupLocations.size === 1 ? '' : 'Multiple locations [ ';
    const suffix = pickupLocations.size === 1 ? '' : ' ]';

    return prefix + Array.from(pickupLocations).join(', ') + suffix || 'Multiple locations';
  }

  getDropoffLocation(orders: any[]): string {


    // Use first order's delivery address
    const firstOrder = orders[0];

    // First try retailer_branch if it exists
    if (firstOrder.dropoff_branch &&
      Object.keys(firstOrder.dropoff_branch).length > 0 &&
      firstOrder.dropoff_branch.branch_address) {
      return firstOrder.dropoff_branch.branch_address;
    }

    // Otherwise use delivery_address
    return firstOrder.delivery_address || 'Address not available';
  }

  async promptCancelDelivery(job: any): Promise<void> {
    const jobId = job?.job_id;
    if (!jobId || this.isCancellingJob[jobId]) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_TITLE'),
      message: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_MESSAGE', { jobId }),
      buttons: [
        {
          text: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_ABORT'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_ACTION'),
          handler: () => this.cancelDeliveryJob(jobId)
        }
      ]
    });

    await alert.present();
  }

  private cancelDeliveryJob(jobId: number): void {
    this.isCancellingJob[jobId] = true;

    this.transportRequestService.cancelJob(jobId, 'driver_cancelled')
      .subscribe({
        next: async () => {
          this.isCancellingJob[jobId] = false;
          await this.showCancelJobSuccess();
          this.loadDeliveries('active');
        },
        error: async () => {
          this.isCancellingJob[jobId] = false;
          await this.showCancelJobError();
        }
      });
  }

  private async showCancelJobSuccess(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_SUCCESS_TITLE'),
      message: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_SUCCESS_MESSAGE'),
      buttons: [this.translate.instant('TRANSPORT_DASHBOARD.OK')]
    });
    await alert.present();
  }

  private async showCancelJobError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_ERROR_TITLE'),
      message: this.translate.instant('TRANSPORT_DASHBOARD.CANCEL_JOB_ERROR_MESSAGE'),
      buttons: [this.translate.instant('TRANSPORT_DASHBOARD.OK')]
    });
    await alert.present();
  }
}