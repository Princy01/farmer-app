import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle } from 'ionicons/icons';
import { WholesalerApiService, RestockProduct } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-restocking-recommendations',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
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
    private loadingCtrl: LoadingController,
    private translate: TranslateService
  ) {
    addIcons({ alertCircle });
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
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

    this.loadRestockingRecommendations();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RESTOCK_RECS.AUTH_ERROR'),
      message: this.translate.instant('RESTOCK_RECS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.OK'),
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
      header: this.translate.instant('RESTOCK_RECS.ACCESS_DENIED'),
      message: this.translate.instant('RESTOCK_RECS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.OK'),
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
      message: this.translate.instant('RESTOCK_RECS.LOADING_RECOMMENDATIONS'),
      spinner: 'circular',
    });

    try {
      await loading.present();
      this.isLoading = true;
      this.error = null;

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

          if (error.status === 401) {
            this.showAuthError();
            return;
          }

          this.error = this.translate.instant('RESTOCK_RECS.LOAD_ERROR');
          this.showErrorAlert();
        }
      });
    } catch {
      loading.dismiss();
      this.isLoading = false;
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('RESTOCK_RECS.UNEXPECTED_ERROR'),
        message: this.translate.instant('RESTOCK_RECS.TRY_LATER'),
        buttons: [this.translate.instant('RESTOCK_RECS.OK')]
      });
      await alert.present();
    }
  }

  private async showErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RESTOCK_RECS.ERROR_TITLE'),
      message: this.translate.instant('RESTOCK_RECS.LOAD_ERROR'),
      buttons: [
        {
          text: this.translate.instant('RESTOCK_RECS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RESTOCK_RECS.RETRY'),
          handler: () => this.loadRestockingRecommendations()
        }
      ]
    });
    await alert.present();
  }

  getBadgeText(ratio: number): string {
    if (ratio < 2) return this.translate.instant('RESTOCK_RECS.LOW_STOCK');
    if (ratio < 4) return this.translate.instant('RESTOCK_RECS.RESTOCK_SOON');
    return this.translate.instant('RESTOCK_RECS.STOCK_SUFFICIENT');
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