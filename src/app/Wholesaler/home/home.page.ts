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
    this.translate.use('en');
  }

  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit() {
    this.setItemsPerPage();
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
        error: async () => {
          this.isLoading = false;
          const alert = await this.alertCtrl.create({
            header: this.translate.instant('COMMON.ERROR'),
            message: this.translate.instant('COMMON.LOAD_FAILED'),
            buttons: ['OK']
          });
          await alert.present();
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
    await this.loadProducts(true);
    event.target.complete();
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
    this.router.navigate(['/wholesaler/product-details', item.product_id]);
  }

  async navigateToHome() {
    await this.menuService.closeMenu();
    const content = document.querySelector('ion-content');
    content?.scrollToTop(300);
  }

  async navigateToBusinessLocations() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/business-locations']);
  }

  async navigateToUpdateBusiness() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/business-update']);
  }

  async navigateToMyOrders() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/orders']);
  }

  async navigateToPickupOrders() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/pickup-orders']);
  }

  async navigateToStockDashboard() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/stock-dashboard']);
  }

  async navigateToPastOrders() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/past-orders']);
  }

  async navigateToRestockingRecommendations() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/restocking-recommendations']);
  }

  async navigateToMarketOpportunities() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/market-opportunities']);
  }

  async navigateToProfile() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/profile']);
  }

  async navigateToSettings() {
    await this.menuService.closeMenu();
    this.router.navigate(['/wholesaler/settings']);
  }

  createOrder() {
    this.router.navigate(['/wholesaler/for-sale']);
  }

  // =====================================================
  // MENU
  // =====================================================

  openMenu() {
    this.menuService.openMenu();
  }

  closeMenu() {
    this.menuService.closeMenu();
  }

  async toggleMenu() {
    await this.menuCtrl.toggle();
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
            await this.closeMenu();
            this.authService.logout();
            this.router.navigate(['/login']);
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
    console.log('Opening notifications');
  }

  openTrends() {
    this.router.navigate(['/wholesaler/trends']);
  }

  // =====================================================
  // LANGUAGE
  // =====================================================

  fetchLanguages() {
    this.wholesalerService.getLanguages().subscribe({
      next: (langs) => {
        this.languages = langs.map(l => ({ ...l, code: l.code.toLowerCase() }));
      }
    });
  }

  async openLanguagePopover(event: Event) {
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
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) return;

    this.wholesalerService.setLanguagePreference(lang.id).subscribe(() => {
      this.translate.use(langCode);
      this.currentLanguage = lang.name;
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
      header: this.translate.instant('COMMON.AUTH_ERROR'),
      message: this.translate.instant('COMMON.SESSION_EXPIRED'),
      buttons: [{
        text: 'OK',
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
      header: this.translate.instant('COMMON.ACCESS_DENIED'),
      message: this.translate.instant('COMMON.NO_PERMISSION'),
      buttons: ['OK']
    });
    await alert.present();
  }
}