import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService, BusinessBranchWithNames, AddStockPayload } from 'src/app/Wholesaler/services/stock.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
    quality: 0,
    wastage: 0,
    stockReceived: 0,
    stockCarriedForward: 0,
    pricePerUnit: 0,
    branchId: null,
    dateOfEntry: new Date().toISOString().split('T')[0]
  };

  branches: BusinessBranchWithNames[] = [];
  products = [
    { id: 1, name: 'Tomato' },
    { id: 2, name: 'Potato' }
  ];

  qualities = [1.0, 2.0, 3.0];

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
    this.loadBranches();
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

  async loadBranches() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.stockService.getBranchesByUser(userId).subscribe(branches => {
        this.branches = branches || [];
        this.cdr.detectChanges();
      });
    }
  }

  addStock() {
    // Use snake_case keys for payload
    const payload: AddStockPayload = {
      product_id: this.stockData.productId,
      quality: this.stockData.quality,
      wastage: this.stockData.wastage,
      stock_received: this.stockData.stockReceived,
      stock_carried_forward: this.stockData.stockCarriedForward,
      price_per_unit: this.stockData.pricePerUnit,
      b_b_id: this.stockData.branchId,
      date_of_entry: this.stockData.dateOfEntry
    };

    this.stockService.addStock(payload).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Stock added successfully',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.modalCtrl.dismiss();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to add stock',
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