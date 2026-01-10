import { Component, OnInit } from '@angular/core';
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
import { WholesalerApiService, WholesalerProductDetails } from '../services/wholesaler-api.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ProductDetailsComponent implements OnInit {
  productId: number = 0;
  productDetails: WholesalerProductDetails | null = null;
  isLoading = true;
  productImageUrl = 'assets/images/default-vegetable.jpg';

  // Getter for product image with fallback
  get displayImageUrl(): string {
    if (this.productDetails?.image_path) {
      // Check if it's base64 encoded
      if (this.productDetails.image_path.startsWith('data:image')) {
        return this.productDetails.image_path;
      }
      // Check if it's a full URL
      if (this.productDetails.image_path.startsWith('http')) {
        return this.productDetails.image_path;
      }
      // Assume it's a relative path
      return this.productDetails.image_path;
    }
    return this.productImageUrl;
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
    // Get product ID from route parameter
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.productId = parseInt(id, 10);
        this.loadProductDetails();
      } else {
        this.showErrorAndGoBack('Product ID not found');
      }
    });
  }

  private async loadProductDetails() {
    this.isLoading = true;

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('PRODUCT_DETAILS.LOADING'),
      spinner: 'circular'
    });
    await loading.present();

    this.wholesalerService.getWholesalerProductDetails(this.productId).subscribe({
      next: (data) => {
        this.productDetails = data;
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        loading.dismiss();
        this.isLoading = false;

        console.error('Error loading product details:', error);

        const alert = await this.alertCtrl.create({
          header: this.translate.instant('COMMON.ERROR'),
          message: this.translate.instant('PRODUCT_DETAILS.LOAD_ERROR'),
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
  }

  // Quick Actions
  async updateStock() {
    if (!this.productDetails || !this.productDetails.mandi_wise.length) return;

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
          role: 'cancel'
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
              await loading.present();

              this.wholesalerService.updateProductStockForMandi(
                this.productDetails!.product_id,
                mandi.mandi_id,
                parseFloat(data.quantity)
              ).subscribe({
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

                  const toast = await this.toastCtrl.create({
                    message: this.translate.instant('PRODUCT_DETAILS.STOCK_UPDATED_SUCCESS'),
                    duration: 2000,
                    color: 'success'
                  });
                  await toast.present();
                },
                error: async (error) => {
                  await loading.dismiss();
                  console.error('Error updating stock:', error);

                  const toast = await this.toastCtrl.create({
                    message: this.translate.instant('PRODUCT_DETAILS.STOCK_UPDATE_FAILED'),
                    duration: 3000,
                    color: 'danger'
                  });
                  await toast.present();
                }
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async updatePrice() {
    if (!this.productDetails || !this.productDetails.mandi_wise.length) return;

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

  private async updateMandiPrice(mandi: any) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(
        'PRODUCT_DETAILS.UPDATE_PRICE_FOR_MANDI',
        { mandi: mandi.mandi_name }
      ),
      inputs: [
        {
          name: 'price',
          type: 'number',
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
            if (price <= 0) return;

            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('PRODUCT_DETAILS.UPDATING_PRICE')
            });
            await loading.present();

            this.wholesalerService
              .updateProductPriceForMandi(
                this.productDetails!.product_id,
                mandi.mandi_id,
                price
              )
              .subscribe({
                next: async () => {
                  mandi.price_per_unit = price;

                  // Recalculate max price
                  this.productDetails!.price_per_unit =
                    Math.max(
                      ...this.productDetails!.mandi_wise.map(m => m.price_per_unit)
                    );

                  await loading.dismiss();

                  const toast = await this.toastCtrl.create({
                    message: this.translate.instant(
                      'PRODUCT_DETAILS.PRICE_UPDATED_SUCCESS'
                    ),
                    duration: 2000,
                    color: 'success'
                  });
                  await toast.present();
                },
                error: async () => {
                  await loading.dismiss();
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  async editPrice() {
    if (!this.productDetails) return;

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.EDIT_PRICE_HEADER'),
      message: this.translate.instant('PRODUCT_DETAILS.EDIT_PRICE_MESSAGE'),
      inputs: [
        {
          name: 'price',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.PRICE_PLACEHOLDER'),
          value: this.productDetails.price_per_unit
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
            if (data.price && data.price > 0) {
              const loading = await this.loadingCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.UPDATING_PRICE')
              });
              await loading.present();

              // TODO: Call actual update API
              setTimeout(async () => {
                if (this.productDetails) {
                  this.productDetails.price_per_unit = parseFloat(data.price);
                }
                await loading.dismiss();

                const toast = await this.toastCtrl.create({
                  message: this.translate.instant('PRODUCT_DETAILS.PRICE_UPDATED_SUCCESS'),
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
              }, 1000);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async setDiscount() {
    if (!this.productDetails) return;

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

  getMarkAsOutOfStockInputs(): Array<{ type: "radio"; label: string; value: any; checked: boolean }> {
    return this.productDetails!.mandi_wise.map(mandi => ({
      type: 'radio',
      label: `${mandi.mandi_name} (${mandi.quantity} ${this.productDetails!.unit_name})`,
      value: mandi,
      checked: false
    }))
  }

  async markOutOfStock() {
    if (!this.productDetails || !this.productDetails.mandi_wise.length) return;

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
            await loading.present();

            this.wholesalerService.updateProductStockForMandi(
              this.productDetails!.product_id,
              mandi.mandi_id,
              0
            ).subscribe({
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

                const toast = await this.toastCtrl.create({
                  message: this.translate.instant('PRODUCT_DETAILS.MARKED_OUT_OF_STOCK_SUCCESS', {
                    mandi: mandi.mandi_name
                  }),
                  duration: 2000,
                  color: 'warning'
                });
                await toast.present();
              },
              error: async (error) => {
                await loading.dismiss();
                console.error('Error marking out of stock:', error);

                const toast = await this.toastCtrl.create({
                  message: this.translate.instant('PRODUCT_DETAILS.OUT_OF_STOCK_FAILED'),
                  duration: 3000,
                  color: 'danger'
                });
                await toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

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
            await loading.present();

            // Mark all mandis as out of stock
            const updatePromises = this.productDetails!.mandi_wise.map(mandi =>
              this.wholesalerService.updateProductStockForMandi(
                this.productDetails!.product_id,
                mandi.mandi_id,
                0
              ).toPromise()
            );

            try {
              await Promise.all(updatePromises);

              // Update local data
              this.productDetails!.mandi_wise.forEach(mandi => {
                mandi.quantity = 0;
              });
              this.productDetails!.total_quantity = 0;

              await loading.dismiss();

              const toast = await this.toastCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.MARKED_ALL_OUT_OF_STOCK'),
                duration: 2000,
                color: 'warning'
              });
              await toast.present();
            } catch (error) {
              await loading.dismiss();
              console.error('Error marking all out of stock:', error);

              const toast = await this.toastCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.OUT_OF_STOCK_FAILED'),
                duration: 3000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

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

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  onImageError(event: any) {
    event.target.src = this.productImageUrl;
  }

  getMandiPercentage(quantity: number): number {
    if (!this.productDetails || this.productDetails.total_quantity === 0) {
      return 0;
    }
    return (quantity / this.productDetails.total_quantity) * 100;
  }
}