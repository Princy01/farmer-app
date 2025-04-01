import { Injectable } from '@angular/core';
import { faker } from '@faker-js/faker';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private cities = ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Kolhapur', 'Solapur', 'Aurangabad'];
  private produceTypes = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices'];
  private items = [
    { name: 'Tomatoes', hindiName: 'टमाटर', image: 'assets/vegetables/tomato.jpg' },
    { name: 'Potatoes', hindiName: 'आलू', image: 'assets/vegetables/potato.jpg' },
    { name: 'Wheat', hindiName: 'गेहूं', image: 'assets/grains/wheat.jpg' },
    { name: 'Rice', hindiName: 'चावल', image: 'assets/grains/rice.jpg' }
  ];

  generateTransporters() {
    return [
      {
        id: 'T001',
        name: 'Fast Logistics',
        loadCapacity: 10000,
        available: true,
        assignedOrders: [],
        vehicleType: 'truck',
        rates: {
          perKmRate: 15,
          perKgRate: 2,
          peakHourRate: 20,
          lastUpdated: new Date().toISOString()
        }
      },
      {
        id: 'T002',
        name: 'Quick Transport',
        loadCapacity: 2000,
        available: true,
        assignedOrders: [],
        vehicleType: 'lorry',
        rates: {
          perKmRate: 12,
          perKgRate: 1.5,
          peakHourRate: 18,
          lastUpdated: new Date().toISOString()
        }
      },
      {
        id: 'T003',
        name: 'Safe Cargo',
        loadCapacity: 1500,
        available: true,
        assignedOrders: [],
        vehicleType: 'truck',
        rates: {
          perKmRate: 7,
          perKgRate: 5,
          peakHourRate: 15,
          lastUpdated: new Date().toISOString()
        }
      }
    ];
  }

  // generateUnassignedOrders() {
  //   return [
  //     {
  //       id: 'UO001',
  //       pickup: 'Nashik',
  //       delivery: 'Mumbai',
  //       distance: 165,
  //       load: {
  //         weight: 800,
  //         type: 'Vegetables'
  //       },
  //       basePrice: 3500,
  //       requestedDate: '2025-03-30',
  //       deliveryType: 'normal',
  //       urgency: 'standard',
  //       createdAt: new Date().toISOString()
  //     },
  //     {
  //       id: 'UO002',
  //       pickup: 'Pune',
  //       delivery: 'Mumbai',
  //       distance: 148,
  //       load: {
  //         weight: 500,
  //         type: 'Fruits'
  //       },
  //       basePrice: 2800,
  //       requestedDate: '2025-03-31',
  //       deliveryType: 'priority',
  //       urgency: 'high',
  //       createdAt: new Date().toISOString()
  //     }
  //   ];
  // }

  // generatePendingDeliveries() {
  //   return [
  //     {
  //       id: `PD${Date.now()}1`,
  //       items: [
  //         {
  //           id: 1,
  //           name: 'Tomatoes',
  //           image: 'assets/vegetables/tomato.jpg',
  //           hindiName: 'टमाटर',
  //           quantity: 25,
  //           price: 40,
  //           weight: 750
  //         }
  //       ],
  //       paymentMethod: 'upi',
  //       total: 4500,
  //       deliveryType: 'normal',
  //       urgency: 'standard',
  //       transporterId: null,
  //       pickupLocation: 'Kolhapur',
  //       dropoffLocation: 'Pune',
  //       weight: 750,
  //       distance: 230,
  //       suggestedPrice: 4500,
  //       accepted: false,
  //       assigned: false,
  //       createdAt: new Date().toISOString()
  //     },
  //     {
  //       id: `PD${Date.now()}2`,
  //       items: [
  //         {
  //           id: 2,
  //           name: 'Wheat',
  //           image: 'assets/grains/wheat.jpg',
  //           hindiName: 'गेहूं',
  //           quantity: 30,
  //           price: 45,
  //           weight: 900
  //         }
  //       ],
  //       paymentMethod: 'cash',
  //       total: 8900,
  //       deliveryType: 'priority',
  //       urgency: 'high',
  //       transporterId: null,
  //       pickupLocation: 'Nagpur',
  //       dropoffLocation: 'Mumbai',
  //       weight: 900,
  //       distance: 780,
  //       suggestedPrice: 8900,
  //       accepted: false,
  //       assigned: false,
  //       createdAt: new Date().toISOString()
  //     }
  //   ];
  // }

  generateUnassignedOrders(count = 5) {
    return Array.from({ length: count }, (_, index) => {
      const pickup = faker.helpers.arrayElement(this.cities);
      const delivery = faker.helpers.arrayElement(this.cities.filter(city => city !== pickup));

      return {
        id: `UO${String(index + 1).padStart(3, '0')}`,
        pickup,
        delivery,
        distance: faker.number.int({ min: 50, max: 800 }),
        load: {
          weight: faker.number.int({ min: 100, max: 3000 }),
          type: faker.helpers.arrayElement(this.produceTypes)
        },
        basePrice: faker.number.int({ min: 2000, max: 15000 }),
        requestedDate: faker.date.soon({ days: 7 }).toISOString().split('T')[0],
        deliveryType: faker.helpers.arrayElement(['normal', 'priority']),
        urgency: faker.helpers.arrayElement(['low', 'standard', 'high']),
        createdAt: faker.date.recent().toISOString()
      };
    });
  }

  generatePendingDeliveries(count = 5) {
    return Array.from({ length: count }, (_, index) => {
      const pickup = faker.helpers.arrayElement(this.cities);
      const delivery = faker.helpers.arrayElement(this.cities.filter(city => city !== pickup));
      const item = faker.helpers.arrayElement(this.items);
      const quantity = faker.number.int({ min: 10, max: 100 });
      const price = faker.number.int({ min: 20, max: 100 });
      const weight = faker.number.int({ min: 100, max: 3000 });

      return {
        id: `PD${Date.now()}${index + 1}`,
        items: [{
          id: index + 1,
          name: item.name,
          image: item.image,
          hindiName: item.hindiName,
          quantity,
          price,
          weight
        }],
        paymentMethod: faker.helpers.arrayElement(['cash', 'upi', 'card']),
        total: faker.number.int({ min: 2000, max: 15000 }),
        deliveryType: faker.helpers.arrayElement(['normal', 'priority']),
        urgency: faker.helpers.arrayElement(['low', 'standard', 'high']),
        transporterId: null,
        pickupLocation: pickup,
        dropoffLocation: delivery,
        weight,
        distance: faker.number.int({ min: 50, max: 800 }),
        suggestedPrice: faker.number.int({ min: 2000, max: 15000 }),
        accepted: false,
        assigned: false,
        createdAt: faker.date.recent().toISOString()
      };
    });
  }
}