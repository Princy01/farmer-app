import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WholesalerApiService, BulkOrder, TopRetailer } from '../services/wholesaler-api.service';
import { addIcons } from 'ionicons';
import { add, listOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { RetailerProductsModalComponent } from './retailer-products-modal/retailer-products-modal.component';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, Subject } from 'rxjs';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-market-opportunities',
  templateUrl: './market-opportunities.component.html',
  styleUrls: ['./market-opportunities.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class MarketOpportunitiesComponent implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;
  bulkOrders: BulkOrder[] = [];
  topRetailers: TopRetailer[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  private destroy$ = new Subject<void>();

  constructor(
    private wholesalerService: WholesalerApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({ listOutline, add, chevronBack, chevronForward });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadData();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MARKET_OPPORTUNITIES.AUTH_ERROR'),
      message: this.translate.instant('MARKET_OPPORTUNITIES.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('MARKET_OPPORTUNITIES.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('MARKET_OPPORTUNITIES.ACCESS_DENIED'),
      message: this.translate.instant('MARKET_OPPORTUNITIES.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('MARKET_OPPORTUNITIES.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('MARKET_OPPORTUNITIES.LOADING'),
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.error = null;

      // Use forkJoin to load both API calls in parallel
      forkJoin({
        bulkOrders: this.wholesalerService.getBulkOrders(),
        topRetailers: this.wholesalerService.getTopRetailers()
      }).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.bulkOrders = data.bulkOrders;
            this.topRetailers = data.topRetailers;
            this.isLoading = false;
            loading.dismiss();
          },
          error: async (error) => {
            this.isLoading = false;
            loading.dismiss();

            if (error.status === 401) {
              await this.showAuthError();
              return;
            }

            this.error = this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR');
            this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR'));
          }
        });
    } catch (err) {
      this.isLoading = false;
      loading.dismiss();
      this.error = this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR');
      this.showErrorToast(this.translate.instant('MARKET_OPPORTUNITIES.LOAD_ERROR'));
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }

  getTopRetailersTitle(): string {
    return this.translate.instant('MARKET_OPPORTUNITIES.TOP_RETAILERS_TITLE');
  }

  async handleRefresh(event: any) {
    try {
      await this.loadData();
    } finally {
      event.target.complete();
    }
  }

  async openRetailerProductsModal(retailer: TopRetailer) {
    const modal = await this.modalCtrl.create({
      component: RetailerProductsModalComponent,
      componentProps: { retailer },
      breakpoints: [0, 0.25, 0.5, 0.75, 0.95],
      initialBreakpoint: 0.95,
      backdropDismiss: true
    });
    await modal.present();
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  // Pagination methods
  getCurrentPageOrders(): BulkOrder[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.bulkOrders.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.bulkOrders.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}