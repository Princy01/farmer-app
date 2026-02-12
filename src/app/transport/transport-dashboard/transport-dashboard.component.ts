import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { languageOutline, carOutline, timeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { UpcomingDeliveriesService } from 'src/app/services/upcoming-deliveries.service';
import { DeliveryService } from './delivery.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { LanguagePopoverComponent } from './language-popover.component';
import { TransportLanguageService, Language } from '../services/transport-language.service';

interface UserPreference {
  language: string;
}

@Component({
  selector: 'app-transport-dashboard',
  standalone: true,
  templateUrl: './transport-dashboard.component.html',
  styleUrls: ['./transport-dashboard.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TranslatePipe]
})
export class TransportDashboardComponent implements OnInit {
  selectedTab = 'active';

  activeDeliveries: any[] = [];
  upcomingDeliveries: any[] = [];
  completedDeliveries: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  languages: Language[] = [];
  currentLanguage = 'English'; // Default
  userPreference: UserPreference | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
    private languageService: TransportLanguageService
  ) {
    this.translate.setDefaultLang('en');
    addIcons({ languageOutline, carOutline, timeOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.loadDeliveries('active');
    this.fetchUserPreference();
    this.fetchLanguages();
  }

  fetchLanguages() {
    this.languageService.getLanguages().subscribe({
      next: (langs) => {
        this.languages = langs;
      },
      error: (err) => {
        console.error('Error fetching languages:', err);
        // Fallback to default languages if API fails
        this.languages = [
          { id: 1, code: 'en', name: 'English' },
          { id: 2, code: 'hi', name: 'हिंदी' }
        ];
      }
    });
  }

  fetchUserPreference() {
    // First check localStorage for saved language
    const savedLangCode = this.languageService.getStoredLanguageCode();

    // Try to get user preference from backend
    this.languageService.getUserPreference().subscribe({
      next: (pref) => {
        this.userPreference = pref;
        // Use backend preference if available, otherwise use localStorage
        // Normalize to lowercase to match JSON files
        const langCode = (pref.language || savedLangCode).toLowerCase();
        this.setLanguage(langCode);
      },
      error: (err) => {
        console.error('Error fetching user preference:', err);
        // Fallback to localStorage if API fails
        this.userPreference = { language: savedLangCode };
        this.setLanguage(savedLangCode.toLowerCase());
      }
    });
  }

  setLanguage(langCode: string) {
    // Ensure language code is lowercase to match JSON files (en.json, hi.json)
    const normalizedLangCode = langCode.toLowerCase();

    this.translate.use(normalizedLangCode).subscribe({
      next: () => {
        const lang = this.languages.find(l => l.code.toLowerCase() === normalizedLangCode);
        this.currentLanguage = lang ? lang.name : 'English';
        // Save to localStorage for persistence
        this.languageService.saveLanguageCode(normalizedLangCode);
      },
      error: (err) => {
        console.error('Error loading translation file for', normalizedLangCode, err);
        this.translate.use('en');
        this.currentLanguage = 'English';
        this.languageService.saveLanguageCode('en');
      }
    });
  }

  saveLanguagePreference(langCode: string) {
    // Normalize to lowercase for consistency
    const normalizedLangCode = langCode.toLowerCase();
    const lang = this.languages.find(l => l.code.toLowerCase() === normalizedLangCode);

    if (lang) {
      // Save to backend
      this.languageService.setLanguagePreference(lang.id).subscribe({
        next: (response) => {
          console.log('Language preference saved to backend:', response);
          this.setLanguage(normalizedLangCode);
        },
        error: (err) => {
          console.error('Error saving language preference to backend:', err);
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

    serviceCall.subscribe({
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
        this.errorMessage = err.message || 'An error occurred while loading deliveries.';
        console.error('Error loading deliveries:', err);
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
}