import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-live-tracking',
  templateUrl: './live-tracking.component.html',
  styleUrls: ['./live-tracking.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class LiveTrackingComponent implements AfterViewInit {
  map: any;
  orderStatus: string = 'In Transit';
  eta: string = '15 mins';

  driverLocation = { lat: 32.77862743743979, lng: 74.79643361083187 };
  driverMarker: any;

  constructor() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadMap();
      this.trackDriverLive();
    }, 500); // Small delay to ensure the container exists
  }


  loadMap() {
    this.map = L.map('map').setView([this.driverLocation.lat, this.driverLocation.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.driverMarker = L.marker([this.driverLocation.lat, this.driverLocation.lng]).addTo(this.map)
      .bindPopup('Driver Location')
      .openPopup();
  }

  trackDriverLive() {
    setInterval(() => {
      this.driverLocation.lat += (Math.random() - 0.5) * 0.001;
      this.driverLocation.lng += (Math.random() - 0.5) * 0.001;
      this.driverMarker.setLatLng([this.driverLocation.lat, this.driverLocation.lng]);

      if (Math.random() > 0.9) {
        this.orderStatus = 'Delivered';
        this.eta = '0 mins';
      }
    }, 5000);
  }

  callDriver() {
    window.open('tel:+911234567890', '_system');
  }

  confirmDelivery() {
    alert('Delivery Confirmed! Thank you.');
  }
}
