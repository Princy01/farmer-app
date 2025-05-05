import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp, trashOutline, locationOutline } from 'ionicons/icons';
import { Mandi, MandiService } from '../../services/mandi.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mandi',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './mandi.component.html',
  styleUrls: ['./mandi.component.scss']
})
export class MandiComponent implements OnInit {
  mandi: FormGroup;
  mandis: Mandi[] = [];
  isMandiListExpanded = false;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private mandiService: MandiService,
    private navCtrl: NavController,
    private route: ActivatedRoute
  ) {
    addIcons({ chevronDown, chevronUp, trashOutline, locationOutline });

    this.mandi = this.fb.group({
      mandi_location: ['', [Validators.required, Validators.maxLength(255)]],
      mandi_number: ['', [Validators.required, Validators.maxLength(50)]],
      mandi_incharge: ['', [Validators.required, Validators.maxLength(255)]],
      mandi_incharge_num: ['', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.maxLength(15)]],
      mandi_pincode: ['', [Validators.required, Validators.pattern("^[0-9]{6}$")]],
      mandi_address: [''], // Nullable field
      mandi_city: [null], // Foreign Key (nullable)
      mandi_state: [null], // Foreign Key (nullable)
      remarks: [''], // Nullable field
    });

    this.route.queryParams.subscribe(params => {
      if (params['mandi_city']) {
        this.mandi.patchValue({ mandi_city: params['mandi_city'] });
      }
    });
  }
  ngOnInit() {
    this.fetchMandis();
  }

  fetchMandis() {
    this.mandiService.getAllMandis().subscribe({
      next: (data) => {
        this.mandis = data;
      },
      error: (error) => {
        console.error('Error fetching mandis:', error);
      }
    });
  }

  toggleMandiList() {
    this.isMandiListExpanded = !this.isMandiListExpanded;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.mandi.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.mandi.valid) {
      this.mandiService.createMandi(this.mandi.value).subscribe({
        next: () => {
          this.fetchMandis(); // Refresh list after creating
          this.mandi.reset();
        },
        error: (error:any) => {
          console.error('Error:', error);
        }
      });
    }
  }
}
