import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowBack, cubeOutline, barChartOutline, flashOutline, addCircleOutline, pricetagOutline, giftOutline, closeCircleOutline } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ProductDetailsComponent implements OnInit {
  productData: any = {};
  productId = '';
  wholesellerId = '';
  mandiId = '';

  // Extended product information
  productInfo = {
    category: 'Vegetables',
    pricePerUnit: 45.50,
    imageUrl: 'assets/images/default-vegetable.jpg'
  };

  // Combined quantity data
  quantityInfo = {
    totalCombinedQuantity: 0,
    mandiWiseQuantity: [] as Array<{ mandiId: number, mandiName: string, quantity: number }>
  };

  // Order statistics
  orderStats = {
    totalOrdersPlaced: 0,
    last7Days: 0,
    last30Days: 0,
    last6Months: 0,
    lastYear: 0
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({ arrowBack, cubeOutline, barChartOutline, flashOutline, addCircleOutline, pricetagOutline, giftOutline, closeCircleOutline });
  }

  ngOnInit() {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.productId = params['productId'];
      this.wholesellerId = params['wholesellerId'];
      this.mandiId = params['mandiId'];
    });

    // Get product data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['productData']) {
      this.productData = navigation.extras.state['productData'];
      this.initializeProductData();
    }
  }

  private initializeProductData() {
    // Initialize quantity info with actual data
    this.quantityInfo.totalCombinedQuantity = this.productData.qty || 0;

    // Initialize order statistics
    this.orderStats.totalOrdersPlaced = this.productData.orders || 0;

    // Simulate mandi-wise data (in real app, this would come from API)
    this.loadMandiWiseData();
    this.loadOrderStatistics();
  }

  private loadMandiWiseData() {
    // Simulate multiple mandis for the wholesaler
    // In real app, this would be an API call
    this.quantityInfo.mandiWiseQuantity = [
      {
        mandiId: 1,
        mandiName: 'Main Market Mandi',
        quantity: Math.floor(this.quantityInfo.totalCombinedQuantity * 0.6)
      },
      {
        mandiId: 2,
        mandiName: 'North Side Mandi',
        quantity: Math.floor(this.quantityInfo.totalCombinedQuantity * 0.25)
      },
      {
        mandiId: 3,
        mandiName: 'Central Mandi',
        quantity: Math.floor(this.quantityInfo.totalCombinedQuantity * 0.15)
      }
    ];
  }

  private loadOrderStatistics() {
    // Simulate order statistics (in real app, this would come from API)
    const totalOrders = this.orderStats.totalOrdersPlaced;
    this.orderStats.last7Days = Math.floor(totalOrders * 0.1);
    this.orderStats.last30Days = Math.floor(totalOrders * 0.3);
    this.orderStats.last6Months = Math.floor(totalOrders * 0.7);
    this.orderStats.lastYear = Math.floor(totalOrders * 0.9);
  }

  // Quick Actions
  async updateStock() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.UPDATE_STOCK_HEADER'),
      message: this.translate.instant('PRODUCT_DETAILS.UPDATE_STOCK_MESSAGE'),
      inputs: [
        {
          name: 'quantity',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.STOCK_QUANTITY_PLACEHOLDER'),
          value: this.quantityInfo.totalCombinedQuantity
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
            if (data.quantity && data.quantity > 0) {
              const loading = await this.loadingCtrl.create({
                message: this.translate.instant('PRODUCT_DETAILS.UPDATING_STOCK')
              });
              await loading.present();

              // Simulate API call
              setTimeout(async () => {
                this.quantityInfo.totalCombinedQuantity = parseInt(data.quantity);
                this.loadMandiWiseData(); // Recalculate mandi-wise distribution
                await loading.dismiss();

                const toast = await this.toastCtrl.create({
                  message: this.translate.instant('PRODUCT_DETAILS.STOCK_UPDATED_SUCCESS'),
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

  async editPrice() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.EDIT_PRICE_HEADER'),
      message: this.translate.instant('PRODUCT_DETAILS.EDIT_PRICE_MESSAGE'),
      inputs: [
        {
          name: 'price',
          type: 'number',
          placeholder: this.translate.instant('PRODUCT_DETAILS.PRICE_PLACEHOLDER'),
          value: this.productInfo.pricePerUnit
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

              setTimeout(async () => {
                this.productInfo.pricePerUnit = parseFloat(data.price);
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
            if (data.discount && data.discount >= 0) {
              const discountAmount = (this.productInfo.pricePerUnit * data.discount) / 100;
              const newPrice = this.productInfo.pricePerUnit - discountAmount;

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

  async markOutOfStock() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
      message: this.translate.instant('PRODUCT_DETAILS.OUT_OF_STOCK_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('PRODUCT_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCT_DETAILS.CONFIRM'),
          handler: async () => {
            const toast = await this.toastCtrl.create({
              message: this.translate.instant('PRODUCT_DETAILS.MARKED_OUT_OF_STOCK'),
              duration: 2000,
              color: 'warning'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}