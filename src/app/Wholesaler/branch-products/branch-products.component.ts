import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { AddProductModalComponent } from '../add-product-modal/add-product-modal.component';
import { addIcons } from 'ionicons';
import { chevronBack, storefrontOutline, addOutline, searchOutline, cubeOutline, pricetagOutline, cashOutline, layersOutline, trashOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BranchProductsService, BranchProduct } from './branch-products.service';

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
export class BranchProductsComponent implements OnInit {
  branchId: number | null = null;
  branchName: string = '';
  products: Product[] = [];
  searchTerm: string = '';

  filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(
      p =>
        p.name.toLowerCase().includes(term)
    );
  }

  constructor(
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
    private router: Router,
    private toastCtrl: ToastController,
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

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.branchId = params['branchId'] ? parseInt(params['branchId'], 10) : null;
      this.branchName = params['branchName'] || '';
      if (this.branchId) {
        this.loadProducts();
      }
    });
  }

  loadProducts() {
    if (!this.branchId) return;
    this.branchProductsService.getProductsByBranch(this.branchId).subscribe({
      next: (data: BranchProduct[]) => {
        // Map backend BranchProduct to frontend Product (only backend fields)
        this.products = data.map(bp => ({
          id: bp.product_id,
          name: bp.product_name,
          price: bp.price_per_unit,
          stock: bp.current_stock,
          image_path: bp.image_path || '',
          unit_name: bp.unit_name || ''
        }));
      },
      error: async (err) => {
        console.error('Error loading products:', err);
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('PRODUCTS_IN_BRANCH.LOAD_ERROR'),
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  async removeProduct(index: number) {
    const product = this.filteredProducts()[index];
    if (!this.branchId || !product) return;

    this.branchProductsService.deleteProductFromBranch(this.branchId, product.id).subscribe({
      next: async () => {
        // Refresh the list after deletion
        this.loadProducts();
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('PRODUCTS_IN_BRANCH.PRODUCT_REMOVED'),
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      },
      error: async (err) => {
        console.error('Error removing product:', err);
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('PRODUCTS_IN_BRANCH.REMOVE_ERROR'),
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  async addProduct() {
    if (!this.branchId) {
      console.error('Branch ID is missing');
      return;
    }
    const modal = await this.modalCtrl.create({
      component: AddProductModalComponent,
      componentProps: {
        bid: this.branchId  // Pass the branch ID
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === 'success') {
      this.loadProducts();  // Refresh after successful add
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/business-locations']);
  }
}