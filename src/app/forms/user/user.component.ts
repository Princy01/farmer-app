import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {
  user: FormGroup;
  locations: any[] = [];
  states: any[] = [];
  userTypes: any[] = [];
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private userService: UserService,
    private navCtrl: NavController
  ) {
    this.user = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      mobile_num: ['', [Validators.required, Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      address: [''],
      pincode: ['', [Validators.maxLength(10)]],
      location: [''],
      state: [''],
      user_type_id: [''],
      status: [1]
    });

    this.loadDropdownData();
    this.loadUsers();
  }

  loadDropdownData() {
    this.userService.getLocations().subscribe((data) => (this.locations = data));
    this.userService.getStates().subscribe((data) => (this.states = data));
    this.userService.getUserTypes().subscribe((data) => (this.userTypes = data));
  }
  
   // Fetch all users from the backend
   loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => console.error('Error fetching users:', err)
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.user.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.user.valid) {
      this.userService.insertUser(this.user.value).subscribe({
        next: (response) => {
          console.log('User added:', response);
          this.user.reset();
          this.loadUsers(); // Refresh user list after adding
        },
        error: (error) => {
          console.error('Error adding user:', error);
        }
      });
    } else {
      // Scroll to first invalid field
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }

  updateUser(user: any) {
    this.userService.updateUser(user).subscribe({
      next: (response) => {
        console.log('User updated:', response);
        this.loadUsers(); // Refresh user list after updating
      },
      error: (error) => {
        console.error('Error updating user:', error);
      }
    });
  }

  deleteUser(userId: number) {
    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        console.log('User deleted:', response);
        this.loadUsers(); // Refresh user list after deleting
      },
      error: (error) => {
        console.error('Error deleting user:', error);
      }
    });
  }
}