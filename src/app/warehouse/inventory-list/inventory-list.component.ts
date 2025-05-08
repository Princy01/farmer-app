import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InventoryService, InventoryBatch } from '../services/inventory.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircleOutline, createOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  inventory: InventoryBatch[] = [];
  warehouseId: string = '';

  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private route: ActivatedRoute

  ) {
    addIcons({ addCircleOutline, createOutline });
  }

  ngOnInit() {
    // Get the warehouseId from the route parameters
    this.warehouseId = this.route.snapshot.paramMap.get('warehouseId') || '';

    // Fetch inventory for the selected warehouse
    this.inventory = this.inventoryService.getInventoryByWarehouse(this.warehouseId);
  }

  goToDetail(batch: InventoryBatch) {
    this.router.navigate(['/warehouse/inventory-detail', batch.batchNo]);
  }

  goToAddInventory() {
    this.router.navigate([`warehouse/warehouse-list/${this.warehouseId}/inventory/add`]);
  }

  // Prevent event propagation when clicking on the edit button
  goToEditInventory(batch: InventoryBatch, event: Event) {
    event.stopPropagation();  // Prevents the click event from propagating to the parent item
    this.router.navigate(['/warehouse/edit-inventory', batch.batchNo]);
  }
}
