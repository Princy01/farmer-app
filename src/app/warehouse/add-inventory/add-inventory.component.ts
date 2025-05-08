import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../services/inventory.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-inventory',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.scss']
})
export class AddInventoryComponent implements OnInit {
  batch = {
    name: '',
    grade: '',
    quantity: 0,
    arrivalDate: '',
    expiryDate: '',
    warehouseId: ''
  };
  warehouseId: string = '';
inventoryLink: string = '/warehouse/warehouse-list';

  constructor(private inventoryService: InventoryService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // Get the warehouseId from the route parameters
    this.warehouseId = this.route.snapshot.paramMap.get('warehouseId') || '';
    this.inventoryLink = '/warehouse/warehouse-list/' + this.warehouseId + '/inventory'; // Update the inventory link with the warehouseId
    this.batch.warehouseId = this.warehouseId; // Assign warehouseId to the batch
  }

  addBatch() {
    this.inventoryService.addInventory(this.batch);
    this.router.navigate([this.inventoryLink]);
  }
}