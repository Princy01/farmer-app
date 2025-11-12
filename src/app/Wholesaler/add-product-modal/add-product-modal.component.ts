import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AddProductService, ProductAll } from './add-product.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe]
})
export class AddProductModalComponent {
  searchTerm: string = '';
  showAddNew: boolean = false;

  products: (ProductAll & { selected?: boolean })[] = [];
  categories: string[] = [];

  newProduct = { name: '', category: '', price: 0 };

  constructor(
    private modalCtrl: ModalController,
    private addProductService: AddProductService,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.addProductService.getAllProductsForAdmin().subscribe((data) => {
      // Add 'selected' property for checkbox tracking
      this.products = data.map(p => ({ ...p, selected: false }));
      this.categories = Array.from(new Set(data.map(p => p.cat_name)));
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  filteredProducts(): (ProductAll & { selected?: boolean })[] {
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(
      p => p.product_name.toLowerCase().includes(term) || p.cat_name.toLowerCase().includes(term)
    );
  }

  hasSelectedProducts(): boolean {
    return this.products.some(p => p.selected);
  }

  getSelectedCount(): number {
    return this.products.filter(p => p.selected).length;
  }

  async addSelected() {
    const selectedProducts = this.products.filter(p => p.selected);
    if (selectedProducts.length > 0) {
      this.modalCtrl.dismiss(selectedProducts);
    } else {
      await this.showToast(this.translate.instant('ADD_PRODUCT.NO_SELECTION'), 'warning');
    }
  }

  async addNew() {
    if (!this.newProduct.name.trim()) {
      await this.showToast(this.translate.instant('ADD_PRODUCT.NAME_REQUIRED'), 'warning');
      return;
    }
    if (!this.newProduct.category.trim()) {
      await this.showToast(this.translate.instant('ADD_PRODUCT.CATEGORY_REQUIRED'), 'warning');
      return;
    }
    if (this.newProduct.price <= 0) {
      await this.showToast(this.translate.instant('ADD_PRODUCT.PRICE_REQUIRED'), 'warning');
      return;
    }

    const prod = {
      product_id: Date.now(),
      product_name: this.newProduct.name,
      cat_id: 0,
      cat_name: this.newProduct.category,
      image_path: null,
      active_status: 1,
      nutrition_factor: '',
      price: this.newProduct.price
    };
    this.modalCtrl.dismiss([prod]);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}