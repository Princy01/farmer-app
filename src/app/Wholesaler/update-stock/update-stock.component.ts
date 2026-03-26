import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { StockService } from 'src/app/Wholesaler/services/stock.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface StockItem {
  product_id?: number;
  id?: number;
  current_stock?: number;
  currentStock?: number;
  product_name?: string;
  productName?: string;
}

@Component({
  selector: 'app-update-stock',
  templateUrl: './update-stock.component.html',
  styleUrls: ['./update-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class UpdateStockComponent implements OnInit, OnDestroy {
  @Input() stockItem!: StockItem;
  @Input() branchId!: number;

  stockToDeduct: number | null = null;
  isLoading = false;

  /** Subject for managing subscriptions */
  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.validateInputs();
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Validate required inputs
   */
  private validateInputs(): void {
    if (!this.stockItem || this.branchId == null) {
      // Silent validation - issue will be caught on submit attempt
      return;
    }
  }

  /**
   * Display toast notification
   * @param message Message text
   * @param color Toast color type
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Show loading spinner
   * @returns Promise of loading controller reference
   */
  private async showLoading(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('UPDATE_STOCK.UPDATING'),
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  /**
   * Get current stock from item
   * @returns Current stock quantity
   */
  private getCurrentStock(): number {
    return this.stockItem.current_stock ?? this.stockItem.currentStock ?? 0;
  }

  /**
   * Get product ID from item
   * @returns Product ID or undefined
   */
  private getProductId(): number | undefined {
    return this.stockItem.product_id ?? this.stockItem.id;
  }

  /**
   * Validate stock deduction amount
   * @returns Validation result with error message if invalid
   */
  private validateStockDeduction(): { isValid: boolean; errorMessage?: string } {
    if (this.stockToDeduct == null || this.stockToDeduct <= 0) {
      return {
        isValid: false,
        errorMessage: this.translate.instant('UPDATE_STOCK.INVALID_AMOUNT')
      };
    }

    const currentStock = this.getCurrentStock();
    const updatedStock = currentStock - this.stockToDeduct;

    if (updatedStock < 0) {
      return {
        isValid: false,
        errorMessage: this.translate.instant('UPDATE_STOCK.STOCK_EXCEEDS')
      };
    }

    return { isValid: true };
  }

  /**
   * Update stock with deducted quantity
   */
  async updateStock(): Promise<void> {
    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    // Validate inputs
    const validation = this.validateStockDeduction();
    if (!validation.isValid) {
      await this.showToast(validation.errorMessage!, 'danger');
      return;
    }

    const productId = this.getProductId();
    if (!productId) {
      await this.showToast(
        this.translate.instant('UPDATE_STOCK.MISSING_PRODUCT_ID'),
        'danger'
      );
      return;
    }

    this.isLoading = true;
    const loading = await this.showLoading();

    const currentStock = this.getCurrentStock();
    const updatedStock = currentStock - this.stockToDeduct!;

    const payload = {
      product_id: productId,
      new_quantity: updatedStock,
      mandi_id: this.branchId,
    };

    this.stockService.updateStock(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          loading.dismiss();
        })
      )
      .subscribe({
        next: async () => {
          await this.showToast(
            this.translate.instant('UPDATE_STOCK.UPDATE_SUCCESS'),
            'success'
          );
          this.modalCtrl.dismiss({ updated: true, newStock: updatedStock });
        },
        error: async (error: HttpErrorResponse) => {
          let errorMessage = this.translate.instant('UPDATE_STOCK.UPDATE_FAILED');

          if (error.status === 0) {
            errorMessage = this.translate.instant('UPDATE_STOCK.NETWORK_ERROR');
          } else if (error.status === 403) {
            errorMessage = this.translate.instant('UPDATE_STOCK.FORBIDDEN_ERROR');
          } else if (error.status >= 500) {
            errorMessage = this.translate.instant('UPDATE_STOCK.SERVER_ERROR');
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          await this.showToast(errorMessage, 'danger');
        }
      });
  }

  /**
   * Close modal without saving
   */
  close(): void {
    if (!this.isLoading) {
      this.modalCtrl.dismiss({ updated: false });
    }
  }
}