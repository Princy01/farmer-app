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
  carOutline, informationCircleOutline
} from 'ionicons/icons';

import { WholesalerApiService, WholesalerProduct } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MenuService } from '../services/menu.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguagePopoverComponent } from './language-popover.component';
import { Subject, takeUntil, debounceTime, switchMap } from 'rxjs';

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
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  items: WholesalerProduct[] = [];
  filteredItems: WholesalerProduct[] = [];
  currentPage = 0;
  itemsPerPage = 10;
  isInfiniteScrollEnabled = true;
  isLoading = false;
  isSearching = false;

  searchTerm = '';

  notifications = 0;
  messages = 0;

  languages: Language[] = [];
  currentLanguage = 'English';

  /** Polling interval for auto-refresh */
  private pollInterval: any;

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
      carOutline, informationCircleOutline
    });

    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    this.setItemsPerPage();
    this.applyStoredLanguage();
    this.checkAuthAndLoad();
    this.fetchLanguages();
    this.startPolling();
    this.initializeSearch();
  }

  //  Initialize search with debounce and switchMap to prevent race conditions

  private initializeSearch(): void {
    this.search$
      .pipe(
        debounceTime(300),
        switchMap(searchTerm => {
          this.isSearching = true;
          this.searchTerm = searchTerm;
          return this.wholesalerService.getWholesalerProducts(0, this.itemsPerPage, searchTerm || undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.items = data;
          this.filteredItems = data;
          this.currentPage = 0;
          this.isSearching = false;
          this.isInfiniteScrollEnabled = data.length >= this.itemsPerPage;
        },
        error: () => {
          this.isSearching = false;
          this.showErrorAlert(
            this.translate.instant('WHOLESALER_HOME.ERROR'),
            this.translate.instant('WHOLESALER_HOME.SEARCH_ERROR')
          );
        }
      });
  }

  ngAfterViewInit() {
    const items = document.querySelectorAll('ion-item');
    items.forEach((item, index) => {
      (item as HTMLElement).style.animationDelay = `${index * 0.05}s`;
    });
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

    // Starts polling for product updates every 1 minute

  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.refreshItems();
    }, 60000);
  }

  //  Stops polling for product updates

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private applyStoredLanguage() {
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    this.translate.use(savedLang);
  }

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
          this.isLoading = false;
          const errorMsg = this.getErrorMessage(error);
          await this.showErrorAlert(
            this.translate.instant('WHOLESALER_HOME.ERROR'),
            errorMsg
          );
        }
      });
  }

  refreshItems() {
    this.checkAuthAndLoad();
  }

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
    } finally {
      event.target.complete();
    }
  }

  searchItems(event: any) {
    const value = event.target.value || '';
    this.search$.next(value);
  }

  viewDetails(item: WholesalerProduct) {
    this.router.navigate(['/wholesaler/product-details', item.product_id]);
  }

  async navigateToHome() {
    try {
      await this.menuService.closeMenu();
      const content = document.querySelector('ion-content');
      content?.scrollToTop(300);
    } catch (error) {
      // Navigation to home failed - silently continue
    }
  }

  async navigateToBusinessLocations() {
    await this.safeNavigate('/wholesaler/business-locations');
  }

  async navigateToBusinessInfo() {
    await this.safeNavigate('/wholesaler/business-info');
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
      // Navigation to order creation failed - silently continue
    }
  }

  private async safeNavigate(route: string) {
    try {
      await this.menuService.closeMenu();
      await this.router.navigate([route]);
    } catch (error) {
      await this.showErrorAlert(
        this.translate.instant('WHOLESALER_HOME.ERROR'),
        this.translate.instant('WHOLESALER_HOME.NAVIGATION_ERROR')
      );
    }
  }

  async openMenu() {
    try {
      await this.menuService.openMenu();
    } catch (error) {
      // Menu failed to open - user can try again
    }
  }

  async closeMenu() {
    try {
      await this.menuService.closeMenu();
    } catch (error) {
      // Menu failed to close - silently continue
    }
  }

  async toggleMenu() {
    try {
      await this.menuCtrl.toggle();
    } catch (error) {
      // Error handling for menu operation
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
              // Logout failed - redirect anyway
              this.authService.logout();
              await this.router.navigate(['/login']);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  openNotifications() {
    this.router.navigate(['/wholesaler/notifications']);
  }

  openTrends() {
    this.router.navigate(['/wholesaler/trends']);
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
        error: () => {
          // Languages failed to fetch - use defaults
          // This is non-critical, app continues with current language
        }
      });
  }

  async openLanguagePopover(event: Event) {
    try {
      const currentLangCode = this.languages.find(l => l.name === this.currentLanguage)?.code.toLowerCase() || 'en';
      const popover = await this.popoverCtrl.create({
        component: LanguagePopoverComponent,
        event,
        translucent: true,
        componentProps: {
          languages: this.languages,
          currentLanguage: currentLangCode,
          onSelect: (lang: Language) => this.saveLanguagePreference(lang.code)
        }
      });
      await popover.present();
      await popover.onDidDismiss();
    } catch (error) {
      // Language popover failed to open - user can dismiss and continue
    }
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) return;

    const normalizedLangCode = langCode.toLowerCase();
    this.wholesalerService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.translate.use(normalizedLangCode);
          this.currentLanguage = lang.name;
          localStorage.setItem('preferred_language', normalizedLangCode);
        },
        error: (error) => {
          this.showErrorAlert(
            this.translate.instant('WHOLESALER_HOME.ERROR'),
            this.translate.instant('WHOLESALER_HOME.LANGUAGE_SAVE_ERROR')
          );
        }
      });
  }

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

  /**
   * Map error response to user-friendly message
   */
  private getErrorMessage(error: any): string {
    if (!error) {
      return this.translate.instant('WHOLESALER_HOME.LOAD_PRODUCTS_ERROR');
    }

    // Network timeout
    if (error.name === 'TimeoutError') {
      return this.translate.instant('WHOLESALER_HOME.REQUEST_TIMEOUT_ERROR');
    }

    // Network error (no connection)
    if (error.status === 0 || error.error?.type === 'error') {
      return this.translate.instant('WHOLESALER_HOME.NETWORK_ERROR');
    }

    // 401 Unauthorized
    if (error.status === 401) {
      return this.translate.instant('WHOLESALER_HOME.SESSION_EXPIRED');
    }

    // 403 Forbidden
    if (error.status === 403) {
      return this.translate.instant('WHOLESALER_HOME.NO_PERMISSION');
    }

    // 404 Not Found
    if (error.status === 404) {
      return this.translate.instant('WHOLESALER_HOME.NOT_FOUND');
    }

    // 429 Too Many Requests
    if (error.status === 429) {
      return this.translate.instant('WHOLESALER_HOME.RATE_LIMIT_ERROR');
    }

    // 500+ Server errors
    if (error.status >= 500) {
      return this.translate.instant('WHOLESALER_HOME.SERVER_ERROR');
    }

    return this.translate.instant('WHOLESALER_HOME.LOAD_PRODUCTS_ERROR');
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