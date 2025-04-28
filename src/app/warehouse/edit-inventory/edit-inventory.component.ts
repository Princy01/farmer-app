import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../services/inventory.service';

@Component({
  selector: 'app-edit-inventory',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './edit-inventory.component.html',
  styleUrls: ['./edit-inventory.component.scss']
})
export class EditInventoryComponent {
  batch: any;

  constructor(private route: ActivatedRoute, private inventoryService: InventoryService, private router: Router) {
    const batchNo = this.route.snapshot.paramMap.get('batchNo');
    this.batch = { ...this.inventoryService.getInventoryByBatch(batchNo!) };
  }

  updateBatch() {
    this.inventoryService.updateInventory(this.batch);
    this.router.navigate(['/inventory-list']);
  }
}