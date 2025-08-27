import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AddProductService, ProductAll } from './add-product.service';

@Component({
  selector: 'app-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AddProductModalComponent {
  searchTerm: string = '';
  showAddNew: boolean = false;

  products: (ProductAll & { selected?: boolean })[] = [];
  categories: string[] = [];

  newProduct = { name: '', category: '', price: 0 };

  constructor(private modalCtrl: ModalController, private addProductService: AddProductService) {}

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

  addSelected() {
    const selectedProducts = this.products.filter(p => p.selected);
    if (selectedProducts.length > 0) {
      this.modalCtrl.dismiss(selectedProducts);
    }
  }

  addNew() {
    if (
      this.newProduct.name.trim() &&
      this.newProduct.category.trim() &&
      this.newProduct.price > 0
    ) {
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
  }
}