import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryPageComponent {
  @ViewChild('filterModal') filterModal!: IonModal;
  @ViewChild('sortModal') sortModal!: IonModal;
  // @ViewChild('productModal') productModal!: IonModal;

  selectedSegment = 'nutrition'; // Default segment

  isSearchActive = false;
  searchQuery = '';
  categoryName: string = '';
  selectedSubcategory: string | null = null;
  selectedSubcategoryItems: {
    name: string;
    hindiName: string;
    image: string;
    price: number;
    quantity: string;
    discount: number;
    rating: number;
    inStock: boolean;
    deliveryTime: string;
    organic: boolean;
    minOrderQty: number;
  }[] = [];
  filteredAndSortedItems: any[] = [];

 // Filters
 selectedFilter: string | null = null; // Track selected filter section

 filterQuery: string = '';
 priceRangeMin: number = 0;
 priceRangeMax: number = 150;
 priceRangeValues: { lower: number; upper: number } = { lower: 0, upper: 150 };
 availability: boolean = false;
 quantityDiscount: boolean = false;
 deliveryTime: string = 'any';
 organic: boolean | null = null;
 sellerRatings: number = 0;
 minimumOrderQuantity: number = 0;

 // Available filter categories
 filterCategories = [
  { id: 'price', label: 'Price' },
  { id: 'availability', label: 'Availability' },
  { id: 'discount', label: 'Discount' },
  { id: 'delivery', label: 'Delivery Time' },
  { id: 'organic', label: 'Organic' },
  { id: 'rating', label: 'Ratings' },
  { id: 'quantity', label: 'Min Order Quantity' }
];

 sortOption: string = 'priceAsc';
 selectedProduct: any = null;

  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
    if (!this.isSearchActive) {
      this.searchQuery = ''; // Clear search when closing
    }
  }

  onSearch() {
    console.log('Search Query:', this.searchQuery);
    // Add search logic here
  }

  vegetableSubcategories = [
    { name: 'All', hindiName: 'सभी', image: 'assets/img/Vegetables2.png', items: [] },
    { name: 'Leafy Greens', hindiName: 'पत्तेदार सब्जियां', image: 'assets/img/Spinach2.png', items: [
      { name: 'Spinach', hindiName: 'पालक', image: 'assets/img/Spinach2.png', price: 40, quantity: '250g', discount: 5, rating: 4.5, inStock: true, deliveryTime: '1-3 days', organic: true, paymentMode: ['cash', 'upi'], minOrderQty: 2 }
    ]},
    { name: 'Root Vegetables', hindiName: 'जड़ वाली सब्जियां', image: 'assets/img/Carrot1.png', items: [
      { name: 'Carrots', hindiName: 'गाजर', image: 'assets/img/Carrot1.png', price: 35, quantity: '500g', discount: 5, rating: 4.5, inStock: true, deliveryTime: '2-4 days', organic: true, paymentMode: ['upi', 'cash'], minOrderQty: 2 },
    ]},
    { name: 'Bulbs', hindiName: 'बल्ब सब्जियां', image: 'assets/img/Onion1.png', items: [
      { name: 'Onions', hindiName: 'प्याज', image: 'assets/img/Onion1.png', price: 20, quantity: '1kg', discount: 2, rating: 4.1, inStock: true, deliveryTime: '1-3 days', organic: false, paymentMode: ['cash', 'card'], minOrderQty: 1 },
    ]},
    { name: 'Beans & Peas', hindiName: 'बीन्स और मटर', image: 'assets/img/Peas1.png', items: [
      { name: 'Green Beans', hindiName: 'हरी बीन्स', image: 'assets/img/green_beans.png', price: 40, quantity: '500g', discount: 5, rating: 4.5, inStock: true, deliveryTime: '2-4 days', organic: true, paymentMode: ['cash', 'upi'], minOrderQty: 2 },
    ]},
    { name: 'Stems', hindiName: 'तने वाली सब्जियां', image: 'assets/img/Asparagus1.png', items: [
      { name: 'Celery', hindiName: 'अजवाइन', image: 'assets/img/celery.png', price: 45, quantity: '1 bunch', discount: 3, rating: 4.2, inStock: false, deliveryTime: '3-5 days', organic: true, paymentMode: ['cash'], minOrderQty: 1 },
    ]},
    { name: 'Gourds & Pumpkins', hindiName: 'लौकी और कद्दू', image: 'assets/img/Gourd1.png', items: [
      { name: 'Bottle Gourd', hindiName: 'लौकी', image: 'assets/img/bottle_gourd.png', price: 35, quantity: '1 piece', discount: 3, rating: 4.2, inStock: false, deliveryTime: '3-5 days', organic: true, paymentMode: ['cash'], minOrderQty: 1 },
      ]},
    { name: 'Flowering Vegetables', hindiName: 'फूल वाली सब्जियां', image: 'assets/img/Broccoli1.png', items: [
      { name: 'Broccoli', hindiName: 'ब्रोकली', image: 'assets/img/broccoli.png', price: 80, quantity: '500g', discount: 3, rating: 4.2, inStock: false, deliveryTime: '3-5 days', organic: true, paymentMode: ['cash'], minOrderQty: 1 },
    ]},
    { name: 'Fruity Vegetables', hindiName: 'फल वाली सब्जियां', image: 'assets/img/Tomato1.png', items: [
      { name: 'Tomatoes', hindiName: 'टमाटर', image: 'assets/img/tomatoes.png', price: 30, quantity: '1kg', discount: 3, rating: 4.2, inStock: false, deliveryTime: '3-5 days', organic: true, paymentMode: ['cash'], minOrderQty: 1 },
    ]},
    { name: 'Tubers', hindiName: 'कंद वाली सब्जियां', image: 'assets/img/Potato1.png', items: [
      { name: 'Potatoes', hindiName: 'आलू', image: 'assets/img/potatoes.png', price: 25, quantity: '1kg', discount: 3, rating: 4.2, inStock: false, deliveryTime: '3-5 days', organic: true, paymentMode: ['cash'], minOrderQty: 1 },
    ]}
  ];

  fruitSubcategories = [
    { name: 'All', hindiName: 'सभी', image: 'assets/img/Fruits.png', items: [] },
    { name: 'Citrus Fruits', hindiName: 'खट्टे फल', image: 'assets/img/oranges.png', items: [
        { name: 'Oranges', hindiName: 'संतरा', image: 'assets/img/oranges.png', price: 60, quantity: '1kg', discount: 10, rating: 4.3, inStock: true, deliveryTime: '1-2 days', organic: false, paymentMode: ['cash', 'upi', 'card'], minOrderQty: 1 }
      ]},
    { name: 'Berries', hindiName: 'बेरी फल', image: 'assets/img/strawberries.png', items: [
        { name: 'Strawberries', hindiName: 'स्ट्रॉबेरी', image: 'assets/img/strawberries.png', price: 120, quantity: '500g', discount: 5, rating: 4.7, inStock: true, deliveryTime: '2-3 days', organic: true, paymentMode: ['cash', 'upi'], minOrderQty: 2 }
      ]},
    { name: 'Stone Fruits', hindiName: 'गुठली वाले फल', image: 'assets/img/mangoes.png', items: [
        { name: 'Mangoes', hindiName: 'आम', image: 'assets/img/mangoes.png', price: 100, quantity: '1kg', discount: 8, rating: 4.6, inStock: true, deliveryTime: '1-3 days', organic: true, paymentMode: ['cash', 'upi', 'card'], minOrderQty: 1 }
      ]},
    { name: 'Tropical Fruits', hindiName: 'उष्णकटिबंधीय फल', image: 'assets/img/bananas.png', items: [
        { name: 'Bananas', hindiName: 'केला', image: 'assets/img/bananas.png', price: 40, quantity: '1 dozen', discount: 0, rating: 4.5, inStock: true, deliveryTime: '1 day', organic: false, paymentMode: ['cash', 'upi'], minOrderQty: 3 }
      ]}
  ];

  grainSubcategories = [
    { name: 'All', hindiName: 'सभी', image: 'assets/img/Grains.png', items: [] },
    { name: 'Cereal Grains', hindiName: 'अनाज', image: 'assets/img/rice.png', items: [
        { name: 'Rice', hindiName: 'चावल', image: 'assets/img/rice.png', price: 60, quantity: '1kg', discount: 5, rating: 4.2, inStock: true, deliveryTime: '2-3 days', organic: true, paymentMode: ['cash', 'upi', 'card'], minOrderQty: 1 }
      ]},
    { name: 'Millets', hindiName: 'बाजरा एवं अन्य मोटे अनाज', image: 'assets/img/millets.png', items: [
        { name: 'Bajra (Pearl Millet)', hindiName: 'बाजरा', image: 'assets/img/bajra.png', price: 80, quantity: '1kg', discount: 7, rating: 4.5, inStock: true, deliveryTime: '3-4 days', organic: true, paymentMode: ['cash', 'upi'], minOrderQty: 2 }
      ]}
  ];

  pulsesSubcategories = [
    { name: 'All', hindiName: 'सभी', image: 'assets/img/Pulses.png', items: [] },
    { name: 'Lentils', hindiName: 'मसूर', image: 'assets/img/lentils.png', items: [
        { name: 'Red Lentils (Masoor)', hindiName: 'मसूर दाल', image: 'assets/img/masoor_lentils.png', price: 90, quantity: '1kg', discount: 5, rating: 4.3, inStock: true, deliveryTime: '2-3 days', organic: true, paymentMode: ['cash', 'upi', 'card'], minOrderQty: 1 }
      ]},
    { name: 'Beans', hindiName: 'सेम', image: 'assets/img/beans.png', items: [
        { name: 'Kidney Beans (Rajma)', hindiName: 'राजमा', image: 'assets/img/kidney_beans.png', price: 110, quantity: '1kg', discount: 8, rating: 4.6, inStock: true, deliveryTime: '3-4 days', organic: false, paymentMode: ['cash', 'upi'], minOrderQty: 2 }
      ]}
  ];

  constructor(private route: ActivatedRoute, private router: Router) {
    addIcons({ chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline });

    this.route.params.subscribe(params => {
      this.categoryName = params['categoryName'];
      this.selectSubcategory('All', this.getCategorySubcategories());
      this.applyFilters();
    });
  }

  getCategorySubcategories() {
    switch (this.categoryName) {
      case 'Vegetables': return this.vegetableSubcategories;
      case 'Fruits': return this.fruitSubcategories;
      case 'Grains': return this.grainSubcategories;
      case 'Pulses': return this.pulsesSubcategories;
      default: return [];
    }
  }

  selectSubcategory(name: string, subcategories: { name: string; image: string; items?: any[] }[]) {
    this.selectedSubcategory = name;
    this.selectedSubcategoryItems = name === 'All'
      ? subcategories.map((sub) => sub.items || []).reduce((acc, items) => acc.concat(items), [])
      : (subcategories.find((sub) => sub.name === name)?.items || []);
  }

  getFilteredAndSortedItems() {
    let items = [...this.selectedSubcategoryItems];

     // Filtering logic
     if (this.filterQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(this.filterQuery.toLowerCase())
      );
    }

    items = items.filter(
      (item) =>
        item.price >= this.priceRangeValues.lower &&
        item.price <= this.priceRangeValues.upper
    );

    // Apply availability filter
    if (this.availability) {
      items = items.filter((item) => item.inStock);
    }

    // Apply quantity discount filter
    if (this.quantityDiscount) {
      items = items.filter((item) => item.discount > 0);
    }

    // Apply delivery time filter
    if (this.deliveryTime !== 'any') {
      items = items.filter((item) => item.deliveryTime === this.deliveryTime);
    }

    // Apply organic filter
    if (this.organic !== null) {
      items = items.filter((item) => item.organic === this.organic);
    }

    // Apply seller ratings filter
    items = items.filter((item) => item.rating >= this.sellerRatings);

    items = items.filter((item) => item.minOrderQty >= this.minimumOrderQuantity);

   // Sorting
    switch (this.sortOption) {
      case 'price-asc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        items.sort((a, b) => b.discount - a.discount);
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
    }

    return items;
  }

  openFilterModal() {
    if (this.filterModal) {
      this.filterModal.present();
    }
  }

  closeFilterModal() {
    if (this.filterModal) {
      this.filterModal.dismiss();
    }
  }

   // Select a filter category from the left panel
   selectFilter(filterId: string) {
    this.selectedFilter = filterId;
  }

  applyFilters() {
    console.log('Filters applied:', {
      priceRange: this.priceRangeValues,
      availability: this.availability,
      quantityDiscount: this.quantityDiscount,
      deliveryTime: this.deliveryTime,
      organic: this.organic,
      sellerRatings: this.sellerRatings,
      minimumOrderQuantity: this.minimumOrderQuantity,
    });
    this.filteredAndSortedItems = this.getFilteredAndSortedItems()
  }
  openSortModal() {
    if (this.sortModal) {
      this.sortModal.present();
    }
  }

  closeSortModal() {
    if (this.sortModal) {
      this.sortModal.dismiss();
    }
  }
  applySort() {
    this.filteredAndSortedItems = this.getFilteredAndSortedItems();
  }

  // openProductModal(product: any) {
  //   this.selectedProduct = product;
  //   this.productModal?.present();
  // }

  // closeProductModal() {
  //   this.productModal?.dismiss();
  // }
  openProductDetails(item: any) {
    this.router.navigate(['/buyer/product-details', item.id]); // Navigate to product details page
  }


  updatePriceRange(event: any) {
    this.priceRangeMin = event.detail.value.lower;
    this.priceRangeMax = event.detail.value.upper;
    this.priceRangeValues = event.detail.value;
  }

