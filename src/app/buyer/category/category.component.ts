import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal, AlertController, LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, close, search, funnelOutline, swapVerticalOutline, cartOutline, alertCircleOutline, star } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { BuyerApiService, Product, ProductAll, Category } from '../services/buyer-api.service';
import { CartService, AddCartItemRequest } from '../cart/cart.service';
import { AuthService } from '../../auth/auth.service';
import { catchError, finalize, switchMap, tap } from 'rxjs';
import { of } from 'rxjs';
import { Location } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MandiProduct, MandiService} from '../category/mandi-products.service';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
})
export class CategoryPageComponent implements OnInit {
  @ViewChild('filterModal') filterModal!: IonModal;
  @ViewChild('sortModal') sortModal!: IonModal;

  // Navigation and Selection
  superCategoryId: number = -1;
  categoryId: number = -1;
  selectedSubcategoryId: number = -1;
  selectedCategoryId: number = -1;
  selectedProduct: ProductAll | null = null;
  wholesalers: any[] = [];

  // UI State
  isSearchActive = false;
  searchQuery = '';
  categoryName: string = '';
  superCategoryName: string = '';
  selectedCategoryName: string | null = null;
  selectedSubcategory: string | null = null;
  showProducts = false;

  // Data
  categories: Category[] = [];
  category: Category | null = null;
  productsList: ProductAll[] = [];
  filteredAndSortedItems: ProductAll[] = [];

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

