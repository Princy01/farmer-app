import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline, locationOutline, chevronForwardOutline, heartOutline, cartOutline } from 'ionicons/icons';

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

  constructor(private router: Router) {
    addIcons({ personCircleOutline, locationOutline, chevronForwardOutline, heartOutline, cartOutline });
  }

  onScroll(event: any) {
    this.hideHeader = event.detail.scrollTop > 100;
  }
}