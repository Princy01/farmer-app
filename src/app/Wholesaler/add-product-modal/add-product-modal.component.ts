import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { cubeOutline, closeCircleOutline, bulbOutline, addCircleOutline, listOutline, checkmarkCircleOutline, chevronForward, arrowBack } from 'ionicons/icons';
import { AddProductService, ProductAll, Unit, Quality, WastageMeasure } from './add-product.service';

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
  showDetails: boolean = false;
  selectedProductForDetails: (ProductAll & { stock?: number; price?: number; unitId?: number; qualityId?: number; wastageMeasureId?: number }) | null = null;
  @Input() bid!: number;
  units: Unit[] = [];
  qualities: Quality[] = [];
  wastageMeasures: WastageMeasure[] = [];
   products: (ProductAll & { selected?: boolean; stock?: number; price?: number; unitId?: number; qualityId?: number; wastageMeasureId?: number })[] = [];
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
      checkmarkCircleOutline,
      chevronForward,
      arrowBack
    });
  }

  ngOnInit() {
    this.addProductService.getAllProductsForAdmin().subscribe((data) => {
      this.products = data.map(p => ({ ...p, selected: false, qualityId: undefined, wastageMeasureId: undefined }));
      this.categories = Array.from(new Set(data.map(p => p.cat_name)));
    });
    this.addProductService.getAllUnits().subscribe((data) => {
      this.units = data;
    });
    this.addProductService.getAllQualities().subscribe((data) => {
      this.qualities = data;
    });
    this.addProductService.getAllWastageMeasures().subscribe((data) => {
      this.wastageMeasures = data;
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  filteredProducts(): ProductAll[] {
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(
      p => p.product_name.toLowerCase().includes(term) || p.cat_name.toLowerCase().includes(term)
    );
  }

  selectProduct(product: ProductAll) {
    this.selectedProductForDetails = { ...product, stock: undefined, price: undefined, unitId: undefined, qualityId: undefined, wastageMeasureId: undefined };
    this.showDetails = true;
  }

  addProduct() {
    if (this.selectedProductForDetails) {
      const prod = this.selectedProductForDetails;
      if (prod.stock === undefined || prod.price === undefined || prod.unitId === undefined || prod.qualityId === undefined || prod.wastageMeasureId === undefined) {
        this.showToast(this.translate.instant('ADD_PRODUCT.FILL_ALL_FIELDS'), 'warning');
        return;
      }
      this.addProductService.addProductToBranch(
        this.bid,
        prod.product_id,
        prod.qualityId!,
        prod.wastageMeasureId!,
        prod.stock!,
        prod.price!,
        prod.unitId!
      ).subscribe({
        next: () => {
          this.showToast(this.translate.instant('ADD_PRODUCT.PRODUCT_ADDED_SUCCESS'), 'success');
          this.modalCtrl.dismiss('success');  // Dismiss with success indicator
        },
        error: (err) => {
          this.showToast(this.translate.instant('ADD_PRODUCT.ERROR_ADDING_PRODUCT', { error: err.message }), 'danger');
        }
      });
    }
  }

  backToList() {
    this.showDetails = false;
    this.selectedProductForDetails = null;
  }

  async addNew() {
    await this.showToast(this.translate.instant('ADD_PRODUCT.ADD_NEW_NOT_INTEGRATED'), 'warning');
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