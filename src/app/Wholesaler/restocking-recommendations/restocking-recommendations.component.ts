import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { RestockProduct } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-restocking-recommendations',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './restocking-recommendations.component.html',
  styleUrls: ['./restocking-recommendations.component.scss']
})
export class RestockingRecommendationsComponent implements OnInit {
  products: RestockProduct[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private wholesalerService: WholesalerApiService,
    private router: Router,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) {
    addIcons({ alertCircle });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadRestockingRecommendations();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  // unauthorized error handler
  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadRestockingRecommendations() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading restocking recommendations...',
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.error = null;

      // Call service without wholesaler ID - backend will get user_id from JWT
      this.wholesalerService.getRestockingRecommendations().subscribe({
        next: (data) => {
          this.products = data;
          this.isLoading = false;
          loading.dismiss();
        },
        error: async (error) => {
          console.error('Failed to load restocking recommendations:', error);
          this.isLoading = false;
          loading.dismiss();

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          this.error = 'Failed to load recommendations. Please try again.';
          this.showErrorAlert();
        }
      });
    } catch (err) {
      loading.dismiss();
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private async showErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: 'Failed to load restocking recommendations. Please try again.',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: () => {
            this.loadRestockingRecommendations();
          }
        }
      ]
    });
    await alert.present();
  }

  getBadgeText(ratio: number): string {
    if (ratio < 2) return 'Low Stock';
    if (ratio < 4) return 'Restock Soon';
    return 'Stock Sufficient';
  }

  getBadgeColor(product: RestockProduct): string {
    const ratio = product.stock_to_sales_ratio;
    if (ratio < 2) return 'danger';
    if (ratio < 4) return 'warning';
    return 'success';
  }

  filteredProducts() {
    return this.products
      .filter(product => product.stock_to_sales_ratio < 4)
      .sort((a, b) => a.stock_to_sales_ratio - b.stock_to_sales_ratio);
  }

  async handleRefresh(event: any) {
    try {
      await this.loadRestockingRecommendations();
    } finally {
      event.target.complete();
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}