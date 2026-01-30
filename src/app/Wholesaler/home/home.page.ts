import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import {
  IonicModule,
  NavController,
  MenuController,
  LoadingController,
  AlertController,
  PopoverController
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline, personCircleSharp, arrowForwardCircleSharp,
  chevronForwardOutline, listCircleOutline, addCircleOutline,
  timeOutline, statsChartOutline, personOutline,
  trendingUpOutline, reloadOutline, settingsOutline,
  closeOutline, locationOutline, menuOutline,
  homeOutline, businessOutline, cubeOutline,
  analyticsOutline, pulse, bulbOutline,
  logOutOutline, createOutline, notificationsOutline,
  receiptOutline, searchOutline, chevronDownCircleOutline,
  languageOutline, chevronDownOutline, checkmarkOutline,
  carOutline
} from 'ionicons/icons';

import { WholesalerApiService, WholesalerProduct } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MenuService } from '../services/menu.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguagePopoverComponent } from './language-popover.component';
import { Subject, takeUntil } from 'rxjs';

interface Language {
  id: number;
  code: string;
  name: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe, LanguagePopoverComponent]
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ===== DATA =====
  items: WholesalerProduct[] = [];
  filteredItems: WholesalerProduct[] = [];
  currentPage = 0;
  itemsPerPage = 10;
  isInfiniteScrollEnabled = true;
  isLoading = false;

  // ===== SEARCH =====
  searchTerm = '';
  private searchTimeout: any;

  // ===== UI =====
  notifications = 0;
  messages = 0;

  // ===== LANGUAGE =====
  languages: Language[] = [];
  currentLanguage = 'English';

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private menuCtrl: MenuController,
    private wholesalerService: WholesalerApiService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    public menuService: MenuService,
    private translate: TranslateService,
    private popoverCtrl: PopoverController
  ) {
    addIcons({
      chatbubblesOutline, personCircleSharp, arrowForwardCircleSharp,
      chevronForwardOutline, listCircleOutline, addCircleOutline,
      timeOutline, statsChartOutline, personOutline,
      trendingUpOutline, reloadOutline, settingsOutline,
      closeOutline, locationOutline, menuOutline,
      homeOutline, businessOutline, cubeOutline,
      analyticsOutline, pulse, bulbOutline,
      logOutOutline, createOutline, notificationsOutline,
      receiptOutline, searchOutline, chevronDownCircleOutline,
      languageOutline, chevronDownOutline, checkmarkOutline,
      carOutline
    });

    this.translate.setDefaultLang('en');
  }

  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit() {
    this.setItemsPerPage();
    this.loadLanguagePreference();
    this.checkAuthAndLoad();
    this.fetchLanguages();
  }

  ngAfterViewInit() {
    const items = document.querySelectorAll('ion-item');
    items.forEach((item, index) => {
      (item as HTMLElement).style.animationDelay = `${index * 0.05}s`;
    });
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =====================================================
  // AUTH + INITIAL LOAD
  // =====================================================

  private checkAuthAndLoad() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadProducts(true);
  }

  // =====================================================
  // DATA LOADING
  // =====================================================

  async loadProducts(reset = false) {
    if (this.isLoading) return;

    if (reset) {
      this.currentPage = 0;
      this.items = [];
      this.filteredItems = [];
      this.isInfiniteScrollEnabled = true;
    }

    this.isLoading = true;

    this.wholesalerService
      .getWholesalerProducts(
        this.currentPage,
        this.itemsPerPage,
        this.searchTerm || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.items = [...this.items, ...data];
          this.filteredItems = [...this.items];

          if (data.length < this.itemsPerPage) {
            this.isInfiniteScrollEnabled = false;
          } else {
            this.currentPage++;
          }

          this.isLoading = false;
        },
        error: async (error) => {
          console.error('Error loading products:', error);
          this.isLoading = false;
          await this.showErrorAlert(
            this.translate.instant('WHOLESALER_HOME.ERROR'),
            this.translate.instant('WHOLESALER_HOME.LOAD_PRODUCTS_ERROR')
          );
        }
      });
  }

  refreshItems() {
    this.checkAuthAndLoad();
  }

  // =====================================================
  // INFINITE SCROLL
  // =====================================================

  onInfiniteScroll(event: any) {
    this.loadProducts();
    event.target.complete();

    if (!this.isInfiniteScrollEnabled) {
      event.target.disabled = true;
    }
  }

  async handleRefresh(event: any) {
    try {
      await this.loadProducts(true);
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      event.target.complete();
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  searchItems(event: any) {
    const value = event.target.value || '';

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value;
      this.loadProducts(true);
    }, 300);
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  viewDetails(item: WholesalerProduct) {
    try {
      this.router.navigate(['/wholesaler/product-details', item.product_id]);
    } catch (error) {
      console.error('Navigation error:', error);
      this.showErrorAlert(
        this.translate.instant('WHOLESALER_HOME.ERROR'),
        this.translate.instant('WHOLESALER_HOME.NAVIGATION_ERROR')
      );
    }
  }

  async navigateToHome() {
    try {
      await this.menuService.closeMenu();
      const content = document.querySelector('ion-content');
      content?.scrollToTop(300);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async navigateToBusinessLocations() {
    await this.safeNavigate('/wholesaler/business-locations');
  }

  async navigateToUpdateBusiness() {
    await this.safeNavigate('/wholesaler/business-update');
  }

  async navigateToMyOrders() {
    await this.safeNavigate('/wholesaler/orders');
  }

  async navigateToPickupOrders() {
    await this.safeNavigate('/wholesaler/pickup-orders');
  }

  async navigateToStockDashboard() {
    await this.safeNavigate('/wholesaler/stock-dashboard');
  }

  async navigateToPastOrders() {
    await this.safeNavigate('/wholesaler/past-orders');
  }

  async navigateToRestockingRecommendations() {
    await this.safeNavigate('/wholesaler/restocking-recommendations');
  }

  async navigateToMarketOpportunities() {
    await this.safeNavigate('/wholesaler/market-opportunities');
  }

  async navigateToProfile() {
    await this.safeNavigate('/wholesaler/profile');
  }

  async navigateToSettings() {
    await this.safeNavigate('/wholesaler/settings');
  }

  createOrder() {
    try {
      this.router.navigate(['/wholesaler/for-sale']);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  private async safeNavigate(route: string) {
    try {
      await this.menuService.closeMenu();
      await this.router.navigate([route]);
    } catch (error) {
      console.error('Navigation error:', error);
      await this.showErrorAlert(
        this.translate.instant('WHOLESALER_HOME.ERROR'),
        this.translate.instant('WHOLESALER_HOME.NAVIGATION_ERROR')
      );
    }
  }

  // =====================================================
  // MENU
  // =====================================================

  async openMenu() {
    try {
      await this.menuService.openMenu();
    } catch (error) {
      console.error('Error opening menu:', error);
    }
  }

  async closeMenu() {
    try {
      await this.menuService.closeMenu();
    } catch (error) {
      console.error('Error closing menu:', error);
    }
  }

  async toggleMenu() {
    try {
      await this.menuCtrl.toggle();
    } catch (error) {
      console.error('Error toggling menu:', error);
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('WHOLESALER_HOME.LOGOUT'),
      message: this.translate.instant('WHOLESALER_HOME.LOGOUT_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('WHOLESALER_HOME.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('WHOLESALER_HOME.LOGOUT'),
          handler: async () => {
            try {
              await this.closeMenu();
              this.authService.logout();
              await this.router.navigate(['/login']);
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // =====================================================
  // HEADER ACTIONS
  // =====================================================

  openNotifications() {
    try {
      this.router.navigate(['/wholesaler/notifications']);
    } catch (error) {
      console.error('Error opening notifications:', error);
    }
  }

  openTrends() {
    try {
      this.router.navigate(['/wholesaler/trends']);
    } catch (error) {
      console.error('Error opening trends:', error);
    }
  }

  // =====================================================
  // LANGUAGE
  // =====================================================

  private loadLanguagePreference() {
    const savedLang = localStorage.getItem('wholesaler_language');
    if (savedLang) {
      this.translate.use(savedLang);
    }
  }

  fetchLanguages() {
    this.wholesalerService.getLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (langs) => {
          this.languages = langs.map(l => ({ ...l, code: l.code.toLowerCase() }));
          const currentLang = this.translate.currentLang || 'en';
          const lang = this.languages.find(l => l.code === currentLang);
          if (lang) {
            this.currentLanguage = lang.name;
          }
        },
        error: (error) => {
          console.error('Error fetching languages:', error);
        }
      });
  }

  async openLanguagePopover(event: Event) {
    try {
      const popover = await this.popoverCtrl.create({
        component: LanguagePopoverComponent,
        event,
        translucent: true,
        componentProps: {
          languages: this.languages,
          currentLanguage: this.currentLanguage,
          onSelect: (lang: Language) => this.saveLanguagePreference(lang.code)
        }
      });
      await popover.present();
      await popover.onDidDismiss();
    } catch (error) {
      console.error('Error opening language popover:', error);
    }
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) return;

    this.wholesalerService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.translate.use(langCode);
          this.currentLanguage = lang.name;
          localStorage.setItem('wholesaler_language', langCode);
        },
        error: (error) => {
          console.error('Error saving language preference:', error);
          this.showErrorAlert(
            this.translate.instant('WHOLESALER_HOME.ERROR'),
            this.translate.instant('WHOLESALER_HOME.LANGUAGE_SAVE_ERROR')
          );
        }
      });
  }

  // =====================================================
  // UTILS
  // =====================================================

  private setItemsPerPage() {
    if (window.innerWidth >= 1536) this.itemsPerPage = 20;
    else if (window.innerWidth >= 1280) this.itemsPerPage = 16;
    else if (window.innerWidth >= 1024) this.itemsPerPage = 12;
    else if (window.innerWidth >= 768) this.itemsPerPage = 8;
    else this.itemsPerPage = 5;
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('WHOLESALER_HOME.AUTH_ERROR'),
      message: this.translate.instant('WHOLESALER_HOME.SESSION_EXPIRED'),
      buttons: [{
        text: this.translate.instant('WHOLESALER_HOME.OK'),
        handler: () => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('WHOLESALER_HOME.ACCESS_DENIED'),
      message: this.translate.instant('WHOLESALER_HOME.NO_PERMISSION'),
      buttons: [this.translate.instant('WHOLESALER_HOME.OK')]
    });
    await alert.present();
  }

  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [this.translate.instant('WHOLESALER_HOME.OK')]
    });
    await alert.present();
  }
}