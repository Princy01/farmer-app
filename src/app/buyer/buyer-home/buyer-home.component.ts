// filepath: c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master\src\app\buyer\buyer-home\buyer-home.component.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, ActionSheetController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BuyerApiService } from '../services/buyer-api.service';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  locationOutline,
  chevronForwardOutline,
  heartOutline,
  cartOutline,
  personOutline,
  archiveOutline,
  linkOutline,
  settingsOutline,
  closeOutline,
  statsChartOutline,
  gridOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';

interface Category {
  id: number;
  name: string;
  image: string;
}

@Component({
  selector: 'app-buyer-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './buyer-home.component.html',
  styleUrls: ['./buyer-home.component.scss'],
})
export class BuyerHomeComponent {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categories: any[] = [];

  constructor(
    private router: Router,
    private actionSheetController: ActionSheetController,
    private buyerApiService: BuyerApiService
  ) {
    addIcons({
      personCircleOutline,
      locationOutline,
      chevronForwardOutline,
      heartOutline,
      cartOutline,
      personOutline,
      archiveOutline,
      linkOutline,
      settingsOutline,
      closeOutline,
      statsChartOutline,
      gridOutline,
      alertCircleOutline,
      refreshOutline
    });
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.errorLoadingCategories = false;

    this.buyerApiService.getSuperCategories().subscribe({
      next: (response) => {
        this.categories = response;
        this.loadingCategories = false;
        console.log('Categories:', this.categories);
      },
      error: (error) => {
        this.errorLoadingCategories = true;
        this.loadingCategories = false;
        console.error('Error fetching categories:', error);
      }
    });
  }

  ngOnInit() {
    this.fetchCategories();
  }

  onScroll(event: any) {
    this.hideHeader = event.detail.scrollTop > 100;
  }

  onImageError(event: any) {
    // Set a default image when category image fails to load
    event.target.src = '';
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Account Options',
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Profile',
          icon: 'person-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/buyer/profile']);
          }
        },
        {
          text: 'Track Orders',
          icon: 'archive-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/buyer/retailer-order-tracking'], {
              queryParams: { id: 'ORD123456' }
            });
          }
        },
        {
          text: 'Linked Accounts',
          icon: 'link-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/buyer/linked-accounts']);
          }
        },
        {
          text: 'Settings',
          icon: 'settings-outline',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.router.navigate(['/buyer/settings']);
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel',
          cssClass: 'custom-action-sheet-btn'
        }
      ]
    });
    await actionSheet.present();
  }

  openTrends() {
    this.router.navigate(['/buyer/RetailerTrends']);
  }
}