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
  userForm: FormGroup;
  locations: any[] = [];
  states: any[] = [];
  roles: any[] = [];
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private userService: UserService,
    private navCtrl: NavController
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      mobile_num: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10,15}$'), Validators.maxLength(15)] // Numeric, 10-15 digits
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      address: [''],
      pincode: ['', [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]{5,10}$')]], // Numeric, 5-10 digits
      location: [null],
      state: [null],
      role_id: [5, Validators.required], // Default role
      active_status: [1, Validators.required] //Default active
    });

    this.loadDropdownData();
    this.loadUsers();
  }

  // Load dropdown data (locations, states, roles)
  loadDropdownData() {
    this.userService.getLocations().subscribe((data) => (this.locations = data));
    this.userService.getStates().subscribe((data) => (this.states = data));
    this.userService.getUserTypes().subscribe((data) => (this.roles = data)); // Fixed role fetching
  }

  // Fetch all users from the backend
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => console.error('Error fetching users:', err)
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe({
        next: (response) => {
          console.log('User added:', response);
          this.userForm.reset();
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
    if (!user.user_id) {
      console.error('User ID is missing for update');
      return;
    }
    this.userService.updateUserById(user).subscribe({
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
