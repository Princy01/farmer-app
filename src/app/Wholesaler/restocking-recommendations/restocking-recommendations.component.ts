import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle } from 'ionicons/icons';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { RestockProduct } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';

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

  private wholesalerId: number | null = null;

  constructor(
    private wholesalerService: WholesalerApiService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ alertCircle });
  }

  ngOnInit() {
    this.initializeWholesaler();
    this.loadRestockingRecommendations();
  }
  private initializeWholesaler() {
    const storedWholesalerId = localStorage.getItem('wholesalerId');
    if (storedWholesalerId) {
      this.wholesalerId = Number(storedWholesalerId);
      this.loadRestockingRecommendations();
    } else {
      // Redirect to login if no wholesaler ID found
      this.showAuthError();
    }
  }

   private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Please login again.',
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
    if (!this.wholesalerId) {
      this.showAuthError();
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.wholesalerService.getRestockingRecommendations(this.wholesalerId).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load restocking recommendations:', error);
        this.error = 'Failed to load recommendations. Please try again.';
        this.isLoading = false;
        this.showErrorAlert();
      }
    });
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
