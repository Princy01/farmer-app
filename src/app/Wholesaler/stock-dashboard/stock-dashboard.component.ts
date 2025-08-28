import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { StockService } from 'src/app/Wholesaler/services/stock.service';
import { AddStockComponent } from '../add-stock/add-stock.component';
import { UpdateStockComponent } from '../update-stock/update-stock.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class StockDashboardAddStockComponent implements OnInit {
  todayStock: any[] = [];

  constructor(
    private stockService: StockService,
    private modalCtrl: ModalController
  ) {
    addIcons({ add });
  }

  ngOnInit() {
    this.loadTodayStock();
  }

  loadTodayStock() {
    this.stockService.getTodayStock().subscribe(data => {
      this.todayStock = data;
        // this.todayStock = [];

    });
  }

  async openAddStock() {
    const modal = await this.modalCtrl.create({
      component: AddStockComponent
    });
    await modal.present();
    await modal.onWillDismiss();
    this.loadTodayStock();
  }

  async openUpdateStock(item: any) {
    const modal = await this.modalCtrl.create({
      component: UpdateStockComponent,
      componentProps: { stockItem: item }
    });
    await modal.present();
    await modal.onWillDismiss();
    this.loadTodayStock();
  }
}
