import { Component } from '@angular/core';
import {IonicModule} from '@ionic/angular';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class CounterComponent {

  count = 6;

  increment() {
    this.count++;
  }

  decrement(){
    this.count--;
  }

  reset(){
    this.count = 0;
  }
}
