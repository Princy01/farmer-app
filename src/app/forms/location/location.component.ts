import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LocationService, Location } from '../../services/location.service';
import { addIcons } from 'ionicons';
import { trashOutline, chevronDown, chevronUp, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit {
  location: FormGroup;
  locations: Location[] = [];
  isLocationListExpanded = false;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private locationService: LocationService,
    private navCtrl: NavController
  ) {
    addIcons({ trashOutline, chevronDown, chevronUp, locationOutline });
    this.location = this.fb.group({
      location: ['', [Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    this.fetchLocations();
  }

  fetchLocations() {
    this.locationService.getLocations().subscribe({
      next: (data) => {
        this.locations = data;
      },
      error: (error) => {
        console.error('Error fetching locations:', error);
      }
    });
  }

  toggleLocationList() {
    this.isLocationListExpanded = !this.isLocationListExpanded;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.location.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.location.valid) {
      this.locationService.createLocation(this.location.value).subscribe({
        next: () => {
          this.fetchLocations(); // Refresh list after creating
          this.location.reset();
        },
        error: error => {
          console.error('Error:', error);
        }
      });
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }

  deleteLocation(id: number) {
    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.fetchLocations();
      },
      error: error => {
        console.error('Error deleting location:', error);
      }
    });
  }
}
