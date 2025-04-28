import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { InventoryService } from '../services/inventory.service';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.scss']
})
export class InventoryDetailComponent {
  batch: any;

  constructor(private route: ActivatedRoute, private inventoryService: InventoryService) {
    const batchNo = this.route.snapshot.paramMap.get('batchNo');
    this.batch = this.inventoryService.getInventoryByBatch(batchNo!);
  }
}