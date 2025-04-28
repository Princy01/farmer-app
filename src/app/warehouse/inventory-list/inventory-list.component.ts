import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InventoryService, InventoryBatch } from '../services/inventory.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { addCircleOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  inventory: InventoryBatch[] = [];

  constructor(
    private inventoryService: InventoryService,
    private router: Router
  ) {
    addIcons({ addCircleOutline, createOutline });
  }

  ngOnInit() {
    // Fetch the mock data from your service
    this.inventory = this.inventoryService.getInventory();
  }

  goToDetail(batch: InventoryBatch) {
    this.router.navigate(['/warehouse/inventory-detail', batch.batchNo]);
  }

  goToAddInventory() {
    this.router.navigate(['/warehouse/add-inventory']);
  }

  // Prevent event propagation when clicking on the edit button
  goToEditInventory(batch: InventoryBatch, event: Event) {
    event.stopPropagation();  // Prevents the click event from propagating to the parent item
    this.router.navigate(['/warehouse/edit-inventory', batch.batchNo]);
  }
}
