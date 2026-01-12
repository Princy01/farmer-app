import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService, BusinessBranchWithNames, AddStockPayload } from 'src/app/Wholesaler/services/stock.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  closeCircleOutline,
  businessOutline,
  storefrontOutline,
  starOutline,
  analyticsOutline,
  trashOutline,
  removeCircle,
  addCircle,
  flashOutline,
  arrowDownCircleOutline,
  syncOutline,
  cashOutline,
  pricetagOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-add-stock',
  templateUrl: './add-stock.component.html',
  styleUrls: ['./add-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class AddStockComponent {
  stockData: any = {
    productId: null,
    qualityId: null,
    wastageMeasureId: null,
    stockReceived: 0,
    stockCarriedForward: 0,
    pricePerUnit: 0,
    branchId: null,
    dateOfEntry: new Date().toISOString().split('T')[0],
    unitId: null
  };

  branches: BusinessBranchWithNames[] = [];
  products: any[] = [];
  qualities: any[] = [];
  wastageMeasures: any[] = [];
  units: any[] = [];

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {
    addIcons({
      cubeOutline,
      closeCircleOutline,
      businessOutline,
      storefrontOutline,
      starOutline,
      analyticsOutline,
      trashOutline,
      removeCircle,
      addCircle,
      flashOutline,
      arrowDownCircleOutline,
      syncOutline,
      cashOutline,
      pricetagOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.loadBranches();
    this.loadProducts();
    this.loadQualities();
    this.loadWastageMeasures();
    this.loadUnits();
  }

  loadProducts() {
    this.stockService.getProducts().subscribe(products => {
      this.products = products || [];
      this.cdr.detectChanges();
    });
  }

  loadQualities() {
    this.stockService.getQualities().subscribe(qualities => {
      this.qualities = qualities || [];
      this.cdr.detectChanges();
    });
  }

  loadWastageMeasures() {
    this.stockService.getWastageMeasures().subscribe(wastages => {
      this.wastageMeasures = wastages || [];
      this.cdr.detectChanges();
    });
  }

  loadUnits() {
    this.stockService.getUnits().subscribe(units => {
      this.units = units || [];
      this.cdr.detectChanges();
    });
  }

  increment(field: string) {
    this.stockData[field] = (this.stockData[field] || 0) + 1;
    this.cdr.detectChanges();
  }

  decrement(field: string) {
    if ((this.stockData[field] || 0) > 0) {
      this.stockData[field]--;
      this.cdr.detectChanges();
    }
  }

  addFifty(field: string) {
    this.stockData[field] = (this.stockData[field] || 0) + 50;
    this.cdr.detectChanges();
  }

  subtractFifty(field: string) {
    this.stockData[field] = Math.max(0, (this.stockData[field] || 0) - 50);
    this.cdr.detectChanges();
  }
  
  async loadBranches() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.stockService.getBranchesByUser(userId).subscribe(branches => {
        this.branches = branches || [];
        this.cdr.detectChanges();
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.stockData.branchId &&
      this.stockData.productId &&
      this.stockData.qualityId &&
      this.stockData.wastageMeasureId &&
      this.stockData.unitId &&
      this.stockData.pricePerUnit > 0
    );
  }

  addStock() {
    const payload: AddStockPayload = {
      product_id: this.stockData.productId,
      quality_id: this.stockData.qualityId,  // Changed
      wastage_measure_id: this.stockData.wastageMeasureId,  // Changed
      stock_received: this.stockData.stockReceived,
      stock_carried_forward: this.stockData.stockCarriedForward,
      price_per_unit: this.stockData.pricePerUnit,
      b_b_id: this.stockData.branchId,
      date_of_entry: this.stockData.dateOfEntry,
      unit_id: this.stockData.unitId
    };

    this.stockService.addStock(payload).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('ADD_STOCK.SUCCESS_MESSAGE'),
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.modalCtrl.dismiss();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('ADD_STOCK.ERROR_MESSAGE'),
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}