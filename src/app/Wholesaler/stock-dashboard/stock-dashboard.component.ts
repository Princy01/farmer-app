import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, LoadingController, ToastController } from '@ionic/angular';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService, ProductPriceData, BusinessBranchWithNames } from 'src/app/Wholesaler/services/stock.service';
import { AddStockComponent } from '../add-stock/add-stock.component';
import { UpdateStockComponent } from '../update-stock/update-stock.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
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
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe,IonFab, IonFabButton, IonIcon],
})
export class StockDashboardComponent implements OnInit, OnDestroy {
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

  /** Subscription manager for cleanup */
  private subscriptions = new Subscription();

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ add });
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
  }

  /**
   * Component cleanup
   * Unsubscribes from all active subscriptions
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

    const subscription = this.stockService.getBranchesByUser(this.userId).subscribe({
      next: (data) => {
        this.branches = data;

        if (this.branches.length > 0) {
          this.selectedBranchId = this.branches[0].branch_id;
          this.loadTodayStock();
        } else {
          this.errorMessage = 'STOCK_DASHBOARD.ERRORS.NO_BRANCHES';
        }

        this.isLoading = false;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error fetching branches:', error);
        this.isLoading = false;
        loading.dismiss();
        this.showError(error?.message || 'STOCK_DASHBOARD.ERRORS.FETCH_BRANCHES_FAILED');
      }
    });

    this.subscriptions.add(subscription);
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
      .subscribe({
        next: (data) => {
          this.todayStock = data || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stock:', error);
          this.isLoading = false;
          this.todayStock = [];
          this.showError(error?.message || 'STOCK_DASHBOARD.ERRORS.LOAD_STOCK_FAILED');
        }
      });

    this.subscriptions.add(subscription);
  }

  /**
   * Open modal to add new stock entry
   */
  async openAddStock(): Promise<void> {
    if (!this.selectedBranchId) {
      this.showError('STOCK_DASHBOARD.ERRORS.NO_BRANCH_SELECTED');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error opening add stock modal:', error);
      this.showError('STOCK_DASHBOARD.ERRORS.MODAL_ERROR');
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

    try {
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
    } catch (error) {
      console.error('Error opening update stock modal:', error);
      this.showError('STOCK_DASHBOARD.ERRORS.MODAL_ERROR');
    }
  }

  /**
   * Show loading indicator
   * @param messageKey - Translation key for loading message
   * @returns Promise resolving to loading controller
   */
  private async showLoading(messageKey: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant(messageKey),
      spinner: 'circular'
    });
    await loading.present();
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