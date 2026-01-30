import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
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
export class UpdateStockComponent implements OnInit {
  @Input() stockItem!: StockItem;
  @Input() branchId!: number;

  stockToDeduct: number | null = null;
  isLoading = false;

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

  private validateInputs(): void {
    if (!this.stockItem || this.branchId == null) {
      console.error('UpdateStockComponent: Missing required inputs', {
        hasStockItem: !!this.stockItem,
        hasBranchId: this.branchId != null
      });
    }
  }

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

  private async showLoading(): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('UPDATE_STOCK.UPDATING'),
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  private getCurrentStock(): number {
    return this.stockItem.current_stock ?? this.stockItem.currentStock ?? 0;
  }

  private getProductId(): number | undefined {
    return this.stockItem.product_id ?? this.stockItem.id;
  }

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
      console.error('UpdateStockComponent: Missing product ID');
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
          console.error('Failed to update stock:', error);

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

  close(): void {
    if (!this.isLoading) {
      this.modalCtrl.dismiss({ updated: false });
    }
  }
}