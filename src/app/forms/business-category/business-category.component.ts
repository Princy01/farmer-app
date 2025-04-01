import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BusinessCategoryService } from 'src/app/services/business-category.service';

@Component({
  selector: 'app-business-category',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './business-category.component.html',
  styleUrls: ['./business-category.component.scss']
})
export class BusinessCategoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private businessCategoryService = inject(BusinessCategoryService);

  businessCategoryForm: FormGroup;
  businessCategories: any[] = [];
  isEditMode = false;
  editCategoryId: number | null = null;

  constructor() {
    this.businessCategoryForm = this.fb.group({
      b_category_name: ['', [Validators.required, Validators.maxLength(25)]]
    });
  }

  ngOnInit() {
    this.loadBusinessCategories();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.businessCategoryForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  loadBusinessCategories() {
    this.businessCategoryService.getBusinessCategories().subscribe({
      next: (data) => this.businessCategories = data,
      error: (error) => console.error('Error fetching business categories:', error)
    });
  }

  submitForm() {
    if (this.businessCategoryForm.invalid) return;

    const categoryData = this.businessCategoryForm.value;

    if (this.isEditMode && this.editCategoryId !== null) {
      this.updateCategory(categoryData);
    } else {
      this.createCategory(categoryData);
    }
  }

  private updateCategory(categoryData: any) {
    const updateData = { b_category_id: this.editCategoryId, ...categoryData };
    this.businessCategoryService.updateBusinessCategory(updateData).subscribe({
      next: () => {
        console.log('Business category updated successfully');
        this.resetForm();
        this.loadBusinessCategories();
      },
      error: (error) => console.error('Error updating business category:', error)
    });
  }

  private createCategory(categoryData: any) {
    this.businessCategoryService.createBusinessCategory(categoryData).subscribe({
      next: (response) => {
        console.log('Business category added successfully', response);
        this.resetForm();
        this.loadBusinessCategories();
      },
      error: (error) => console.error('Error adding business category:', error)
    });
  }

  editCategory(category: any) {
    this.isEditMode = true;
    this.editCategoryId = category.b_category_id;
    this.businessCategoryForm.patchValue({ b_category_name: category.b_category_name });
  }

  resetForm() {
    this.businessCategoryForm.reset();
    this.isEditMode = false;
    this.editCategoryId = null;
  }
}
