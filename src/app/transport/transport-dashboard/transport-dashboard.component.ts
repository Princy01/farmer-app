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

interface UserPreference {
  language: string;
}

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
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TranslatePipe, LanguagePopoverComponent]
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

  constructor(private deliveryService: DeliveryService, private translate: TranslateService, private popoverCtrl: PopoverController) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    addIcons({ languageOutline, carOutline, timeOutline, checkmarkCircleOutline }); // Removed unused icons
  }

  ngOnInit() {
    this.loadDeliveries('active');
    this.fetchUserPreference();
    this.fetchLanguages();
  }

  fetchLanguages() {
    // Assuming a service method exists; adjust as needed (e.g., from a shared service)
    // For now, using fallback data similar to home.page
    this.languages = [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'hi', name: 'हिंदी' }
    ];
  }

  fetchUserPreference() {
    // Assuming a service method exists; adjust as needed
    // For now, using fallback
    this.userPreference = { language: 'en' };
    this.setLanguage('en');
  }

  setLanguage(langCode: string) {
    this.translate.use(langCode).subscribe({
      next: () => {
        const lang = this.languages.find(l => l.code === langCode);
        this.currentLanguage = lang ? lang.name : 'English';
      },
      error: (err) => {
        console.error('Error loading translation file for', langCode, err);
        this.translate.use('en');
        this.currentLanguage = 'English';
      }
    });
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (lang) {
      // Assuming a service method exists; adjust as needed
      // this.someService.setLanguagePreference(lang.id).subscribe({...});
      this.setLanguage(langCode);
    }
  }

  async openLanguagePopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: LanguagePopoverComponent,
      event: event,
      translucent: true,
      componentProps: {
        languages: this.languages,
        currentLanguage: this.currentLanguage,
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
}