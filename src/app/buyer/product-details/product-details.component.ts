// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { ProductService } from '../../services/product.service';

// @Component({
//   selector: 'app-product-details',
//   templateUrl: './product-details.component.html',
//   styleUrls: ['./product-details.component.scss'],
// })
// export class ProductDetailsComponent implements OnInit {
//   productId: string | null = null;
//   productDetails: any = null;

//   constructor(
//     private route: ActivatedRoute,
//     private productService: ProductService
//   ) {}

//   ngOnInit() {
//     this.productId = this.route.snapshot.paramMap.get('id');
//     if (this.productId) {
//       this.loadProductDetails(this.productId);
//     }
//   }

//   loadProductDetails(id: string) {
//     this.productService.getProductDetails(id).subscribe(
//       (data) => {
//         this.productDetails = data;
//       },
//       (error) => {
//         console.error('Error fetching product details:', error);
//       }
//     );
//   }
// }
