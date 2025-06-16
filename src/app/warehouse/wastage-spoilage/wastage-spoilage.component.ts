import { Component } from '@angular/core';
import { IonicModule } from "@ionic/angular";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SpoilageRecord {
  date: string;
  quantity: number;
  reason: string;
  inspector: string;
}

@Component({
  selector: 'app-wastage-spoilage',
  templateUrl: './wastage-spoilage.component.html',
  styleUrls: ['./wastage-spoilage.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class WastageSpoilageComponent {
  newSpoilage: SpoilageRecord = { date: '', quantity: 0, reason: '', inspector: '' };
  spoilageRecords: SpoilageRecord[] = [];

  addSpoilage() {
    if (this.newSpoilage.date && this.newSpoilage.quantity > 0 && this.newSpoilage.reason && this.newSpoilage.inspector) {
      this.spoilageRecords.push({ ...this.newSpoilage });
      this.newSpoilage = { date: '', quantity: 0, reason: '', inspector: '' };
    }
  }

  generateReport() {
    // Logic to generate reports can be implemented here
    console.log('Generating report for:', this.spoilageRecords);
  }
}