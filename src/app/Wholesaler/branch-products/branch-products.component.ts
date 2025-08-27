import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { AddProductModalComponent } from '../add-product-modal/add-product-modal.component';
import { addIcons } from 'ionicons';
import { add, trash, remove, arrowBack } from 'ionicons/icons'
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-branch-products',
  templateUrl: './branch-products.component.html',
  styleUrls: ['./branch-products.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class BranchProductsComponent implements OnInit {
  branchId: number | null = null;
  branchName: string = '';
  products: Product[] = [];
  searchTerm: string = '';

  filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }

  constructor(private route: ActivatedRoute, private modalCtrl: ModalController, private router: Router) {
    addIcons({ add, trash, remove, arrowBack });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.branchId = params['branchId'] || null;
      this.branchName = params['branchName'] || '';
      this.loadDummyProducts();
    });
  }

  loadDummyProducts() {
    // Dummy data
    this.products = [
      { id: 1, name: 'Wheat', category: 'Grains', price: 1200, stock: 50 },
      { id: 2, name: 'Rice', category: 'Grains', price: 1500, stock: 30 },
      { id: 3, name: 'Potato', category: 'Vegetables', price: 25, stock: 200 },
      { id: 4, name: 'Tomato', category: 'Vegetables', price: 40, stock: 100 }
    ];
  }

  removeProduct(index: number) {
    this.products.splice(index, 1);
  }

  async addProduct() {
    const modal = await this.modalCtrl.create({
      component: AddProductModalComponent,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.name) {
      // Add the new product to the list (dummy logic)
      this.products.push({
        id: this.products.length + 1,
        name: data.name,
        category: '',
        price: 0,
        stock: 0
      });
    }
  }

  goBack() {
    this.router.navigate(['/wholesaler/business-locations']);
  }
}