import { Component, DestroyRef, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent {
  category: FormGroup;
  superCategories: any[] = [];
  expandedCategories: { [key: string]: boolean } = {};

  availableItems: { [key: string]: string[] } = {
    Vegetables: ['Potato', 'Spinach', 'Carrot', 'Cabbage'],
    Fruits: ['Banana', 'Apple', 'Mango', 'Orange'],
    'Grains & Pulses': ['Rice', 'Wheat', 'Lentils', 'Chickpeas'],
  };

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private categoryService: CategoryService,
    private navCtrl: NavController,
    private destroyRef: DestroyRef
  ) {
    this.category = this.fb.group({
      category_name: ['', [Validators.required, Validators.maxLength(255)]],
      super_cat_id: ['-1', [Validators.required]],
      remarks: ['']
    });

    // Initialize categories as collapsed
    this.objectKeys(this.availableItems).forEach((key) => {
      this.expandedCategories[key] = false;
    });
  }

  ngOnInit() {
    const sub = this.categoryService.getSuperCategories().subscribe({
      next: (data) => {
        console.log('Data:', data);
        this.superCategories = data;
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  isFieldInvalid(field: string): boolean {
    const control = this.category.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  toggleCategory(category: string) {
    this.expandedCategories[category] = !this.expandedCategories[category];
  }

  submitForm() {
    if (this.category.valid) {
      console.log('Form Submitted:', this.category.value);
      this.categoryService.createCategory(this.category.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.navCtrl.navigateBack('/admin/product', {
            queryParams: { category_id: data.category_id }
          });
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
