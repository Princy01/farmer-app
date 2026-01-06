import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cubeOutline, closeCircleOutline, bulbOutline, addCircleOutline, listOutline, checkmarkCircleOutline } from 'ionicons/icons';
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

  products: (ProductAll & { selected?: boolean; stock?: number; price?: number; unitId?: number })[] = [];
  categories: string[] = [];
  newProduct = { name: '', category: '', price: 0 };

  constructor(
    private modalCtrl: ModalController,
    private addProductService: AddProductService,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
     addIcons({
    cubeOutline,
    closeCircleOutline,
    bulbOutline,
    addCircleOutline,
    listOutline,
    checkmarkCircleOutline
  });
  }

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

    get selectedProducts() {
    return this.products.filter(p => p.selected);
  }

  hasSelectedProducts(): boolean {
    return this.selectedProducts.length > 0;
  }

  getSelectedCount(): number {
    return this.products.filter(p => p.selected).length;
  }

  async addSelected() {
    const selected = this.products.filter(p => p.selected);
    if (selected.length > 0) {
      // Validate inputs
      for (const prod of selected) {
        if (prod.stock === undefined || prod.price === undefined || prod.unitId === undefined) {
          await this.showToast('Please fill all fields for selected products', 'warning');
          return;
        }
      }
      this.modalCtrl.dismiss(selected);
    } else {
      await this.showToast(this.translate.instant('ADD_PRODUCT.NO_SELECTION'), 'warning');
    }
  }

  // Disable addNew for now (not integrated)
  async addNew() {
    await this.showToast('Add new product not yet integrated', 'warning');
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