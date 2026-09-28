import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, MenuController, AlertController, PopoverController, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BuyerApiService, Category } from '../services/buyer-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { addIcons } from 'ionicons';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, interval, takeUntil } from 'rxjs';
import {
  personCircleOutline,
  locationOutline,
  chevronForwardOutline,
  cartOutline,
  personOutline,
  archiveOutline,
  linkOutline,
  settingsOutline,
  closeOutline,
  statsChartOutline,
  gridOutline,
  alertCircleOutline,
  refreshOutline,
  menuOutline,
  createOutline,
  logOutOutline,
  languageOutline,
  chevronDownOutline,
  businessOutline,
  walletOutline,
  timeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { LanguagePopoverComponent } from './language-popover.component';
import { TranslateApiService } from '../../services/translate-api.service';
import {
  RetailerOrderHistory,
  RetailerOrderHistoryResponse,
} from '../retailer-order-history/retailer-order-history.service';
import { resolveCategoryImageUrl, getCategoryFallbackByName } from '../utils/buyer-image.util';

interface UserPreference {
  language: string;
  code: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
}

interface RecentDeliveredOrder {
  orderId: string;
  rawOrderId: number;
  deliveredAt: string;
  deliveredAgo: string;
  deliveryAddress: string;
  finalAmount: number;
  totalAmount: number;
  statusLabel: string;
}

@Component({
  selector: 'app-buyer-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslateModule],
  templateUrl: './buyer-home.component.html',
  styleUrls: ['./buyer-home.component.scss'],
})
export class BuyerHomeComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categories: Category[] = [];
  recentDeliveriesLoading = false;
  recentDeliveriesError = false;
  recentDeliveriesExpanded = false;
  recentDeliveredOrders: RecentDeliveredOrder[] = [];
  languages: Language[] = [];
  currentLanguage = 'English';
  userPreference: UserPreference | null = null;

  private destroy$ = new Subject<void>();
  private recentDeliveriesRefreshSub: Subscription | null = null;
  private readonly DEFAULT_CATEGORY_IMAGE = 'assets/images/category-placeholder.png';
  private readonly RECENT_DELIVERIES_REFRESH_MS = 30000;

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private buyerApiService: BuyerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
    private translateApiService: TranslateApiService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personCircleOutline,
      locationOutline,
      chevronForwardOutline,
      cartOutline,
      personOutline,
      archiveOutline,
      linkOutline,
      settingsOutline,
      closeOutline,
      statsChartOutline,
      gridOutline,
      alertCircleOutline,
      refreshOutline,
      menuOutline,
      createOutline,
      logOutOutline,
      languageOutline,
      chevronDownOutline,
      businessOutline,
      walletOutline,
      timeOutline,
      checkmarkCircleOutline
    });

    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    this.fetchCategories();
    this.fetchRecentDeliveries();
    this.fetchLanguages();
    this.applyStoredLanguage();
  }

  ionViewWillEnter() {
    this.startRecentDeliveriesAutoRefresh();
    this.fetchRecentDeliveries(true);
  }

  ionViewWillLeave() {
    this.stopRecentDeliveriesAutoRefresh();
  }

  ngOnDestroy() {
    this.stopRecentDeliveriesAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyStoredLanguage() {
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    this.setLanguage(savedLang);
  }

  fetchLanguages() {
    this.translateApiService.getLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (languages) => {
          this.languages = languages.map(lang => ({
            ...lang,
            code: lang.code.toLowerCase()
          }));
        },
        error: (error) => {
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_LANGUAGES');
          this.languages = [
            { id: 1, code: 'en', name: 'English' },
            { id: 2, code: 'es', name: 'Español' },
            { id: 3, code: 'fr', name: 'Français' }
          ];
        }
      });
  }

  setLanguage(langCode: string) {
    const normalizedLangCode = langCode.toLowerCase();
    this.translate.use(normalizedLangCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const lang = this.languages.find(l => l.code === normalizedLangCode);
          this.currentLanguage = lang?.name || 'English';
          // Save to localStorage for persistence
          localStorage.setItem('preferred_language', normalizedLangCode);
        },
        error: (err) => {
          this.translate.use('en');
          this.currentLanguage = 'English';
          localStorage.setItem('preferred_language', 'en');
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_TRANSLATIONS');
        }
      });
  }

  saveLanguagePreference(langCode: string) {
    const normalizedLangCode = langCode.toLowerCase();
    const lang = this.languages.find(l => l.code === normalizedLangCode);
    if (!lang) {
      return;
    }

    this.translateApiService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.setLanguage(normalizedLangCode);
          this.showSuccessToast('BUYER_HOME.LANGUAGE_UPDATED');
        },
        error: (error) => {
          // Still change language locally even if backend save fails
          this.setLanguage(normalizedLangCode);
          this.showErrorToast('BUYER_HOME.ERROR_SAVING_LANGUAGE');
        }
      });
  }

  async openLanguagePopover(event: Event) {
    try {
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
    } catch (error) {
      this.showErrorToast('BUYER_HOME.ERROR_OPENING_MENU');
    }
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.errorLoadingCategories = false;

    this.buyerApiService.getSuperCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response || [];
          this.loadingCategories = false;
        },
        error: (error) => {
          this.errorLoadingCategories = true;
          this.loadingCategories = false;
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_CATEGORIES_DESC');
        }
      });
  }

  fetchRecentDeliveries(preserveExpanded = false) {
    this.recentDeliveriesLoading = true;
    this.recentDeliveriesError = false;

    this.buyerApiService.getOrderHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RetailerOrderHistoryResponse) => {
          this.recentDeliveredOrders = this.extractRecentDeliveredOrders(response);
          if (!preserveExpanded) {
            this.recentDeliveriesExpanded = false;
          }
          this.recentDeliveriesLoading = false;
        },
        error: () => {
          this.recentDeliveriesError = true;
          this.recentDeliveriesLoading = false;
        }
      });
  }

  private startRecentDeliveriesAutoRefresh() {
    this.stopRecentDeliveriesAutoRefresh();
    this.recentDeliveriesRefreshSub = interval(this.RECENT_DELIVERIES_REFRESH_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchRecentDeliveries(true);
      });
  }

  private stopRecentDeliveriesAutoRefresh() {
    if (this.recentDeliveriesRefreshSub) {
      this.recentDeliveriesRefreshSub.unsubscribe();
      this.recentDeliveriesRefreshSub = null;
    }
  }

  toggleRecentDeliveries() {
    this.recentDeliveriesExpanded = !this.recentDeliveriesExpanded;
  }

  openRecentDelivery(order: RecentDeliveredOrder) {
    void this.router.navigate(['/buyer/retailer-order-details', order.rawOrderId]);
  }

  getRecentDeliveriesCountLabel(): string {
    const count = this.recentDeliveredOrders.length;
    return count === 1
      ? this.translate.instant('BUYER_HOME.RECENT_DELIVERIES_COUNT_ONE')
      : this.translate.instant('BUYER_HOME.RECENT_DELIVERIES_COUNT_MANY', { count });
  }

  private extractRecentDeliveredOrders(response: RetailerOrderHistoryResponse): RecentDeliveredOrder[] {
    const combinedOrders = [
      ...(response.current_orders || []),
      ...(response.order_history || [])
    ];

    const now = Date.now();
    const recentWindowMs = 30 * 60 * 1000;
    const seenOrderIds = new Set<number>();

    return combinedOrders
      .filter((order) => this.isRecentlyDelivered(order, now, recentWindowMs))
      .map((order) => this.mapToRecentDeliveredOrder(order))
      .filter((order) => {
        if (seenOrderIds.has(order.rawOrderId)) {
          return false;
        }
        seenOrderIds.add(order.rawOrderId);
        return true;
      })
      .sort((a, b) => this.parseServerTimestamp(b.deliveredAt) - this.parseServerTimestamp(a.deliveredAt));
  }

  /**
   * The backend returns timestamps (e.g. actual_delivery_date, date_of_order)
   * as ISO-8601 strings suffixed with 'Z', but the values are already in the
   * server's local timezone rather than true UTC. Parsing them as-is makes
   * `Date` apply an extra local-timezone shift on top of a value that was
   * never UTC to begin with, pushing computed timestamps hours into the
   * future and breaking any "is this recent" comparison against Date.now().
   * Stripping the trailing 'Z' makes `Date` parse the same digits as local
   * wall-clock time, matching what the backend actually meant.
   * TODO: remove this once the backend serializes true UTC (or a correct
   * offset) for these fields.
   */
  private parseServerTimestamp(dateString: string): number {
    const localTimeString = dateString.replace(/Z$/i, '');
    return new Date(localTimeString).getTime();
  }

  private isRecentlyDelivered(order: RetailerOrderHistory, now: number, recentWindowMs: number): boolean {
    const deliveredAt = this.getDeliveredAt(order);
    if (!deliveredAt) {
      return false;
    }

    const deliveredAtMs = this.parseServerTimestamp(deliveredAt);
    if (Number.isNaN(deliveredAtMs)) {
      return false;
    }

    const ageMs = now - deliveredAtMs;
    if (ageMs < 0 || ageMs > recentWindowMs) {
      return false;
    }

    return this.isDeliveredStatus(order);
  }

  private isDeliveredStatus(order: RetailerOrderHistory): boolean {
    const statusText = [
      order.order_status_name,
      order.transport?.job_status,
      order.transport?.delivery_status
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return statusText.includes('delivered') || statusText.includes('complete');
  }

  private getDeliveredAt(order: RetailerOrderHistory): string | null {
    return order.actual_delivery_date || order.date_of_order || null;
  }

  private mapToRecentDeliveredOrder(order: RetailerOrderHistory): RecentDeliveredOrder {
    const deliveredAt = this.getDeliveredAt(order) || new Date().toISOString();

    return {
      orderId: `ORD-${order.order_id.toString().padStart(6, '0')}`,
      rawOrderId: order.order_id,
      deliveredAt,
      deliveredAgo: this.getRelativeTimeLabel(deliveredAt),
      deliveryAddress: order.delivery_address || '',
      finalAmount: order.final_amount || 0,
      totalAmount: order.total_order_amount || 0,
      statusLabel: this.translate.instant('BUYER_HOME.RECENT_DELIVERED_STATUS'),
    };
  }

  private getRelativeTimeLabel(dateString: string): string {
    const timestamp = this.parseServerTimestamp(dateString);
    if (Number.isNaN(timestamp)) {
      return this.translate.instant('BUYER_HOME.RECENT_DELIVERED_JUST_NOW');
    }

    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) {
      return this.translate.instant('BUYER_HOME.RECENT_DELIVERED_JUST_NOW');
    }

    return this.translate.instant('BUYER_HOME.RECENT_DELIVERED_MINUTES_AGO', { minutes });
  }

  onScroll(event: any) {
    if (event?.detail?.scrollTop !== undefined) {
      this.hideHeader = event.detail.scrollTop > 100;
    }
  }

  onImageError(event: any, category?: Category) {
    const target = event?.target || event;
    if (target) {
      target.src = getCategoryFallbackByName(category?.category_name);
    }
  }

  getImagePath(category: Category): string {
    return resolveCategoryImageUrl(category);
  }

  async openMenu() {
    try {
      await this.menuCtrl.open('buyer-menu');
    } catch (error) {
      // Silent fail - menu may already be open
    }
  }

  async closeMenu() {
    try {
      await this.menuCtrl.close('buyer-menu');
    } catch (error) {
      // Silent fail - menu may already be closed
    }
  }

  async navigateToProfile() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/profile']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToOrderHistory() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/retailer-order-history'], {
        queryParams: { id: 'ORD123456' }
      });
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToSpends() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/spends']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToBusinessLocations() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/business-locations']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToBusinessInfo() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/business-info']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToSettings() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/settings']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async logout() {
    try {
      await this.closeMenu();

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('BUYER_HOME.LOGOUT_CONFIRM_HEADER'),
        message: this.translate.instant('BUYER_HOME.LOGOUT_CONFIRM_MESSAGE'),
        buttons: [
          {
            text: this.translate.instant('BUYER_HOME.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('BUYER_HOME.LOGOUT'),
            handler: async () => {
              try {
                await this.authService.logout();
                await this.router.navigate(['/login']);
              } catch (error) {
                this.showErrorToast('BUYER_HOME.LOGOUT_ERROR');
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      this.showErrorToast('BUYER_HOME.ERROR_OPENING_MENU');
    }
  }

  async openTrends() {
    try {
      await this.router.navigate(['/buyer/RetailerTrends']);
    } catch (error) {
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  private async showErrorToast(messageKey: string) {
    try {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant(messageKey),
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } catch (error) {
      // Silent fail - toast not critical
    }
  }

  private async showSuccessToast(messageKey: string) {
    try {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant(messageKey),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      // Silent fail - toast not critical
    }
  }
}