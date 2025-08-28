import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService } from 'src/app/Wholesaler/services/stock.service';

@Component({
  selector: 'app-add-stock',
  templateUrl: './add-stock.component.html',
  styleUrls: ['./add-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class AddStockComponent {
  stockData: any = {
    productID: null,
    quality: null,
    wastage: 0,
    stockReceived: 0,
    stockCarriedForward: 0,
    pricePerUint: 0,
    businessBranchId: 1,
    dateOfEntry: new Date().toISOString().split('T')[0]
  };

  // Dummy data for select options; replace with backend integration later
  products = [
    { id: 1, name: 'Tomato' },
    { id: 2, name: 'Potato' }
  ];
  qualities = ['A', 'B', 'C'];

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  increment(field: string) {
    this.stockData[field] = (this.stockData[field] || 0) + 1;
  }

  decrement(field: string) {
    if ((this.stockData[field] || 0) > 0) {
      this.stockData[field]--;
    }
  }

  addFifty(field: string) {
    this.stockData[field] = (this.stockData[field] || 0) + 50;
  }

  addStock() {
    this.stockService.addStock(this.stockData).subscribe({
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