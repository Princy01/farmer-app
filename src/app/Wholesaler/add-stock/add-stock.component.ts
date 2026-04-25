import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StockService, BusinessBranchWithNames, AddStockPayload } from 'src/app/Wholesaler/services/stock.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  closeCircleOutline,
  businessOutline,
  storefrontOutline,
  starOutline,
  analyticsOutline,
  trashOutline,
  removeCircle,
  addCircle,
  flashOutline,
  arrowDownCircleOutline,
  syncOutline,
  cashOutline,
  pricetagOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-add-stock',
  templateUrl: './add-stock.component.html',
  styleUrls: ['./add-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class AddStockComponent implements OnInit, OnDestroy {
  stockData: any = {
    productId: null,
    qualityId: null,
    wastageMeasureId: null,
    stockReceived: 0,
    stockCarriedForward: 0,
    pricePerUnit: 0,
    branchId: null,
    dateOfEntry: new Date().toISOString().split('T')[0],
    unitId: null
  };

  branches: BusinessBranchWithNames[] = [];
  products: any[] = [];
  qualities: any[] = [];
  wastageMeasures: any[] = [];
  units: any[] = [];

  isLoading: boolean = false;
  isSubmitting: boolean = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({
      cubeOutline,
      closeCircleOutline,
      businessOutline,
      storefrontOutline,
      starOutline,
      analyticsOutline,
      trashOutline,
      removeCircle,
      addCircle,
      flashOutline,
      arrowDownCircleOutline,
      syncOutline,
      cashOutline,
      pricetagOutline,
      checkmarkCircleOutline
    });
  }

  /**
   * Component initialization - loads all reference data
   */
  ngOnInit(): void {
    this.loadBranches();
    this.loadProducts();
    this.loadQualities();
    this.loadWastageMeasures();
    this.loadUnits();
  }

  /**
   * Component cleanup - unsubscribes from all observables
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load products from service
   */
  private loadProducts(): void {
    this.stockService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products || [];
        },
        error: (error) => {
          this.showError(error?.message || 'ADD_STOCK.ERRORS.LOAD_PRODUCTS_FAILED');
        }
      });
  }

  /**
   * Load qualities from service
   */
  private loadQualities(): void {
    this.stockService.getQualities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualities) => {
          this.qualities = qualities || [];
        },
        error: (error) => {
          this.showError(error?.message || 'ADD_STOCK.ERRORS.LOAD_QUALITIES_FAILED');
        }
      });
  }

  /**
   * Load wastage measures from service
   */
  private loadWastageMeasures(): void {
    this.stockService.getWastageMeasures()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wastages) => {
          this.wastageMeasures = wastages || [];
        },
        error: (error) => {
          this.showError(error?.message || 'ADD_STOCK.ERRORS.LOAD_WASTAGE_MEASURES_FAILED');
        }
      });
  }

  /**
   * Load units from service
   */
  private loadUnits(): void {
    this.stockService.getUnits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units = units || [];
        },
        error: (error) => {
          this.showError(error?.message || 'ADD_STOCK.ERRORS.LOAD_UNITS_FAILED');
        }
      });
  }

  /**
   * Increment numeric field
   * @param field - Field name to increment
   */
  increment(field: string): void {
    this.setNumericField(field, this.getNumericFieldValue(field) + 1);
  }

  /**
   * Decrement numeric field (minimum 0)
   * @param field - Field name to decrement
   */
  decrement(field: string): void {
    this.setNumericField(field, this.getNumericFieldValue(field) - 1);
  }

  /**
   * Add 50 to numeric field
   * @param field - Field name to add to
   */
  addFifty(field: string): void {
    this.setNumericField(field, this.getNumericFieldValue(field) + 50);
  }

  /**
   * Subtract 50 from numeric field (minimum 0)
   * @param field - Field name to subtract from
   */
  subtractFifty(field: string): void {
    this.setNumericField(field, this.getNumericFieldValue(field) - 50);
  }

  /**
   * Set numeric field value from direct input while enforcing non-negative values
   * @param field - Field name to update
   * @param value - Incoming value from input or button operations
   */
  setNumericField(field: string, value: number | string | null | undefined): void {
    const parsedValue = Number(value);
    this.stockData[field] = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
  }

  /**
   * Safely read a numeric field value
   * @param field - Field name to read
   */
  private getNumericFieldValue(field: string): number {
    const parsedValue = Number(this.stockData[field]);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  /**
   * Load branches for current authenticated user
   */
  private loadBranches(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.showError('ADD_STOCK.ERRORS.USER_NOT_FOUND');
      return;
    }

    this.stockService.getBranchesByUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branches) => {
          this.branches = branches || [];
        },
        error: (error) => {
          this.showError(error?.message || 'ADD_STOCK.ERRORS.LOAD_BRANCHES_FAILED');
        }
      });
  }

  /**
   * Validate form has all required fields with valid values
   * @returns true if form is valid and ready to submit
   */
  isFormValid(): boolean {
    return !!(
      this.stockData.branchId &&
      this.stockData.productId &&
      this.stockData.qualityId &&
      this.stockData.wastageMeasureId &&
      this.stockData.unitId &&
      this.stockData.pricePerUnit > 0 &&
      !this.isSubmitting
    );
  }

  /**
   * Submit stock addition with proper validation and error handling
   */
  addStock(): void {
    if (!this.isFormValid()) {
      this.showError('ADD_STOCK.ERRORS.INVALID_FORM');
      return;
    }

    this.isSubmitting = true;

    const payload: AddStockPayload = {
      product_id: this.stockData.productId,
      quality_id: this.stockData.qualityId,
      wastage_measure_id: this.stockData.wastageMeasureId,
      stock_received: this.stockData.stockReceived,
      stock_carried_forward: this.stockData.stockCarriedForward,
      price_per_unit: this.stockData.pricePerUnit,
      b_b_id: this.stockData.branchId,
      date_of_entry: this.stockData.dateOfEntry,
      unit_id: this.stockData.unitId
    };

    this.stockService.addStock(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('ADD_STOCK.SUCCESS_MESSAGE');
          this.modalCtrl.dismiss({ success: true });
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error?.message || 'ADD_STOCK.ERROR_MESSAGE');
        }
      });
  }

  /**
   * Close modal without saving
   */
  close(): void {
    this.modalCtrl.dismiss();
  }

  /**
   * Show error toast notification
   * @param messageKey - Translation key for error message
   */
  private async showError(messageKey: string): Promise<void> {
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
   * Show success toast notification
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