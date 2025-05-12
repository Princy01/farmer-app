import { Component } from '@angular/core';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receiving-inspection',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './receiving-inspection.component.html',
  styleUrls: ['./receiving-inspection.component.scss']

})
export class ReceivingInspectionPage {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      shipmentId: ['', Validators.required],
      supplier: ['', Validators.required],
      arrivalTime: [new Date().toISOString()],
      checks: this.fb.group({
        temperature: ['Cold'],
        spoilage: [false],
        insectDamage: [false],
        cleanliness: ['']
      }),
      items: this.fb.array([
        this.createItem()
      ]),
      storageAssignments: this.fb.array([
        this.createStorageAssignment()
      ])
    });
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  get storageAssignments() {
    return this.form.get('storageAssignments') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      name: ['Tomato', Validators.required],
      quantity: [100, Validators.required],
      weight: [80, Validators.required],
      grade: ['A'],
      damage: [false],
      comments: ['']
    });
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  createStorageAssignment(): FormGroup {
    return this.fb.group({
      grade: ['A'],
      zone: ['Cold Zone A']
    });
  }

  addStorageAssignment() {
    this.storageAssignments.push(this.createStorageAssignment());
  }

  submit() {
    console.log('Form Data:', this.form.value);
    alert('Recorded in WMS (dummy action)');
    this.form.reset();
  }
}
