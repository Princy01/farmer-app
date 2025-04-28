import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../services/inventory.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-inventory',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.scss']
})
export class AddInventoryComponent {
  batch = {
    name: '',
    grade: '',
    quantity: 0,
    arrivalDate: '',
    expiryDate: ''
  };

  constructor(private inventoryService: InventoryService, private router: Router) {}

  addBatch() {
    this.inventoryService.addInventory(this.batch);
    this.router.navigate(['/inventory-list']);
  }
}