  sortOption: string = 'name-asc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private buyerApiService: BuyerApiService,
    private cartService: CartService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private mandiService: MandiService
  ) {
    addIcons({ chevronBack, close, search, alertCircleOutline, funnelOutline, swapVerticalOutline, cartOutline, star });
  }


  async addToCart(wholesaler: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Check authentication
    if (!this.authService.isAuthenticated()) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('CATEGORY.AUTH_REQUIRED'),
        message: this.translate.instant('CATEGORY.LOGIN_TO_ADD'),
        buttons: [
          {
            text: this.translate.instant('CATEGORY.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('CATEGORY.LOGIN'),
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    // Check if product is selected
    if (!this.selectedProduct) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('CATEGORY.ERROR'),
        message: this.translate.instant('CATEGORY.NO_PRODUCT_SELECTED'),
        buttons: [this.translate.instant('CATEGORY.OK')]
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('CATEGORY.ADDING_TO_CART'),
      spinner: 'circular'
    });

    try {
      await loading.present();

      if (wholesaler.price < 0) {
        const alert = await this.alertCtrl.create({
          header: this.translate.instant('CATEGORY.ERROR'),
          message: this.translate.instant('CATEGORY.INVALID_PRICE'),
          buttons: [this.translate.instant('CATEGORY.OK')]
        });
        await alert.present();
        return;
      }

      const cartRequest: AddCartItemRequest = {
        wholesaler_id: wholesaler.wholesaler_id,
        branch_id: wholesaler.id,
        product_id: this.selectedProduct.product_id,
        quantity: 1,
        unit_id: 1, // Default unit, adjust if you have unit selection
        price: wholesaler.price_per_unit
      };

      console.log('Adding to cart:', cartRequest);

      this.cartService.addItemToCart(cartRequest).subscribe({
        next: async (response) => {
          await loading.dismiss();
          console.log('Item added to cart:', response);

          const alert = await this.alertCtrl.create({
            header: this.translate.instant('CATEGORY.SUCCESS'),
            message: this.translate.instant('CATEGORY.ADDED_TO_CART', { product: this.selectedProduct?.product_name }),
            buttons: [
              {
                text: this.translate.instant('CATEGORY.CONTINUE_SHOPPING'),
                role: 'cancel'
              },
              {
                text: this.translate.instant('CATEGORY.VIEW_CART'),
                handler: () => {
                  this.router.navigate(['/buyer/cart']);
                }
              }
            ]
          });
          await alert.present();
        },
        error: async (error) => {
          await loading.dismiss();
          console.error('Error adding to cart:', error);

          let errorMessage = this.translate.instant('CATEGORY.FAILED_ADD_TO_CART');

          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          const alert = await this.alertCtrl.create({
            header: this.translate.instant('CATEGORY.ERROR'),
            message: errorMessage,
            buttons: [this.translate.instant('CATEGORY.OK')]
          });
          await alert.present();
        }
      });

    } catch (error) {
      await loading.dismiss();
      console.error('Error adding to cart:', error);

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('CATEGORY.ERROR'),
        message: this.translate.instant('CATEGORY.FAILED_ADD_TO_CART'),
        buttons: [this.translate.instant('CATEGORY.OK')]
      });
      await alert.present();
    }
  }

  ngOnInit() {
    this.route.params.pipe(
      tap(params => {
        this.superCategoryId = +params['superCategoryId'] || +params['categoryId'];
        this.categoryId = this.superCategoryId;

        // Pre-set the "All" selection
        this.selectedCategoryId = this.categoryId;
        this.selectedSubcategoryId = this.categoryId;

        this.loadingCategories = true;
        this.showProducts = false;
        this.errorLoadingCategories = false;
      }),
      switchMap(params => {
        // First get the super category info to get the proper name
        return this.buyerApiService.getSuperCategories().pipe(
          switchMap(superCategories => {
            // Find the current super category
            const currentSuperCategory = superCategories.find(cat => cat.category_id === this.superCategoryId);
            if (currentSuperCategory) {
              this.categoryName = currentSuperCategory.category_name;
              this.superCategoryName = currentSuperCategory.category_name;
              this.category = currentSuperCategory;

              // Set the selected category name
              this.selectedCategoryName = `All ${this.categoryName}`;
              this.selectedSubcategory = this.selectedCategoryName;
            } else {
              this.categoryName = 'Products';
              this.superCategoryName = this.categoryName;
              this.selectedCategoryName = `All ${this.categoryName}`;
              this.selectedSubcategory = this.selectedCategoryName;
            }

            // Now get the subcategories
            return this.buyerApiService.getCategoryBySuperCategoryId(this.superCategoryId);
          }),
          catchError(error => {
            console.error('Error fetching categories:', error);
            this.errorLoadingCategories = true;
            this.loadingCategories = false;
            // Fallback to generic name
            this.categoryName = 'Products';
            this.superCategoryName = this.categoryName;
            this.selectedCategoryName = `All ${this.categoryName}`;
            this.selectedSubcategory = this.selectedCategoryName;
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (categoryData) => {
        if (categoryData && categoryData.length > 0) {
          this.categories = Array.isArray(categoryData) ? categoryData : [categoryData];
        } else {
          this.categories = [];
        }
        this.loadingCategories = false;

        // Automatically load all products
        this.loadAllProducts();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorLoadingCategories = true;
        this.loadingCategories = false;
      }
    });
  }

  loadAllProducts() {
    this.loadingProducts = true;
    this.errorLoadingProducts = false;

    this.buyerApiService.getAllProductsOfSuperCategory(this.superCategoryId).pipe(
      catchError(error => {
        console.error('Error fetching all products of super category:', error);
        this.errorLoadingProducts = true;
        this.loadingProducts = false;
        return of([]);
      })
    ).subscribe({
      next: (products) => {
        this.productsList = products || [];
        this.applyFilters();
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading all products of super category:', error);
        this.errorLoadingProducts = true;
        this.loadingProducts = false;
      }
    });
  }

  selectSubcategory(category: Category | { category_id: number; category_name: string }) {
    this.loadingProducts = true;
    this.errorLoadingProducts = false;
    this.selectedCategoryId = category.category_id;
    this.selectedSubcategoryId = category.category_id;
    this.selectedCategoryName = category.category_name;
    this.selectedSubcategory = category.category_name;
    this.selectedProduct = null;

    if (category.category_id === this.categoryId) {
      this.buyerApiService.getAllProductsOfSuperCategory(this.superCategoryId).pipe(
        catchError(error => {
          console.error('Error fetching all products of super category:', error);
          this.errorLoadingProducts = true;
          this.loadingProducts = false;
          return of([]);
        })
      ).subscribe({
        next: (products) => {
          this.productsList = products || [];
          this.applyFilters();
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading all products of super category:', error);
          this.errorLoadingProducts = true;
          this.loadingProducts = false;
        }
      });
    } else {
      this.buyerApiService.getProductsByCategoryId(category.category_id).pipe(
        catchError(error => {
          console.error('Error fetching products:', error);
          this.errorLoadingProducts = true;
          this.loadingProducts = false;
          return of([]);
        })
      ).subscribe({
        next: (products) => {
          this.productsList = (products && products.length > 0)
            ? products.map(product => ({
              product_id: product.product_id,
              product_name: product.product_name,
              cat_id: product.category_id,
              cat_name: product.category_name,
              image_path: product.image_path,
              active_status: product.active_status,
              nutrition_factor: ''
            }))
            : [];
          this.applyFilters();
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.errorLoadingProducts = true;
          this.loadingProducts = false;
        }
      });
    }
  }

  // Keep the original method name as well
  selectCategory(category: Category) {
    this.selectSubcategory(category);
  }

  selectProduct(product: ProductAll) {
  this.selectedProduct = product;
  this.wholesalers = [];
  if (!product?.product_id) return;

  // Optionally, pass cityId if you have it
  this.mandiService.getMandisByProduct(product.product_id).subscribe({
    next: (mandis: MandiProduct[]) => {
      this.wholesalers = mandis;
    },
    error: (err) => {
      console.error('Failed to load mandis:', err);
      this.wholesalers = [];
    }
  });
}

  backToCategories() {
    this.showProducts = false;
    this.selectedCategoryId = -1;
    this.selectedSubcategoryId = -1;
    this.selectedCategoryName = null;
    this.selectedSubcategory = null;
    this.productsList = [];
    this.filteredAndSortedItems = [];
  }

  // Navigation back
  goBack() {
    if (this.showProducts) {
      this.backToCategories();
    } else {
      this.location.back();
    }
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
  getFilteredAndSortedItems(): ProductAll[] {
    if (!this.productsList) return [];

    let items = [...this.productsList];

    // Search Filter
    if (this.searchQuery) {
      items = items.filter(item =>
        item.product_name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Apply additional filters
    if (this.availability) {
      items = items.filter(item => item.active_status === 1);
    }

    // Apply sorting
    switch (this.sortOption) {
      case 'name-asc':
        items.sort((a, b) => a.product_name.localeCompare(b.product_name));
        break;
      case 'name-desc':
        items.sort((a, b) => b.product_name.localeCompare(a.product_name));
        break;
      case 'category-asc':
        items.sort((a, b) => a.cat_name.localeCompare(b.cat_name));
        break;
      case 'category-desc':
        items.sort((a, b) => b.cat_name.localeCompare(a.cat_name));
        break;
    }

    return items;
  }

  applyFilters() {
    this.filteredAndSortedItems = this.getFilteredAndSortedItems();
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
    this.closeSortModal();
    this.applyFilters();
  }

  goToProductDetails(product: ProductAll) {
    this.router.navigate(['/buyer/product-details', product.product_id]);
  }
}