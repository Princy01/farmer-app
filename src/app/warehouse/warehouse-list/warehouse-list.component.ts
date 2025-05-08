import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { WarehouseService, Warehouse } from '../services/warehouse.service';
import { addIcons } from 'ionicons';
import { businessOutline } from 'ionicons/icons';
@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent implements OnInit {
  warehouses: Warehouse[] = [];

  constructor(
    private warehouseService: WarehouseService,
    private router: Router
  ) {
    addIcons({ businessOutline });
  }

  ngOnInit() {
    // Fetch the list of warehouses from the service
    this.warehouses = this.warehouseService.getWarehouses();
  }

  goToInventory(warehouseId: string) {
    this.router.navigate(['/warehouse/warehouse-list', warehouseId, 'inventory']);
  }
}