import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { BuyerApiService, Product, Category, CategoryWithSubCategories } from '../services/buyer-api.service';
import { catchError, finalize, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryPageComponent implements OnInit {
  @ViewChild('filterModal') filterModal!: IonModal;
  @ViewChild('sortModal') sortModal!: IonModal;
  @ViewChild('productModal') productModal!: IonModal;

  // Navigation and Selection
  categoryId: number = -1;
  selectedCategoryId: number = -1;
  selectedSubcategoryId: number = -1;

  // UI State
  isSearchActive = false;
  searchQuery = '';
  categoryName: string = '';
  selectedSubcategory: string | null = null;

  // Data
  category?: CategoryWithSubCategories;
  categories: Category[] = [];
  productsList: Product[] = [];
  selectedSubcategoryItems: Product[] = [];
  filteredAndSortedItems: Product[] = [];

  // Loading States
  loadingCategories = false;
  errorLoadingCategories = false;
  loadingProducts = false;
  errorLoadingProducts = false;

  // Filters
  selectedFilter: string | null = null;
  filterQuery: string = '';
  priceRangeMin: number = 0;
  priceRangeMax: number = 150;
  priceRangeValues = { lower: 0, upper: 150 };
  availability: boolean = false;
  quantityDiscount: boolean = false;
  deliveryTime: string = 'any';
  organic: boolean | null = null;
  sellerRatings: number = 0;
  minimumOrderQuantity: number = 0;

  filterCategories = [
    { id: 'price', label: 'Price' },
    { id: 'availability', label: 'Availability' },
    { id: 'discount', label: 'Discount' },
    { id: 'delivery', label: 'Delivery Time' },
    { id: 'organic', label: 'Organic' },
    { id: 'rating', label: 'Ratings' },
    { id: 'quantity', label: 'Min Order Quantity' }
  ];

  sortOption: string = 'price-asc';
  selectedProduct: Product | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private buyerApiService: BuyerApiService
  ) {
    addIcons({ chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline });
  }

  ngOnInit() {
    this.route.params.pipe(
      tap(params => {
        this.categoryId = +params['categoryId'];
        this.loadingCategories = true;
        this.loadingProducts = true;
      }),
      switchMap(params => this.buyerApiService.getCategoryById(+params['categoryId']).pipe(
        catchError(error => {
          console.error('Error fetching category:', error);
          this.errorLoadingCategories = true;
          this.loadingCategories = false;
          throw error;
        })
      )),
      switchMap(categoryData => {
        this.category = categoryData;
        this.categories = categoryData.subcategories || [];
        this.categoryName = categoryData.category_name;
        this.selectedCategoryId = categoryData.category_id;
        this.loadingCategories = false;

        return this.fetchProductsByCategoryID(this.categoryId);
      })
    ).subscribe({
      next: (products) => {
        this.productsList = products;
        this.selectedSubcategoryItems = products;
        this.applyFilters();
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error in category/products chain:', error);
        this.errorLoadingProducts = true;
        this.loadingProducts = false;
      }
    });
  }

  selectSubcategory(subcategory: Category) {
    this.loadingProducts = true;
    this.errorLoadingProducts = false;
    this.selectedSubcategory = subcategory.category_name;
    this.selectedSubcategoryId = subcategory.category_id;

    this.fetchProductsByCategoryID(subcategory.category_id).subscribe({
      next: (products) => {
        this.productsList = products;
        this.selectedSubcategoryItems = products;
        this.applyFilters();
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error fetching subcategory products:', error);
        this.errorLoadingProducts = true;
        this.loadingProducts = false;
      }
    });
  }

  private fetchProductsByCategoryID(categoryId: number) {
    return this.buyerApiService.getProductsByCategoryId(categoryId).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        this.errorLoadingProducts = true;
        this.loadingProducts = false;
        throw error;
      })
    );
  }

  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
    if (!this.isSearchActive) {
      this.searchQuery = '';
      this.applyFilters();
    }
  }

  onSearch() {
    this.applyFilters();
  }

  // Filter and Sort Methods
  getFilteredAndSortedItems(): Product[] {
    if (!this.selectedSubcategoryItems) return [];

    let items = [...this.selectedSubcategoryItems];

    // Search Filter
    if (this.searchQuery) {
      items = items.filter(item =>
        item.product_name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Other Filters
    // if (this.availability) {
    //   items = items.filter(item => item.stock > 0);
    // }

    // Update sort options to remove price-based sorting
    switch (this.sortOption) {
        case 'name-asc':
          items.sort((a, b) => a.product_name.localeCompare(b.product_name));
          break;
        case 'name-desc':
          items.sort((a, b) => b.product_name.localeCompare(a.product_name));
          break;
    //   case 'rating':
    //     items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    //     break;
    }

    return items;
  }

  applyFilters() {
    this.filteredAndSortedItems = this.getFilteredAndSortedItems();
  }

  // Modal Methods
  openProductModal(product: Product) {
    this.selectedProduct = product;
    this.productModal?.present();
  }

  closeProductModal() {
    this.productModal?.dismiss();
  }

  openFilterModal() {
    this.filterModal?.present();
  }

  closeFilterModal() {
    this.filterModal?.dismiss();
  }

  openSortModal() {
    this.sortModal?.present();
  }

  closeSortModal() {
    this.sortModal?.dismiss();
  }

  // Reset Methods
  clearFilters() {
    this.searchQuery = '';
    this.priceRangeValues = { lower: 0, upper: 150 };
    this.availability = false;
    this.quantityDiscount = false;
    this.deliveryTime = 'any';
    this.organic = null;
    this.sellerRatings = 0;
    this.minimumOrderQuantity = 0;
    this.applyFilters();
  }

  applySort() {
    // Close the sort modal
    this.closeSortModal();

    // Apply the filters which includes sorting
    this.applyFilters();
  }
}