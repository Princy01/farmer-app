import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { StockMovementsComponent } from './stock-movements/stock-movements.component';
import { StockAuditsComponent } from './stock-audits/stock-audits.component';

@Component({
  selector: 'app-stock-movement-audit',
  templateUrl: './stock-movement-audit.component.html',
  styleUrls: ['./stock-movement-audit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    StockMovementsComponent,
    StockAuditsComponent
  ]
})
export class StockMovementAuditComponent {
  segmentValue: 'movements' | 'audits' = 'movements';
}
