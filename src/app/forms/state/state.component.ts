import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-state',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.scss']
})
export class StateComponent implements OnInit {
  stateForm: FormGroup;
  states: any[] = [];

  constructor(private fb: FormBuilder, private stateService: StateService) {
    this.stateForm = this.fb.group({
      state: ['', [Validators.required, Validators.maxLength(50)]],
      stateShortNames: ['', [Validators.required, Validators.maxLength(10)]],
    });
  }

  ngOnInit() {
    this.fetchStates();
  }

  fetchStates() {
    this.stateService.getAllStates().subscribe({
      next: (data) => {
        this.states = data;
      },
      error: (err) => console.error('Error fetching states:', err),
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.stateForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.stateForm.valid) {
      this.stateService.createState(this.stateForm.value).subscribe({
        next: () => {
          this.fetchStates();
          this.stateForm.reset();
        },
        error: (err) => console.error('Error inserting state:', err),
      });
    }
  }
  // a DeleteState function in Go is needed
  deleteState(id: number) {
    this.stateService.deleteState(id).subscribe({
      next: () => this.fetchStates(),
      error: (err) => console.error('Error deleting state:', err),
    });
  }
}
