import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardContent,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, call, mail, location, business, card, pin } from 'ionicons/icons';
import { BusinessLocation } from '../services/business-locations.service';

@Component({
  selector: 'app-location-details-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ location?.shopName }}</ion-title>
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
              <ion-icon name="location" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Location</h3>
                <p>{{ location.location }}, {{ location.state }}</p>
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
              <ion-icon name="pin" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Pincode</h3>
                <p>{{ location.pincode }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="danger"></ion-icon>
              <ion-label>
                <h3>GST Number</h3>
                <p>{{ location.gstNumber }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>PAN Number</h3>
                <p>{{ location.pan }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Privileged User</h3>
                <p>{{ location.privilegedUser }}</p>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="location.establishedYear">
              <ion-icon name="business" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>Established Year</h3>
                <p>{{ location.establishedYear }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Business Type</h3>
                <p>{{ location.typeId | titlecase }}</p>
              </ion-label>
            </ion-item>

          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-button
        expand="block"
        fill="solid"
        color="primary"
        (click)="dismiss()"
        class="close-btn">
        Close
      </ion-button>
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonCard,
    IonCardContent
  ]
})
export class LocationDetailsModalComponent {
  @Input() location: BusinessLocation | null = null;

  constructor(private modalController: ModalController) {
    addIcons({ close, call, mail, location, business, card, pin });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}