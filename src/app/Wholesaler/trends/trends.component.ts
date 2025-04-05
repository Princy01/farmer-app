import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { barChartOutline, analyticsOutline, cubeOutline, podiumOutline } from 'ionicons/icons';

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss'],
})
export class TrendsComponent{
  constructor(private router: Router) {
    addIcons({ barChartOutline, analyticsOutline, cubeOutline, podiumOutline });
  }

  navigateTo(route: string) {
    this.router.navigate([`/wholesaler/${route}`]);
  }
}
