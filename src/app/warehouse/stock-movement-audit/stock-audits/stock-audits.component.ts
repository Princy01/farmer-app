import { Component } from '@angular/core';
import { IonicModule } from "@ionic/angular";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-stock-audits',
  templateUrl: './stock-audits.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class StockAuditsComponent {
  audits = [
    {
      itemName: 'Tomatoes',
      systemCount: 120,
      physicalCount: 115,
      auditDate: new Date(),
      auditedBy: 'Pooja Rani',
      status: 'Mismatch',
      manualOverride: false
    },
    {
      itemName: 'Onions',
      systemCount: 80,
      physicalCount: 80,
      auditDate: new Date(),
      auditedBy: 'Rahul Yadav',
      status: 'Match',
      manualOverride: false
    },
    {
      itemName: 'Potatoes',
      systemCount: 150,
      physicalCount: 140,
      auditDate: new Date(),
      auditedBy: 'Neha Verma',
      status: 'Mismatch',
      manualOverride: true
    }
  ];
}
