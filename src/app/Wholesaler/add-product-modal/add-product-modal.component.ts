import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { cubeOutline, closeCircleOutline, bulbOutline, addCircleOutline, listOutline, checkmarkCircleOutline, chevronForward, arrowBack } from 'ionicons/icons';
import { AddProductService, ProductAll, Unit, Quality, WastageMeasure } from './add-product.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ProductDetails extends ProductAll {
  stock?: number;
  price?: number;
  unitId?: number;
  qualityId?: number;
  wastageMeasureId?: number;
}

@Component({
  selector: 'app-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe]
})
export class AddProductModalComponent implements OnInit, OnDestroy {
  @Input() bid!: number;

  searchTerm: string = '';
  showAddNew: boolean = false;
  showDetails: boolean = false;
  selectedProductForDetails: ProductDetails | null = null;

  units: Unit[] = [];
  qualities: Quality[] = [];
  wastageMeasures: WastageMeasure[] = [];
  products: ProductDetails[] = [];
  categories: string[] = [];

  newProduct = { name: '', category: '', price: 0 };
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private modalCtrl: ModalController,
    private addProductService: AddProductService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
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

  ngOnInit(): void {
    if (!this.bid) {
      this.showToast(this.translate.instant('ADD_PRODUCT.ERROR_NO_BRANCH'), 'danger');
      this.close();
      return;
    }
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadInitialData(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ADD_PRODUCT.LOADING'),
      spinner: 'crescent'
    });
    await loading.present();

    forkJoin({
      products: this.addProductService.getAllProductsForAdmin(),
      units: this.addProductService.getAllUnits(),
      qualities: this.addProductService.getAllQualities(),
      wastageMeasures: this.addProductService.getAllWastageMeasures()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.products = data.products.map(p => ({
          ...p,
          stock: undefined,
          price: undefined,
          unitId: undefined,
          qualityId: undefined,
          wastageMeasureId: undefined
        }));
        this.categories = Array.from(new Set(data.products.map(p => p.cat_name)));
        this.units = data.units;
        this.qualities = data.qualities;
        this.wastageMeasures = data.wastageMeasures;
        loading.dismiss();
      },
      error: (err) => {
        loading.dismiss();
        this.showToast(this.translate.instant(err.message || 'ADD_PRODUCT.ERROR_LOADING_DATA'), 'danger');
      }
    });
  }

  close(): void {
    this.modalCtrl.dismiss();
  }

  filteredProducts(): ProductDetails[] {
    if (!this.searchTerm.trim()) {
      return this.products;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.products.filter(
      p => p.product_name.toLowerCase().includes(term) ||
           p.cat_name.toLowerCase().includes(term)
    );
  }

  selectProduct(product: ProductAll): void {
    this.selectedProductForDetails = {
      ...product,
      stock: undefined,
      price: undefined,
      unitId: undefined,
      qualityId: undefined,
      wastageMeasureId: undefined
    };
    this.showDetails = true;
  }

  async addProduct(): Promise<void> {
    if (!this.selectedProductForDetails) {
      return;
    }

    const prod = this.selectedProductForDetails;

    // Validation
    if (!this.validateProductDetails(prod)) {
      this.showToast(this.translate.instant('ADD_PRODUCT.FILL_ALL_FIELDS'), 'warning');
      return;
    }

    if (prod.stock! <= 0) {
      this.showToast(this.translate.instant('ADD_PRODUCT.ERROR_INVALID_STOCK'), 'warning');
      return;
    }

    if (prod.price! <= 0) {
      this.showToast(this.translate.instant('ADD_PRODUCT.ERROR_INVALID_PRICE'), 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('ADD_PRODUCT.ADDING_PRODUCT'),
      spinner: 'crescent'
    });
    await loading.present();

    this.addProductService.addProductToBranch(
      this.bid,
      prod.product_id,
      prod.qualityId!,
      prod.wastageMeasureId!,
      prod.stock!,
      prod.price!,
      prod.unitId!
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        loading.dismiss();
        this.showToast(this.translate.instant('ADD_PRODUCT.PRODUCT_ADDED_SUCCESS'), 'success');
        this.modalCtrl.dismiss('success');
      },
      error: (err) => {
        loading.dismiss();
        this.showToast(
          this.translate.instant(err.message || 'ADD_PRODUCT.ERROR_ADDING_PRODUCT'),
          'danger'
        );
      }
    });
  }

  private validateProductDetails(prod: ProductDetails): boolean {
    return prod.stock !== undefined &&
           prod.price !== undefined &&
           prod.unitId !== undefined &&
           prod.qualityId !== undefined &&
           prod.wastageMeasureId !== undefined;
  }

  backToList(): void {
    this.showDetails = false;
    this.selectedProductForDetails = null;
  }

  async addNew(): Promise<void> {
    await this.showToast(this.translate.instant('ADD_PRODUCT.ADD_NEW_NOT_INTEGRATED'), 'warning');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}