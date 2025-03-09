import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-buyer',
  templateUrl: './buyer.page.html',
  styleUrls: ['./buyer.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule ]
})
export class BuyerPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