//wishlist and cart
wishlist: any[] = [];
cart: any[] = [];

addToWishlist(product: any, event?: Event) {
  if (event) event.stopPropagation(); // Prevent card click from triggering modal
  if (!this.wishlist.some(item => item.name === product.name)) {
    this.wishlist.push(product);
    console.log('Added to wishlist:', product.name);
  } else {
    console.log('Already in wishlist:', product.name);
  }
}

addToCart(product: any, event?: Event) {
  if (event) event.stopPropagation(); // Prevent card click from triggering modal
  if (!this.cart.some(item => item.name === product.name)) {
    this.cart.push(product);
    console.log('Added to cart:', product.name);
  } else {
    console.log('Already in cart:', product.name);
  }
}

/** Navigate to Wishlist Page */
goToWishlist(event?: Event) {
  if (event) event.stopPropagation(); // Prevent modal or card click
  this.router.navigate(['/wishlist']);
}

/** Navigate to Cart Page */
goToCart(event?: Event) {
  if (event) event.stopPropagation(); // Prevent modal or card click
  this.router.navigate(['/cart']);
}

clearFilters() {
  this.searchQuery = ''; // Clear search query
  this.priceRangeValues = { lower: 0, upper: 150 }; // Reset price range
  this.availability = false; // Reset availability filter
  this.quantityDiscount = false; // Reset discount filter
  this.deliveryTime = 'any'; // Reset delivery time
  this.organic = null; // Reset organic filter
  this.sellerRatings = 0; // Reset seller ratings
  this.minimumOrderQuantity = 0; // Reset min order quantity

  // Reapply filters to show all items again
  this.applyFilters();
}
}
