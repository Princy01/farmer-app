import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface TransporterRate {
  perKmRate: number;
  perKgRate: number;
  peakHourRate: number;
  lastUpdated: string;
}

// Add this interface to database.service.ts
interface DriverAssignmentRequest {
  deliveryType: string;
  urgency: string;
  pickup: string;
  delivery: string;
  distance: number;
  load: {
    weight: number;
    type: string;
  };
  basePrice: number;
  requestedDate: string;
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

interface DirectOrder {
  id: number;
  buyerId: string;
  sellerId: string;
  items: any[];
  totalAmount: number;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
  distance?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  transportRequired: false;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private storageKey = 'transportRates';
  private transportersKey = 'availableTransporters';
  private apiUrl = 'https://your-api-endpoint.com/api/orders';
  private unassignedOrdersKey = 'unassignedOrders'

  constructor(private http: HttpClient) {
    this.initializeDummyTransporters();
    this.initializeUnassignedOrders();
  }

  private initializeUnassignedOrders(){
    const existingUnassignedOrders = this.getUnassignedOrders();
    if (existingUnassignedOrders.length === 0) {
      this.saveUnassignedOrders([]);
    }
  }
  private initializeDummyTransporters() {
    const dummyTransporters: Transporter[] = [
      {
        id: 'T001',
        name: 'Fast Logistics',
        loadCapacity: 3,
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

  updateTransporterRates(transporterId: string, rates: TransporterRate): boolean {
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

  calculateBasePrice(
    pickup: string,
    delivery: string,
    totalLoad: number,
    deliveryType: string,
    urgency: string,
    transporterId?: string
  ): number {
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

    const transporters = this.getAvailableTransporters();
    const availableRates = transporters
      .filter(t => t.rates)
      .map(t => t.rates as TransporterRate);

    if (availableRates.length === 0) {
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

    const fuelPricePerLitre = 100;
    const avgFuelEfficiency = 5;
    const fuelCostFactor = (totalDistance / avgFuelEfficiency) * fuelPricePerLitre * 0.05;

    const currentHour = new Date().getHours();
    const timeSurcharge = (currentHour >= 7 && currentHour <= 9) ||
                         (currentHour >= 17 && currentHour <= 20) ? 10 : 0;

    const roadTypes = ['highway', 'local', 'off-road'];
    const selectedRoadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
    const roadFactor = selectedRoadType === 'off-road' ? 15 :
                      selectedRoadType === 'local' ? 5 : 0;

    const weatherConditions = ['clear', 'rainy', 'stormy', 'snowy'];
    const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const weatherFactor = currentWeather === 'stormy' || currentWeather === 'snowy' ? 20 :
                         currentWeather === 'rainy' ? 10 : 0;

    const transporters = this.getAvailableTransporters();
    const activeTransporters = transporters.filter(t => t.assignedOrders.length > 0).length;
    const surgeFactor = activeTransporters > transporters.length * 0.7 ? 15 : 0;

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

  saveTransporters(transporters: Transporter[]): void {
    localStorage.setItem(this.transportersKey, JSON.stringify(transporters));
  }

  saveUnassignedOrders(unassignedOrders: any[]): void {
    localStorage.setItem(this.unassignedOrdersKey, JSON.stringify(unassignedOrders));
  }

  getUnassignedOrders(){
    const data = localStorage.getItem(this.unassignedOrdersKey);
    return data ? JSON.parse(data) : [];
  }

  getAvailableTransporters(): Transporter[] {
    const data = localStorage.getItem(this.transportersKey);
    return data ? JSON.parse(data) : [];
  }

  findEligibleTransporters(orderWeight: number): Transporter[] {
    const transporters = this.getAvailableTransporters();
    console.log(transporters)

    return transporters.filter(t => t.available && t.loadCapacity >= orderWeight);
  }

  assignOrderToTransporters(order: any): { success: boolean; message: string } {
    const eligibleTransporters = this.getAvailableTransporters();

    // if (eligibleTransporters.length === 0) {
    //   return {
    //     success: false,
    //     message: 'No transporters available for this load.'
    //   };
    // }

    eligibleTransporters.forEach(transporter => {
      transporter.assignedOrders = transporter.assignedOrders || [];
      if (transporter.id === order.transporterId)
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
    // this.saveTransporters(this.getAvailableTransporters());

    return {
      success: true,
      message: 'Order requests sent to available transporters.'
    };
  }

  private calculateMedian(values: number[]): number {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  private getDistanceBetween(pickup: string, delivery: string): number {
    return Math.floor(Math.random() * (100 - 10 + 1)) + 10;
  }

  getPendingDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  updateOrderStatus(orderId: number, updateData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}`, updateData);
  }

  // async checkDriverAssignment(
  //   deliveryType: string,
  //   urgency: string,
  //   totalWeight: number
  // ): Promise<DriverAssignment | null> {
  //   const eligibleTransporters = this.findEligibleTransporters(totalWeight);

  //   if (eligibleTransporters.length === 0) {
  //     return null;
  //   }

  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   if (Math.random() < 1) {
  //     const selectedDriver = eligibleTransporters[
  //       Math.floor(Math.random() * eligibleTransporters.length)
  //     ];

  //     const transporters = this.getAvailableTransporters();
  //     const updatedTransporters = transporters.map(t =>
  //       t.id === selectedDriver.id ? { ...t, available: false } : t
  //     );
  //     this.saveTransporters(updatedTransporters);

  //     return {
  //       id: selectedDriver.id,
  //       name: selectedDriver.name,
  //       vehicleType: selectedDriver.vehicleType,
  //       loadCapacity: selectedDriver.loadCapacity,
  //       rates: selectedDriver.rates
  //     };
  //   }
  //   return null;
  // }

  //

  async createUnassignedOrder(request: DriverAssignmentRequest): Promise<string> {
    const unassignedOrders = this.getUnassignedOrders();
    const newOrder = {
      ...request,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    unassignedOrders.push(newOrder);
    this.saveUnassignedOrders(unassignedOrders);

    return newOrder.id;
  }

  // async checkDriverAssignment(request: DriverAssignmentRequest): Promise<DriverAssignment | null> {
  //   // Save to unassigned orders first
  //   const unassignedOrders = this.getUnassignedOrders();
  //   const newOrder = {
  //     ...request,
  //     id: Date.now().toString(),
  //     status: 'pending',
  //     createdAt: new Date(),
  //     attempts: 0,
  //     maxAttempts: 3
  //   };

  //   unassignedOrders.push(newOrder);
  //   this.saveUnassignedOrders(unassignedOrders);

  //   // Instead of automatically selecting, wait for transporter acceptance
  //   await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

  //   // Check if any transporter has accepted this order
  //   const acceptedTransporter = this.checkTransporterAcceptance(newOrder.id);

  //   if (acceptedTransporter) {
  //     const transporters = this.getAvailableTransporters();
  //     const updatedTransporters = transporters.map(t =>
  //       t.id === acceptedTransporter.id ? { ...t, available: false } : t
  //     );
  //     this.saveTransporters(updatedTransporters);

  //     // Remove from unassigned orders
  //     this.removeFromUnassignedOrders(newOrder.id);

  //     return {
  //       id: acceptedTransporter.id,
  //       name: acceptedTransporter.name,
  //       vehicleType: acceptedTransporter.vehicleType,
  //       loadCapacity: acceptedTransporter.loadCapacity,
  //       rates: acceptedTransporter.rates
  //     };
  //   }

  //   return null;
  // }

  async checkOrderAssignment(orderId: string): Promise<DriverAssignment | null> {
    // Check if any transporter has accepted this order
    const acceptedTransporter = this.checkTransporterAcceptance(orderId);

    if (acceptedTransporter) {
      const transporters = this.getAvailableTransporters();
      const updatedTransporters = transporters.map(t =>
        t.id === acceptedTransporter.id ? { ...t, available: false } : t
      );
      this.saveTransporters(updatedTransporters);

      // Remove from unassigned orders
      this.removeFromUnassignedOrders(orderId);

      return {
        id: acceptedTransporter.id,
        name: acceptedTransporter.name,
        vehicleType: acceptedTransporter.vehicleType,
        loadCapacity: acceptedTransporter.loadCapacity,
        rates: acceptedTransporter.rates
      };
    }

    return null;
  }

  private checkTransporterAcceptance(orderId: string): Transporter | null {
    // Get acceptance status from localStorage or your preferred storage
    const acceptanceKey = `order_${orderId}_acceptance`;
    const acceptance = localStorage.getItem(acceptanceKey);

    if (acceptance) {
      const transporterId = JSON.parse(acceptance).transporterId;
      const transporters = this.getAvailableTransporters();
      return transporters.find(t => t.id === transporterId) || null;
    }

    return null;
  }

  acceptUnassignedOrder(orderId: string, transporterId: string): boolean {
    try {
      // Save acceptance status
      const acceptanceKey = `order_${orderId}_acceptance`;
      localStorage.setItem(acceptanceKey, JSON.stringify({
        transporterId,
        acceptedAt: new Date().toISOString()
      }));

      return true;
    } catch (error) {
      console.error('Error accepting order:', error);
      return false;
    }
  }

  private removeFromUnassignedOrders(orderId: string): void {
    const unassignedOrders = this.getUnassignedOrders();
    const filteredOrders = unassignedOrders.filter((order: any) => order.id !== orderId);
    this.saveUnassignedOrders(filteredOrders);
  }

  assignDirectOrder(order: DirectOrder): { success: boolean; message: string } {
    try {
      // Validate order
      if (!order.buyerId || !order.sellerId || !order.items?.length) {
        return {
          success: false,
          message: 'Invalid order details provided.'
        };
      }

      // Calculate distance if not provided
      if (!order.distance) {
        order.distance = this.getDistanceBetween(
          order.pickupLocation,
          order.dropoffLocation
        );
      }

      // Store order in local storage
      const ordersKey = 'directOrders';
      const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');

      existingOrders.push({
        ...order,
        status: 'pending',
        createdAt: new Date(),
        transportRequired: false
      });

      localStorage.setItem(ordersKey, JSON.stringify(existingOrders));

      // Notify seller about new order
      this.notifySeller(order.sellerId, {
        orderId: order.id,
        buyerId: order.buyerId,
        items: order.items,
        totalAmount: order.totalAmount,
        pickupLocation: order.pickupLocation
      });

      return {
        success: true,
        message: 'Order sent directly to seller.'
      };
    } catch (error) {
      console.error('Error assigning direct order:', error);
      return {
        success: false,
        message: 'Failed to process direct order.'
      };
    }
  }

  // Helper method for seller notification
private notifySeller(sellerId: string, orderDetails: any): void {
  // Implement your notification logic here
  console.log(`Notifying seller ${sellerId} about new order:`, orderDetails);
}

// Add method to get direct orders
getDirectOrders(userId: string, userType: 'buyer' | 'seller'): DirectOrder[] {
  const ordersKey = 'directOrders';
  const allOrders: DirectOrder[] = JSON.parse(localStorage.getItem(ordersKey) || '[]');

  return allOrders.filter(order =>
    userType === 'buyer' ? order.buyerId === userId : order.sellerId === userId
  );
}

getTransporterDetails (transporterId: string){
  return this.getAvailableTransporters().find(
    transporter => {
      return transporter.id === transporterId
    }
  )
}

}