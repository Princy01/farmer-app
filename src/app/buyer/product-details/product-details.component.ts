import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

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

  constructor(private route: ActivatedRoute) {}

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
      { name: 'Mandi A', price: 20, distance: '2km', retailer: 'Retailer 1' },
      { name: 'Mandi B', price: 22, distance: '5km', retailer: 'Retailer 2' },
      { name: 'Mandi C', price: 19, distance: '7km', retailer: 'Retailer 3' },
      { name: 'Mandi A', price: 20, distance: '2km', retailer: 'Retailer 1' },
      { name: 'Mandi B', price: 22, distance: '5km', retailer: 'Retailer 2' },
      { name: 'Mandi A', price: 20, distance: '2km', retailer: 'Retailer 1' },
      { name: 'Mandi B', price: 22, distance: '5km', retailer: 'Retailer 2' },
      { name: 'Mandi A', price: 20, distance: '2km', retailer: 'Retailer 1' },
      { name: 'Mandi B', price: 22, distance: '5km', retailer: 'Retailer 2' },
      { name: 'Mandi A', price: 20, distance: '2km', retailer: 'Retailer 1' },
      { name: 'Mandi B', price: 22, distance: '5km', retailer: 'Retailer 2' }
    ];
  }
}