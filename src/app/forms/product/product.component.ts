import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { listOutline } from 'ionicons/icons';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent {
  product: FormGroup;

  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private productService: ProductService,
    private navCtrl: NavController,
    private route: ActivatedRoute
  ) {
    addIcons({ listOutline });

    this.product = this.fb.group({
      category_id: ['',Validators.required], // Nullable, so no required validator
      product_name: ['', [Validators.maxLength(100)]], // Not required
      status: [0] // Defaults to 0
    });

    // Retrieve category_id if returning from Category Form
    this.route.queryParams.subscribe(params => {
      if (params['category_id']) {
        this.product.patchValue({ category_id: params['category_id'] });
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.product.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.product.valid) {
      console.log('Form Submitted:', this.product.value);
      this.productService.createProduct(this.product.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.product.reset();
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
