import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  arrowBack, cubeOutline, barChartOutline, flashOutline,
  addCircleOutline, pricetagOutline, giftOutline, closeCircleOutline
} from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WholesalerApiService, WholesalerProductDetails } from '../services/wholesaler-api.service';
import { getProductFallbackByName, normalizeImagePath } from '../../buyer/utils/buyer-image.util';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  productId: number = 0;
  productDetails: WholesalerProductDetails | null = null;
  isLoading = true;
  isUpdatingStock = false;
  isUpdatingPrice = false;
  isMarkingOutOfStock = false;
  productImageUrl = 'assets/img/vegetables.png';
  imageLoadError = false;

  private destroy$ = new Subject<void>();

  // Getter for product image with fallback
  get displayImageUrl(): string {
    return normalizeImagePath(this.productDetails?.image_path)
      || getProductFallbackByName(this.productDetails?.product_name)
      || this.productImageUrl;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private wholesalerService: WholesalerApiService
  ) {
    addIcons({
      arrowBack, cubeOutline, barChartOutline, flashOutline,
      addCircleOutline, pricetagOutline, giftOutline, closeCircleOutline
    });
  }

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['id'];
        if (id) {
          this.productId = parseInt(id, 10);
          this.loadProductDetails();
        } else {
          this.showErrorAndGoBack(
            this.translate.instant('PRODUCT_DETAILS.ERRORS.PRODUCT_ID_NOT_FOUND')
          );
        }
      });
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads product details from the backend
   */
  private async loadProductDetails() {
    this.isLoading = true;

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PRODUCT_DETAILS.LOADING'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      this.wholesalerService.getWholesalerProductDetails(this.productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (data) => {
            this.productDetails = data;
            this.isLoading = false;
            await loading.dismiss();
          },
          error: async (error) => {
            await loading.dismiss();
            this.isLoading = false;

            const alert = await this.alertCtrl.create({
              header: this.translate.instant('PRODUCT_DETAILS.ERRORS.HEADER'),
              message: this.translate.instant('PRODUCT_DETAILS.ERRORS.LOAD_ERROR'),
              buttons: [
                {
                  text: this.translate.instant('COMMON.OK'),
                  handler: () => this.goBack()
                }
              ]
            });
            await alert.present();
          }
        });
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
    }
  }

  /**
   * Initiates the stock update process for the product
   * If multiple mandis exist, prompts user to select one
   */
  async updateStock() {
    if (!this.productDetails || !this.productDetails.mandi_wise || !this.productDetails.mandi_wise.length) {
      return;
    }

    // If only one mandi, directly update it
    if (this.productDetails.mandi_wise.length === 1) {
      this.updateMandiStock(this.productDetails.mandi_wise[0]);
      return;
    }

    // Multiple mandis - show selection
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.SELECT_MANDI'),
      message: this.translate.instant('PRODUCT_DETAILS.SELECT_MANDI_MESSAGE'),
      inputs: this.productDetails.mandi_wise.map(mandi => ({
        type: 'radio',
        label: `${mandi.mandi_name} (${mandi.quantity} ${this.productDetails!.unit_name})`,
        value: mandi,
        checked: false
      })),
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel',
          handler: () => {
            // Reset loading state on cancel
          }
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.NEXT'),
          handler: (selectedMandi) => {
            if (selectedMandi) {
              this.updateMandiStock(selectedMandi);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Updates stock quantity for a specific mandi
   * @param mandi The mandi whose stock needs to be updated
   */
  private async updateMandiStock(mandi: { mandi_id: number; mandi_name: string; quantity: number }) {
    if (!this.productDetails) return;

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.UPDATE_STOCK_FOR_MANDI', { mandi: mandi.mandi_name }),
      message: this.translate.instant('PRODUCT_DETAILS.CURRENT_STOCK', {
        stock: mandi.quantity,
        unit: this.productDetails.unit_name
      }),
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.STOCK_QUANTITY_PLACEHOLDER'),
          value: mandi.quantity,
          min: 0
        }
      ],
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.UPDATE'),
          handler: async (data) => {
            if (data.quantity !== null && data.quantity !== undefined && data.quantity >= 0) {
              const loading = await this.loadingCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.UPDATING_STOCK')
              });

              try {
                this.isUpdatingStock = true;
                await loading.present();

                this.wholesalerService.updateProductStockForMandi(
                  this.productDetails!.product_id,
                  mandi.mandi_id,
                  parseFloat(data.quantity)
                )
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: async () => {
                      // Update local data
                      const mandiIndex = this.productDetails!.mandi_wise.findIndex(
                        m => m.mandi_id === mandi.mandi_id
                      );
                      if (mandiIndex !== -1) {
                        const oldQty = this.productDetails!.mandi_wise[mandiIndex].quantity;
                        this.productDetails!.mandi_wise[mandiIndex].quantity = parseFloat(data.quantity);

                        // Recalculate total
                        this.productDetails!.total_quantity = this.productDetails!.total_quantity - oldQty + parseFloat(data.quantity);
                      }

                      await loading.dismiss();
                      this.isUpdatingStock = false;

                      await this.showToast(
                        this.translate.instant('PRODUCT_DETAILS.STOCK_UPDATED_SUCCESS'),
                        'success'
                      );
                    },
                    error: async (error) => {
                      await loading.dismiss();
                      this.isUpdatingStock = false;

                      await this.showToast(
                        this.translate.instant('PRODUCT_DETAILS.ERRORS.STOCK_UPDATE_FAILED'),
                        'danger'
                      );
                    }
                  });
              } catch (error) {
                await loading.dismiss();
                this.isUpdatingStock = false;
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Initiates the price update process for the product
   * If multiple mandis exist, prompts user to select one
   */
  async updatePrice() {
    if (!this.productDetails || !this.productDetails.mandi_wise || !this.productDetails.mandi_wise.length) {
      return;
    }

    // Single mandi → direct
    if (this.productDetails.mandi_wise.length === 1) {
      this.updateMandiPrice(this.productDetails.mandi_wise[0]);
      return;
    }

    // Multiple mandis → select
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.SELECT_MANDI'),
      inputs: this.productDetails.mandi_wise.map(mandi => ({
        type: 'radio',
        label: `${mandi.mandi_name} (₹${mandi.price_per_unit}/${this.productDetails!.unit_name})`,
        value: mandi
      })),
      buttons: [
        { text: this.translate.instant('PRODUCT_DETAILS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('PRODUCT_DETAILS.NEXT'),
          handler: (mandi) => mandi && this.updateMandiPrice(mandi)
        }
      ]
    });

    await alert.present();
  }

  /**
   * Updates price for a specific mandi
   * @param mandi The mandi whose price needs to be updated
   */
  private async updateMandiPrice(mandi: { mandi_id: number; mandi_name: string; price_per_unit: number }) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(
        'PRODUCT_DETAILS.UPDATE_PRICE_FOR_MANDI',
        { mandi: mandi.mandi_name }
      ),
      inputs: [
        {
          name: 'price',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.PRICE_PLACEHOLDER'),
          value: mandi.price_per_unit,
          min: 0
        }
      ],
      buttons: [
        { text: this.translate.instant('PRODUCT_DETAILS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('PRODUCT_DETAILS.UPDATE'),
          handler: async (data) => {
            const price = Number(data.price);
            if (price <= 0) {
              await this.showToast(
                this.translate.instant('PRODUCT_DETAILS.ERRORS.INVALID_PRICE'),
                'warning'
              );
              return false;
            }

            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('PRODUCT_DETAILS.UPDATING_PRICE')
            });

            try {
              this.isUpdatingPrice = true;
              await loading.present();

              this.wholesalerService
                .updateProductPriceForMandi(
                  this.productDetails!.product_id,
                  mandi.mandi_id,
                  price
                )
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: async () => {
                    mandi.price_per_unit = price;

                    // Recalculate max price
                    this.productDetails!.price_per_unit =
                      Math.max(
                        ...this.productDetails!.mandi_wise.map(m => m.price_per_unit)
                      );

                    await loading.dismiss();
                    this.isUpdatingPrice = false;

                    await this.showToast(
                      this.translate.instant('PRODUCT_DETAILS.PRICE_UPDATED_SUCCESS'),
                      'success'
                    );
                  },
                  error: async (error) => {
                    await loading.dismiss();
                    this.isUpdatingPrice = false;

                    await this.showToast(
                      this.translate.instant('PRODUCT_DETAILS.ERRORS.PRICE_UPDATE_FAILED'),
                      'danger'
                    );
                  }
                });

              return true;
            } catch (error) {
              await loading.dismiss();
              this.isUpdatingPrice = false;
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * @deprecated Use updatePrice() instead. This method exists for backward compatibility.
   */
  async editPrice() {
    // Redirect to the proper updatePrice method
    await this.updatePrice();
  }

  /**
   * Sets a discount percentage for the product
   * Note: This currently only shows a preview and doesn't persist to backend
   */
  async setDiscount() {
    if (!this.productDetails) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.SET_DISCOUNT_HEADER'),
      message: this.translate.instant('PRODUCT_DETAILS.SET_DISCOUNT_MESSAGE'),
      inputs: [
        {
          name: 'discount',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.DISCOUNT_PLACEHOLDER'),
          min: 0,
          max: 50
        }
      ],
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.APPLY'),
          handler: async (data) => {
            if (data.discount && data.discount >= 0 && this.productDetails) {
              const discountAmount = (this.productDetails.price_per_unit * data.discount) / 100;
              const newPrice = this.productDetails.price_per_unit - discountAmount;

              const toast = await this.toastCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.DISCOUNT_APPLIED', {
                  discount: data.discount,
                  price: newPrice.toFixed(2)
                }),
                duration: 3000,
                color: 'success'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Generates radio button inputs for marking mandis as out of stock
   * @returns Array of radio input configurations
   */
  private getMarkAsOutOfStockInputs(): Array<{ type: 'radio'; label: string; value: { mandi_id: number; mandi_name: string; quantity: number }; checked: boolean }> {
    if (!this.productDetails) return [];

    return this.productDetails.mandi_wise.map(mandi => ({
      type: 'radio' as const,
      label: `${mandi.mandi_name} (${mandi.quantity} ${this.productDetails!.unit_name})`,
      value: mandi,
      checked: false
    }));
  }

  /**
   * Initiates the process to mark product as out of stock
   * Allows selection of specific mandi or all mandis
   */
  async markOutOfStock() {
    if (!this.productDetails || !this.productDetails.mandi_wise || !this.productDetails.mandi_wise.length) {
      return;
    }

    // If only one mandi, directly mark it
    if (this.productDetails.mandi_wise.length === 1) {
      this.confirmMarkOutOfStock(this.productDetails.mandi_wise[0]);
      return;
    }

    // Multiple mandis - show selection
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.SELECT_MANDI'),
      message: this.translate.instant('PRODUCT_DETAILS.SELECT_MANDI_OUT_OF_STOCK'),
      inputs: [
        {
          type: 'radio',
          label: this.translate.instant('PRODUCT_DETAILS.ALL_MANDIS'),
          value: 'all',
          checked: false
        },
        ...this.getMarkAsOutOfStockInputs()

      ],
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.NEXT'),
          handler: (selection) => {
            if (selection === 'all') {
              this.confirmMarkAllOutOfStock();
            } else if (selection) {
              this.confirmMarkOutOfStock(selection);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Confirms and executes marking a specific mandi as out of stock
   * @param mandi The mandi to mark as out of stock
   */
  private async confirmMarkOutOfStock(mandi: { mandi_id: number; mandi_name: string; quantity: number }) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
      message: this.translate.instant('PRODUCT_DETAILS.OUT_OF_STOCK_MANDI_MESSAGE', {
        mandi: mandi.mandi_name
      }),
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('PRODUCT_DETAILS.MARKING_OUT_OF_STOCK')
            });

            try {
              this.isMarkingOutOfStock = true;
              await loading.present();

              this.wholesalerService.updateProductStockForMandi(
                this.productDetails!.product_id,
                mandi.mandi_id,
                0
              )
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: async () => {
                    // Update local data
                    const mandiIndex = this.productDetails!.mandi_wise.findIndex(
                      m => m.mandi_id === mandi.mandi_id
                    );
                    if (mandiIndex !== -1) {
                      const oldQty = this.productDetails!.mandi_wise[mandiIndex].quantity;
                      this.productDetails!.mandi_wise[mandiIndex].quantity = 0;
                      this.productDetails!.total_quantity -= oldQty;
                    }

                    await loading.dismiss();
                    this.isMarkingOutOfStock = false;

                    await this.showToast(
                      this.translate.instant('PRODUCT_DETAILS.MARKED_OUT_OF_STOCK_SUCCESS', {
                        mandi: mandi.mandi_name
                      }),
                      'warning'
                    );
                  },
                  error: async (error) => {
                    await loading.dismiss();
                    this.isMarkingOutOfStock = false;

                    await this.showToast(
                      this.translate.instant('PRODUCT_DETAILS.ERRORS.OUT_OF_STOCK_FAILED'),
                      'danger'
                    );
                  }
                });
            } catch (error) {
              await loading.dismiss();
              this.isMarkingOutOfStock = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Confirms and executes marking all mandis as out of stock
   */
  private async confirmMarkAllOutOfStock() {
    if (!this.productDetails) return;

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
      message: this.translate.instant('PRODUCT_DETAILS.OUT_OF_STOCK_ALL_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('PRODUCT_DETAILS.MARKING_OUT_OF_STOCK')
            });

            try {
              this.isMarkingOutOfStock = true;
              await loading.present();

              // Mark all mandis as out of stock
              const updateObservables = this.productDetails!.mandi_wise.map(mandi =>
                this.wholesalerService.updateProductStockForMandi(
                  this.productDetails!.product_id,
                  mandi.mandi_id,
                  0
                ).pipe(takeUntil(this.destroy$))
              );

              // Wait for all requests to complete
              await Promise.all(updateObservables.map(obs => obs.toPromise().catch(() => null)));

              // Update local data
              this.productDetails!.mandi_wise.forEach(mandi => {
                mandi.quantity = 0;
              });
              this.productDetails!.total_quantity = 0;

              await loading.dismiss();
              this.isMarkingOutOfStock = false;

              await this.showToast(
                this.translate.instant('PRODUCT_DETAILS.MARKED_ALL_OUT_OF_STOCK'),
                'warning'
              );
            } catch (error) {
              await loading.dismiss();
              this.isMarkingOutOfStock = false;

              await this.showToast(
                this.translate.instant('PRODUCT_DETAILS.ERRORS.OUT_OF_STOCK_FAILED'),
                'danger'
              );
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Displays a toast message
   * @param message The message to display
   * @param color The color of the toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 3000 : 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  /**
   * Shows an error alert and navigates back to the previous page
   * @param message The error message to display
   */
  private async showErrorAndGoBack(message: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('COMMON.ERROR'),
      message: message,
      buttons: [
        {
          text: this.translate.instant('COMMON.OK'),
          handler: () => this.goBack()
        }
      ]
    });
    await alert.present();
  }

  /**
   * Navigates back to the wholesaler home page
   */
  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  /**
   * Handles image load errors by setting a default fallback image
   * @param event The error event from the image element
   */
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target && !this.imageLoadError) {
      this.imageLoadError = true;
      target.src = getProductFallbackByName(this.productDetails?.product_name);
    }
  }

  /**
   * Safely formats a quantity value for display
   * @param quantity The quantity to format
   * @returns Formatted quantity string
   */
  private formatQuantity(quantity: number): string {
    if (!Number.isFinite(quantity)) return '0';
    return quantity.toFixed(2);
  }

  /**
   * Safely formats a price value for display
   * @param price The price to format
   * @returns Formatted price string
   */
  private formatPrice(price: number): string {
    if (!Number.isFinite(price)) return '0';
    return price.toFixed(2);
  }

  /**
   * Calculates the percentage of total quantity for a specific mandi
   * @param quantity The quantity in the mandi
   * @returns The percentage value (0-100), clamped to prevent layout issues
   */
  getMandiPercentage(quantity: number): number {
    if (!this.productDetails || this.productDetails.total_quantity === 0 || !Number.isFinite(quantity) || !Number.isFinite(this.productDetails.total_quantity)) {
      return 0;
    }
    const percentage = (quantity / this.productDetails.total_quantity) * 100;
    return Math.min(100, Math.max(0, percentage));
  }
}