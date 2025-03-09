import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent {
  location: FormGroup;

  constructor(private fb: FormBuilder, private el: ElementRef, private locationService: LocationService, private navCtrl: NavController) {
    this.location = this.fb.group({
      location: ['', [Validators.maxLength(50)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.location.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.location.valid) {
      console.log('Form Submitted:', this.location.value);
      this.locationService.createLocation(this.location.value).subscribe(
        {
          next: data => {
            console.log('Data:', data);
            this.location.reset();
          },
          error: error => {
            console.error('Error:', error);
          }
        }
      );
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
