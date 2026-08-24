import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ModalController, LoadingController, ToastController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StockService, ProductPriceData, BusinessBranchWithNames } from 'src/app/Wholesaler/services/stock.service';
import { AddStockComponent } from '../add-stock/add-stock.component';
import { UpdateStockComponent } from '../update-stock/update-stock.component';
import { addIcons } from 'ionicons';
import { add, refreshOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * Stock Dashboard Component
 * Manages and displays product stock information for selected branches
 * Allows adding new stock and updating existing stock entries
 */
@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  backRoute = history.state?.helpReturnUrl || '/wholesaler/home';
  /** Current stock data for selected branch */
  todayStock: ProductPriceData[] = [];

  /** Available branches for the user */
  branches: BusinessBranchWithNames[] = [];

  /** Currently selected branch ID */
  selectedBranchId: number | null = null;

  /** Authenticated user ID */
  userId: number | null = null;

  /** Loading state indicator */
  isLoading: boolean = false;

  /** Error message to display */
  errorMessage: string = '';

  /** Subject for managing subscriptions cleanup */
  private readonly destroy$ = new Subject<void>();

  /** Polling interval for auto-refresh */
  private pollInterval: any;

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, refreshOutline });
  }

  /**
   * Component initialization
   * Fetches user ID and loads branch data
   */
  ngOnInit(): void {
    this.userId = this.authService.getUserId();

    if (!this.userId) {
      this.showError('STOCK_DASHBOARD.ERRORS.USER_NOT_FOUND');
      return;
    }

    this.fetchBranches();
    this.startPolling();
  }

  /**
   * Component cleanup
   * Unsubscribes from all active subscriptions and stops polling
   */
  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Starts polling for stock updates every 1 minute
   */
  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.loadTodayStock();
    }, 60000);
  }

  /**
   * Stops polling for stock updates
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Fetch branches associated with the user
   * Automatically selects first branch and loads its stock
   */
  private async fetchBranches(): Promise<void> {
    if (this.userId === null) {
      this.showError('STOCK_DASHBOARD.ERRORS.USER_NOT_FOUND');
      return;
    }

    const loading = await this.showLoading('STOCK_DASHBOARD.LOADING.FETCHING_BRANCHES');
    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.stockService.getBranchesByUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.branches = data || [];

          if (this.branches.length > 0) {
            this.selectedBranchId = this.branches[0].branch_id;
            this.loadTodayStock();
          } else {
            this.errorMessage = 'STOCK_DASHBOARD.ERRORS.NO_BRANCHES';
            this.isLoading = false;
          }

          loading.dismiss();
        },
        error: (error) => {
          this.isLoading = false;
          loading.dismiss();
          const errorMsg = error?.message || 'STOCK_DASHBOARD.ERRORS.FETCH_BRANCHES_FAILED';
          this.showError(errorMsg);
        }
      });
  }

  /**
   * Load stock data for selected branch for today's date
   */
  loadTodayStock(): void {
    if (!this.selectedBranchId) {
      this.showError('STOCK_DASHBOARD.ERRORS.NO_BRANCH_SELECTED');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.stockService
      .getProductsStockOfBranchForDate(this.selectedBranchId, today)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.todayStock = data || [];
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.todayStock = [];
          const errorMsg = error?.message || 'STOCK_DASHBOARD.ERRORS.LOAD_STOCK_FAILED';
          this.showError(errorMsg);
        }
      });
  }

  /**
   * Open modal to add new stock entry
   */
  async openAddStock(): Promise<void> {
    if (!this.selectedBranchId) {
      this.showError('STOCK_DASHBOARD.ERRORS.NO_BRANCH_SELECTED');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: AddStockComponent,
      componentProps: { branchId: this.selectedBranchId }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' || data?.success) {
      this.loadTodayStock();
      this.showSuccess('STOCK_DASHBOARD.SUCCESS.STOCK_ADDED');
    }
  }

  /**
   * Open modal to update existing stock entry
   * @param item - The stock item to update
   */
  async openUpdateStock(item: ProductPriceData): Promise<void> {
    if (!this.selectedBranchId) {
      this.showError('STOCK_DASHBOARD.ERRORS.NO_BRANCH_SELECTED');
      return;
    }

    if (!item) {
      this.showError('STOCK_DASHBOARD.ERRORS.INVALID_ITEM');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: UpdateStockComponent,
      componentProps: {
        stockItem: item,
        branchId: this.selectedBranchId
      },
      breakpoints: [0, 0.4, 0.8],
      initialBreakpoint: 0.4
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' || data?.success) {
      this.loadTodayStock();
      this.showSuccess('STOCK_DASHBOARD.SUCCESS.STOCK_UPDATED');
    }
  }

  /**
   * Show loading indicator with timeout to prevent indefinite display
   * @param messageKey - Translation key for loading message
   * @returns Promise resolving to loading controller
   */
  private async showLoading(messageKey: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant(messageKey),
      spinner: 'circular',
      backdropDismiss: false
    });
    await loading.present();

    // Safety timeout: automatically dismiss loading after 30 seconds
    setTimeout(() => {
      loading.dismiss().catch(() => {
        // Loading already dismissed, ignore error
      });
    }, 30000);

    return loading;
  }

  /**
   * Show error toast message
   * @param messageKey - Translation key for error message
   */
  private async showError(messageKey: string): Promise<void> {
    this.errorMessage = messageKey;
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color: 'danger',
      position: 'top',
      buttons: [{
        text: this.translate.instant('COMMON.CLOSE'),
        role: 'cancel'
      }]
    });
    await toast.present();
  }

  /**
   * Show success toast message
   * @param messageKey - Translation key for success message
   */
  private async showSuccess(messageKey: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }
}