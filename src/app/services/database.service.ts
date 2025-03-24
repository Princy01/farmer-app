import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface TransporterRate {
  perKmRate: number;
  perKgRate: number;
  peakHourRate: number;
  lastUpdated: string;
}

interface Transporter {
  id: string;
  name: string;
  loadCapacity: number;
  available: boolean;
  assignedOrders: any[];
  vehicleType: string;
  rates?: TransporterRate;
}

interface DriverAssignment {
  id: string;
  name: string;
  vehicleType: string;
  loadCapacity: number;
  rates?: TransporterRate;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private storageKey = 'transportRates';
  private transportersKey = 'availableTransporters';
  private apiUrl = 'https://your-api-endpoint.com/api/orders'; // Update with actual backend API

  private transporterRatesKey = 'transporterRates';

  constructor(private http: HttpClient) {
    this.initializeDummyTransporters();
  }

  private initializeDummyTransporters() {
    const dummyTransporters: Transporter[] = [
      {
        id: 'T001',
        name: 'Fast Logistics',
        loadCapacity: 1000,
        available: true,
        assignedOrders: [],
        vehicleType: 'truck',
        rates: {
          perKmRate: 5,
          perKgRate: 2,
          peakHourRate: 10,
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
          perKmRate: 4,
          perKgRate: 3,
          peakHourRate: 9,
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

    const existingTransporters = this.getAvailableTransporters();
    if (existingTransporters.length === 0) {
      this.saveTransporters(dummyTransporters);
    }
  }

  updateTransporterRates(transporterId: string, rates: TransporterRate) {
    const transporters = this.getAvailableTransporters();
    const transporterIndex = transporters.findIndex(t => t.id === transporterId);

    if (transporterIndex !== -1) {
      transporters[transporterIndex].rates = {
        ...rates,
        lastUpdated: new Date().toISOString()
      };
      this.saveTransporters(transporters);
      return true;
    }
    return false;
  }

  getTransporterRates(transporterId: string): TransporterRate | null {
    const transporters = this.getAvailableTransporters();
    const transporter = transporters.find(t => t.id === transporterId);
    return transporter?.rates || null;
  }

  // Override calculateBasePrice to use transporter-specific rates
  calculateBasePrice(
    pickup: string,
    delivery: string,
    totalLoad: number,
    deliveryType: string,
    urgency: string,
    transporterId?: string
): number {
    // If specific transporter is requested, use their rates
    if (transporterId) {
        const transporterRates = this.getTransporterRates(transporterId);
        if (transporterRates) {
            return this.calculatePriceWithRates(
                pickup,
                delivery,
                totalLoad,
                deliveryType,
                urgency,
                transporterRates
            );
        }
    }

    // Otherwise calculate median price from all available transporters
    const transporters = this.getAvailableTransporters();
    const availableRates = transporters
        .filter(t => t.rates)
        .map(t => t.rates as TransporterRate);

    if (availableRates.length === 0) {
        // Fallback to default rates if no transporters available
        return this.calculatePriceWithRates(
            pickup,
            delivery,
            totalLoad,
            deliveryType,
            urgency,
            {
                perKmRate: 5,
                perKgRate: 2,
                peakHourRate: 10,
                lastUpdated: new Date().toISOString()
            }
        );
    }

    // Calculate median rates
    const medianKmRate = this.calculateMedian(availableRates.map(r => r.perKmRate));
    const medianKgRate = this.calculateMedian(availableRates.map(r => r.perKgRate));
    const medianPeakRate = this.calculateMedian(availableRates.map(r => r.peakHourRate));

    return this.calculatePriceWithRates(
        pickup,
        delivery,
        totalLoad,
        deliveryType,
        urgency,
        {
            perKmRate: medianKmRate,
            perKgRate: medianKgRate,
            peakHourRate: medianPeakRate,
            lastUpdated: new Date().toISOString()
        }
    );
}

// New helper method to calculate price using specific rates
private calculatePriceWithRates(
  pickup: string,
  delivery: string,
  totalLoad: number,
  deliveryType: string,
  urgency: string,
  rates: TransporterRate
): number {
  const totalDistance = this.getDistanceBetween(pickup, delivery);
  const trafficFactor = Math.random() * 10;
  const urgencyCharge = urgency === 'priority' ? 20 : 0;
  const deliveryTypeCharge = deliveryType === 'single' ? 15 : 0;

  // **1. Fuel Cost Impact**
  const fuelPricePerLitre = 100; // Assume a default fuel price (changeable)
  const avgFuelEfficiency = 5; // Assume 5 km per litre
  const fuelCostFactor = (totalDistance / avgFuelEfficiency) * fuelPricePerLitre * 0.05; // 5% fuel impact

  // **2. Time of Day Surcharge**
  const currentHour = new Date().getHours();
  const timeSurcharge = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 20) ? 10 : 0;

  // **3. Road Type Factor**
  const roadTypes = ['highway', 'local', 'off-road'];
  const selectedRoadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
  const roadFactor = selectedRoadType === 'off-road' ? 15 : selectedRoadType === 'local' ? 5 : 0;

  // **4. Weather Conditions**
  const weatherConditions = ['clear', 'rainy', 'stormy', 'snowy'];
  const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const weatherFactor = currentWeather === 'stormy' || currentWeather === 'snowy' ? 20 : currentWeather === 'rainy' ? 10 : 0;

  // **5. Demand Surge Pricing**
  const transporters = this.getAvailableTransporters();
  const activeTransporters = transporters.filter(t => t.assignedOrders.length > 0).length;
  const surgeFactor = activeTransporters > transporters.length * 0.7 ? 15 : 0;

  // **6. Vehicle Efficiency**
  const vehicleEfficiency = rates.perKmRate > 6 ? 10 : 5;

  const basePrice =
      totalDistance * rates.perKmRate +
      totalLoad * rates.perKgRate +
      urgencyCharge +
      deliveryTypeCharge +
      trafficFactor +
      fuelCostFactor +
      timeSurcharge +
      roadFactor +
      weatherFactor +
      surgeFactor +
      vehicleEfficiency;

  return Math.round(basePrice);
}

  // Save transporter rates to local storage
  saveRates(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Retrieve saved rates from local storage
  getRates(): any {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  // Store available transporters
  saveTransporters(transporters: any[]) {
    localStorage.setItem(this.transportersKey, JSON.stringify(transporters));
  }

  // Get available transporters
  getAvailableTransporters(): any[] {
    const data = localStorage.getItem(this.transportersKey);
    return data ? JSON.parse(data) : [];
  }

  // Find transporters that can take the load
  findEligibleTransporters(orderWeight: number): any[] {
    const transporters = this.getAvailableTransporters();
    return transporters.filter((t) => t.available && t.loadCapacity >= orderWeight);
  }

  // Assign order request to eligible transporters
  assignOrderToTransporters(order: any) {
    const eligibleTransporters = this.findEligibleTransporters(order.weight);

    if (eligibleTransporters.length === 0) {
      return { success: false, message: 'No transporters available for this load.' };
    }

    eligibleTransporters.forEach((transporter) => {
      transporter.assignedOrders = transporter.assignedOrders || [];
      transporter.assignedOrders.push({
        orderId: order.id,
        pickup: order.pickupLocation,
        delivery: order.dropoffLocation,
        weight: order.weight,
        distance: order.distance,
        suggestedPrice: this.calculateBasePrice(
          order.pickupLocation,
          order.dropoffLocation,
          order.weight,
          order.type,
          order.urgency
        ),
      });
    });

    this.saveTransporters(eligibleTransporters);
    return { success: true, message: 'Order requests sent to available transporters.' };
  }

  // Calculate base price based on multiple factors
  // calculateBasePrice(
  //   pickup: string,
  //   delivery: string,
  //   totalLoad: number,
  //   deliveryType: string,
  //   urgency: string
  // ): number {
  //   const dummyRates = [
  //     { perKmRate: 5, perKgRate: 2, peakHourRate: 10 },
  //     { perKmRate: 6, perKgRate: 2.5, peakHourRate: 12 },
  //     { perKmRate: 4.5, perKgRate: 2.2, peakHourRate: 11 },
  //   ];

  //   const medianRate = this.calculateMedian(dummyRates.map((rate) => rate.perKmRate));
  //   const totalDistance = this.getDistanceBetween(pickup, delivery);
  //   const trafficFactor = Math.random() * 10;
  //   const urgencyCharge = urgency === 'priority' ? 20 : 0;
  //   const deliveryTypeCharge = deliveryType === 'single' ? 15 : 0;

  //   const basePrice =
  //     totalDistance * medianRate + totalLoad * 2 + urgencyCharge + deliveryTypeCharge + trafficFactor;
  //   return Math.round(basePrice);
  // }

  // Calculate median from a set of values
  private calculateMedian(values: number[]): number {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  // Dummy function to estimate distance (replace with real logic if needed)
  private getDistanceBetween(pickup: string, delivery: string): number {
    return Math.floor(Math.random() * (100 - 10 + 1)) + 10;
  }

  // Fetch pending deliveries from backend
  getPendingDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  // Update order status in the backend
  updateOrderStatus(orderId: number, updateData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}`, updateData);
  }

  async checkDriverAssignment(
    deliveryType: string,
    urgency: string,
    totalWeight: number
  ): Promise<DriverAssignment | null> {
    // Get available transporters that can handle the load
    const eligibleTransporters = this.findEligibleTransporters(totalWeight);

    if (eligibleTransporters.length === 0) {
      return null;
    }

    // Simulate async operation and random driver selection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random chance (70%) of finding a driver
    if (Math.random() < 0.7) {
      const selectedDriver = eligibleTransporters[
        Math.floor(Math.random() * eligibleTransporters.length)
      ];

      // Mark the selected transporter as unavailable
      const transporters = this.getAvailableTransporters();
      const updatedTransporters = transporters.map(t =>
        t.id === selectedDriver.id ? { ...t, available: false } : t
      );
      this.saveTransporters(updatedTransporters);

      return {
        id: selectedDriver.id,
        name: selectedDriver.name,
        vehicleType: selectedDriver.vehicleType,
        loadCapacity: selectedDriver.loadCapacity,
        rates: selectedDriver.rates
      };
    }

    return null;
  }

}
