import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController, AlertController } from '@ionic/angular';
import { AddProductModalComponent } from '../add-product-modal/add-product-modal.component';
import { addIcons } from 'ionicons';
import { chevronBack, storefrontOutline, addOutline, searchOutline, cubeOutline, pricetagOutline, cashOutline, layersOutline, trashOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BranchProductsService, BranchProduct } from './branch-products.service';
import { getProductFallbackByName, normalizeImagePath } from '../../buyer/utils/buyer-image.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_path: string | null;
  unit_name: string;
}

@Component({
  selector: 'app-branch-products',
  templateUrl: './branch-products.component.html',
  styleUrls: ['./branch-products.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe]
})
export class BranchProductsComponent implements OnInit, OnDestroy {
  branchId: number | null = null;
  branchName: string = '';
  products: Product[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  isRemoving: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private branchProductsService: BranchProductsService
  ) {
    addIcons({
      chevronBack,
      storefrontOutline,
      addOutline,
      searchOutline,
      cubeOutline,
      pricetagOutline,
      cashOutline,
      layersOutline,
      trashOutline
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.branchId = params['branchId'] ? parseInt(params['branchId'], 10) : null;
        this.branchName = params['branchName'] || '';
        if (this.branchId) {
          this.loadProducts();
        } else {
          this.showError(this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_NO_BRANCH'));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads products for the current branch with error handling
   */
  loadProducts(): void {
    if (!this.branchId) {
      this.showError(this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_NO_BRANCH'));
      return;
    }

    this.isLoading = true;
    this.branchProductsService
      .getProductsByBranch(this.branchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: BranchProduct[]) => {
          this.products = data.map(bp => ({
            id: bp.product_id,
            name: bp.product_name,
            price: bp.price_per_unit,
            stock: bp.current_stock,
            image_path: bp.image_path || '',
            unit_name: bp.unit_name || ''
          }));
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.handleLoadError(err);
        }
      });
  }

  /**
   * Handles loading errors with appropriate user-friendly messages
   */
  private handleLoadError(error: any): void {
    let errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_LOADING_DATA');

    if (error.status === 401) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_UNAUTHORIZED');
      // Redirect to login
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else if (error.status === 403) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_FORBIDDEN');
    } else if (error.status === 404) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_NOT_FOUND');
    } else if (error.status === 500) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_SERVER');
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Request took too long. Please check your connection and try again.';
    } else if (!error.status) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_CLIENT');
    }

    this.showError(errorMessage);
  }

  /**
   * Filters products based on search term (using client-side filtering for small lists)
   */
  filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.products;
    }
    return this.products.filter(p =>
      p.name.toLowerCase().includes(term)
    );
  }

  productImageUrl(product: Product): string {
    return normalizeImagePath(product.image_path) || getProductFallbackByName(product.name);
  }

  onProductImageError(event: Event, product: Product): void {
    const image = event.target as HTMLImageElement;
    const fallback = getProductFallbackByName(product.name);
    if (image.src !== new URL(fallback, document.baseURI).href) {
      image.src = fallback;
    }
  }

  /**
   * Shows error toast with retry option
   */
  private async showError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_UNKNOWN') === 'An unexpected error occurred. Please try again.'
            ? 'Dismiss'
            : 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Shows success toast
   */
  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Removes a product with confirmation dialog
   */
  async removeProduct(index: number): Promise<void> {
    const filteredList = this.filteredProducts();
    const product = filteredList[index];

    if (!this.branchId || !product) {
      return;
    }

    // Show confirmation dialog for destructive action
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('PRODUCTS_IN_BRANCH.REMOVE') || 'Remove Product',
      message: `${this.translate.instant('PRODUCTS_IN_BRANCH.PRODUCT_NAME') || 'Product'}: ${product.name}`,
      buttons: [
        {
          text: this.translate.instant('PRODUCTS_IN_BRANCH.CANCEL') || 'Cancel',
          role: 'cancel'
        },
        {
          text: this.translate.instant('PRODUCTS_IN_BRANCH.REMOVE') || 'Remove',
          role: 'destructive',
          handler: () => {
            this.performRemoveProduct(product);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Performs the actual product removal after confirmation
   */
  private performRemoveProduct(product: Product): void {
    if (!this.branchId) {
      return;
    }

    this.isRemoving = true;
    this.branchProductsService
      .deleteProductFromBranch(this.branchId, product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isRemoving = false;
          this.loadProducts();
          this.showSuccess(
            this.translate.instant('PRODUCTS_IN_BRANCH.PRODUCT_REMOVED')
          );
        },
        error: (err) => {
          this.isRemoving = false;
          this.handleRemoveError(err);
        }
      });
  }

  /**
   * Handles product removal errors
   */
  private handleRemoveError(error: any): void {
    let errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.REMOVE_ERROR');

    if (error.status === 401) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_UNAUTHORIZED');
    } else if (error.status === 403) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_FORBIDDEN');
    } else if (error.status === 404) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_NOT_FOUND');
    } else if (error.status === 500) {
      errorMessage = this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_SERVER');
    }

    this.showError(errorMessage);
  }

  /**
   * Opens modal to add a new product to branch
   */
  async addProduct(): Promise<void> {
    if (!this.branchId) {
      this.showError(
        this.translate.instant('PRODUCTS_IN_BRANCH.ERROR_NO_BRANCH')
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: AddProductModalComponent,
      componentProps: {
        bid: this.branchId
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data === 'success') {
      this.loadProducts();
      this.showSuccess(
        this.translate.instant('PRODUCTS_IN_BRANCH.PRODUCT_ADDED')
      );
    }
  }

  /**
   * Navigates back to business locations
   */
  goBack(): void {
    this.router.navigate(['/wholesaler/business-locations']);
  }
}