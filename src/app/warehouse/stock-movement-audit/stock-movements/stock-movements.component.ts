import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class StockMovementsComponent {
  movements = [
    {
      itemName: 'Tomatoes',
      fromLocation: 'Receiving Dock',
      toLocation: 'Cold Storage',
      quantity: 120,
      movementType: 'Receiving',
      timestamp: new Date(),
      movedBy: 'Rajeev Singh'
    },
    {
      itemName: 'Onions',
      fromLocation: 'Cold Storage',
      toLocation: 'Dispatch Zone',
      quantity: 80,
      movementType: 'Dispatch',
      timestamp: new Date(),
      movedBy: 'Anjali Mehta'
    },
    {
      itemName: 'Potatoes',
      fromLocation: 'Cold Storage',
      toLocation: 'Dry Storage',
      quantity: 150,
      movementType: 'Internal',
      timestamp: new Date(),
      movedBy: 'Suresh Kumar'
    }
  ];
}
