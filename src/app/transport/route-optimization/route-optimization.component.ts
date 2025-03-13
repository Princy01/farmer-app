import { Component, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var google: any; // For using Google Maps API

@Component({
  selector: 'app-route-optimization',
  standalone: true,
  templateUrl: './route-optimization.component.html',
  styleUrls: ['./route-optimization.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RouteOptimizationComponent implements AfterViewInit {
  map!: any;
  directionsService!: any;
  directionsRenderer!: any;

  retailers = [
    { name: 'Retailer A', location: { lat: 28.7041, lng: 77.1025 } }, // Delhi
    { name: 'Retailer B', location: { lat: 28.4595, lng: 77.0266 } }, // Gurgaon
    { name: 'Retailer C', location: { lat: 28.5355, lng: 77.3910 } }  // Noida
  ];

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    const mapElement = document.getElementById('map') as HTMLElement;
    this.map = new google.maps.Map(mapElement, {
      center: { lat: 28.6139, lng: 77.2090 }, // Center: Delhi
      zoom: 10
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);

    this.calculateOptimizedRoute();
  }

  calculateOptimizedRoute() {
    const waypoints = this.retailers.map(retailer => ({
      location: retailer.location,
      stopover: true
    }));

    const request = {
      origin: { lat: 28.6139, lng: 77.2090 }, // Start Location (e.g., Wholesaler’s Warehouse)
      destination: waypoints[waypoints.length - 1].location,
      waypoints: waypoints.slice(0, -1),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
      }
    });
  }
}
