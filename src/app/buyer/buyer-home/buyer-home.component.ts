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
  closeOutline
} from 'ionicons/icons';

interface Category {
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

  categories: Category[] = [
    { name: 'Vegetables', image: 'assets/img/vegetables.png' },
    { name: 'Fruits', image: 'assets/img/fruits.png' },
    { name: 'Grains', image: 'assets/img/grains.png' },
    { name: 'Pulses', image: 'assets/img/pulses.png' },
    { name: 'Dairy', image: 'assets/img/dairy.png' },
    { name: 'Spices', image: 'assets/img/spices.png' },
    { name: 'Others', image: 'assets/images/other.jpg' }
  ];

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categoriesList: any[] = [];

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
      closeOutline
    });
  }

fetchCategories() {
    this.loadingCategories = true;
    this.buyerApiService.getCategories().subscribe(
      {
        next: (response) => {
          this.categoriesList = response;
          this.loadingCategories = false;
          console.log('Categories:', this.categoriesList);
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

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Account Options',
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
            this.router.navigate(['/buyer/retailer-order-tracking'],{
              queryParams: { id: 'ORD123456' } // Dummy ID or dynamically set
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
}
