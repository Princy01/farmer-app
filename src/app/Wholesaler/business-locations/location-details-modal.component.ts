import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { BusinessLocation } from './business-locations.service';

@Component({
  selector: 'app-location-details-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ location?.shop_name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card *ngIf="location">
        <ion-card-content>
          <ion-list lines="none">

            <ion-item>
              <ion-icon name="business" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Shop Name</h3>
                <p>{{ location.shop_name }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="call" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Contact Number</h3>
                <p>{{ location.number }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="mail" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>Email Address</h3>
                <p>{{ location.email }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="location" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Location Details</h3>
                <p>Location ID: {{ location.location }}, State ID: {{ location.state }}, City ID: {{ location.b_city_id }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Full Address</h3>
                <p>{{ location.address }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="danger"></ion-icon>
              <ion-label>
                <h3>GST Number</h3>
                <p>{{ location.gst_num }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>PAN Number</h3>
                <p>{{ location.pan_num }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Privileged User</h3>
                <p>{{ location.privilege_user ? 'Yes' : 'No' }}</p>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="location.established_year">
              <ion-icon name="time" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>Established Year</h3>
                <p>{{ location.established_year }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Business Type</h3>
                <p>Type ID: {{ location.type_id }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="pulse" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Status</h3>
                <p>{{ location.active_status ? 'Active' : 'Inactive' }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="time" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>Created</h3>
                <p>{{ location.created_at | date:'medium' }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="time" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Last Updated</h3>
                <p>{{ location.updated_at | date:'medium' }}</p>
              </ion-label>
            </ion-item>

          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-item {
      margin-bottom: 8px;
    }

    ion-item h3 {
      font-weight: 600;
      color: var(--ion-color-dark);
      margin-bottom: 4px;
    }

    ion-item p {
      color: var(--ion-color-medium-shade);
      font-size: 14px;
    }

    .close-btn {
      margin-top: 20px;
      --border-radius: 8px;
    }

    ion-card {
      box-shadow: none;
      border: 1px solid var(--ion-color-light);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class LocationDetailsModalComponent {
  @Input() location: BusinessLocation | null = null;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }
}