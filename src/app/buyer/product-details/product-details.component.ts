import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { add, heartOutline, star } from 'ionicons/icons';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
})
export class ProductDetailsComponent implements OnInit {
  productId: number = -1;
  product: any;
  wholesalers: any[] = [];

  constructor(private route: ActivatedRoute) {
    addIcons({ add, heartOutline, star });
  }

  ngOnInit() {
    this.productId = +this.route.snapshot.params['productId'];
    // Dummy general product info
    this.product = {
      product_id: this.productId,
      product_name: 'Potato',
      nutrition_factor: 'Rich in carbs, vitamin C, potassium',
      image_path: 'assets/img/Potato1.png',
      description: 'Potatoes are a staple food rich in nutrients and energy.'
    };
    // Dummy wholesaler info
    this.wholesalers = [
      { name: 'Mandi A', price: 200, distance: '2km', quantity: 100, rating: 4.5 },
      { name: 'Mandi B', price: 220, distance: '5km', quantity: 80, rating: 4.2 },
      { name: 'Mandi C', price: 190, distance: '7km', quantity: 120, rating: 4.7 }
    ];
  }
}