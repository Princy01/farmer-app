import { Component } from '@angular/core';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-receiving-inspection',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './receiving-inspection.component.html',
  styleUrls: ['./receiving-inspection.component.scss']
})
export class ReceivingInspectionComponent {
  form: FormGroup;
  itemSuggestions: string[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {
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
      name: ['', Validators.required],
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

  fetchItemSuggestions(event: any) {
    const query = event.target.value;
    if (query && query.length > 2) { // Fetch suggestions only if query length > 2
      this.http
        .get<string[]>(`https://api.example.com/items?search=${query}`) // Replace with API endpoint
        .subscribe((data) => {
          this.itemSuggestions = data;
        });
    } else {
      this.itemSuggestions = [];
    }
  }

  selectItemName(name: string) {
    const currentItem = this.items.at(this.items.length - 1); // Get the last item in the array
    currentItem.get('name')?.setValue(name); // Set the selected name
    this.itemSuggestions = []; // Clear suggestions
  }

  submit() {
    console.log('Form Data:', this.form.value);
    alert('Recorded in WMS (dummy action)');
    this.form.reset();
  }
}