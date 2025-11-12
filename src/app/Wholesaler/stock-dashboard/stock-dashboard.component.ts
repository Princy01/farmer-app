import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StockService, ProductPriceData, BusinessBranchWithNames } from 'src/app/Wholesaler/services/stock.service';
import { AddStockComponent } from '../add-stock/add-stock.component';
import { UpdateStockComponent } from '../update-stock/update-stock.component';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe],
})
export class StockDashboardAddStockComponent implements OnInit {
  todayStock: ProductPriceData[] = [];
  branches: BusinessBranchWithNames[] = [];
  selectedBranchId: number | null = null;
  userId: number | null = null;

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private translate: TranslateService
  ) {
    addIcons({ add });
  }

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.fetchBranches();
  }

  fetchBranches() {
    if (this.userId === null) return;
    this.stockService.getBranchesByUser(this.userId).subscribe(data => {
      this.branches = data;
      if (this.branches.length > 0) {
        this.selectedBranchId = this.branches[0].branch_id;
        console.log('Selected branch:', this.selectedBranchId);
        this.loadTodayStock();
      }
    });
  }

  loadTodayStock() {
    const today = new Date().toISOString().split('T')[0];
    if (!this.selectedBranchId) {
      console.log('No branch selected');
      return;
    }
    console.log('Loading stock for branch:', this.selectedBranchId, 'date:', today);
    this.stockService.getProductsStockOfBranchForDate(this.selectedBranchId, today).subscribe(data => {
      console.log('API response:', data);
      this.todayStock = data || [];
    });
  }

  async openAddStock() {
    if (!this.selectedBranchId) return;
    const modal = await this.modalCtrl.create({
      component: AddStockComponent,
      componentProps: { branchId: this.selectedBranchId }
    });
    await modal.present();
    await modal.onWillDismiss();
    this.loadTodayStock();
  }

  async openUpdateStock(item: any) {
    if (!this.selectedBranchId) return;
    const modal = await this.modalCtrl.create({
      component: UpdateStockComponent,
      componentProps: { stockItem: item, branchId: this.selectedBranchId },
      breakpoints: [0, 0.4, 0.8],
      initialBreakpoint: 0.4
    });
    await modal.present();
    await modal.onWillDismiss();
    this.loadTodayStock();
  }
}