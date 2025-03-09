import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
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
export class StateComponent {
  state: FormGroup;

  constructor(private fb: FormBuilder, private el: ElementRef, private masterStateService: StateService, private navCtrl: NavController) {
    this.state = this.fb.group({
      state: ['', [Validators.maxLength(50)]],
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.state.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.state.valid) {
      console.log('Form Submitted:', this.state.value);
      this.masterStateService.createState(this.state.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.state.reset();
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