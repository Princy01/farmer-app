import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { BusinessBranchWithNames } from './business-locations.service';
import { addIcons } from 'ionicons';
import { call, mail, business, location, card, time, pulse, close } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';

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
                <h3>{{ 'LOCATION_DETAILS.SHOP_NAME' | translate }}</h3>
                <p>{{ location.shop_name }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="call" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.CONTACT_NUMBER' | translate }}</h3>
                <p>{{ location.number }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="mail" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.EMAIL_ADDRESS' | translate }}</h3>
                <p>{{ location.email }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="location" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.LOCATION_DETAILS' | translate }}</h3>
                <p>
                  {{ 'LOCATION_DETAILS.LOCATION' | translate }}: {{ location.location_name }},
                  {{ 'LOCATION_DETAILS.STATE' | translate }}: {{ location.state_name }},
                  {{ 'LOCATION_DETAILS.CITY' | translate }}: {{ location.city_name }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.FULL_ADDRESS' | translate }}</h3>
                <p>{{ location.address }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="danger"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.GST_NUMBER' | translate }}</h3>
                <p>{{ location.gst_num }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="card" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.PAN_NUMBER' | translate }}</h3>
                <p>{{ location.pan_num }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="business" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.PRIVILEGED_USER' | translate }}</h3>
                <p>{{ location.privilege_user ? ('LOCATION_DETAILS.YES' | translate) : ('LOCATION_DETAILS.NO' | translate) }}</p>
              </ion-label>
            </ion-item>

            <ion-item *ngIf="location.established_year">
              <ion-icon name="time" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.ESTABLISHED_YEAR' | translate }}</h3>
                <p>{{ location.established_year }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="pulse" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.STATUS' | translate }}</h3>
                <p>{{ location.active_status ? ('LOCATION_DETAILS.ACTIVE' | translate) : ('LOCATION_DETAILS.INACTIVE' | translate) }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="time" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.CREATED' | translate }}</h3>
                <p>{{ location.created_at | date:'medium' }}</p>
              </ion-label>
            </ion-item>

            <ion-item>
              <ion-icon name="time" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>{{ 'LOCATION_DETAILS.LAST_UPDATED' | translate }}</h3>
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
    IonicModule,
    TranslatePipe
  ]
})
export class LocationDetailsModalComponent {
  @Input() location: BusinessBranchWithNames | null = null;

  constructor(private modalController: ModalController) {
    addIcons({ call, mail, business, location, card, time, pulse, close });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}