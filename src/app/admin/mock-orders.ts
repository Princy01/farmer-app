export const MOCK_ORDERS = [
  {
    id: 'ORD123',
    date: '2025-04-01',
    status: 'Delivered',
    totalPrice: 1540,
    paymentStatus: 'Paid',
    retailer: {
      name: 'Kishan Store',
      location: 'Rohini, Delhi',
      contact: '9999988888',
    },
    wholesaler: {
      name: 'Fresh Wholesalers',
      mandi: 'Azadpur Mandi',
    },
    products: [
      { name: 'Tomato', category: 'Vegetables', qty: 50, unitPrice: 10 },
      { name: 'Onion', category: 'Vegetables', qty: 30, unitPrice: 15 }
    ],
    transportUsed: true,
    transport: {
      transporter: 'Ram Logistics',
      driver: 'Rajesh Kumar',
      vehicle: 'KA-01-1234 (Mini Truck)',
      pickup: 'Azadpur Mandi',
      drop: 'Rohini, Delhi',
      distance: 24.5,
      time: '45 mins',
      cost: 320,
      status: 'Delivered'
    }
  },
  {
    id: 'ORD124',
    date: '2025-04-02',
    status: 'Pending',
    totalPrice: 980,
    paymentStatus: 'Unpaid',
    retailer: {
      name: 'Green Basket',
      location: 'Lajpat Nagar, Delhi',
      contact: '8888877777',
    },
    wholesaler: {
      name: 'Mandi Direct',
      mandi: 'Okhla Mandi',
    },
    products: [
      { name: 'Apple', category: 'Fruits', qty: 20, unitPrice: 25 },
      { name: 'Banana', category: 'Fruits', qty: 40, unitPrice: 6 }
    ],
    transportUsed: false,
  },
  {
    id: 'ORD125',
    date: '2025-04-03',
    status: 'In Transit',
    totalPrice: 2120,
    paymentStatus: 'Paid',
    retailer: {
      name: 'Apna Kirana',
      location: 'Dwarka, Delhi',
      contact: '7777766666',
    },
    wholesaler: {
      name: 'Delhi Fresh Supplies',
      mandi: 'Ghazipur Mandi',
    },
    products: [
      { name: 'Lentils (Masoor)', category: 'Pulses', qty: 40, unitPrice: 22 },
      { name: 'Beans', category: 'Pulses', qty: 30, unitPrice: 30 }
    ],
    transportUsed: true,
    transport: {
      transporter: 'Fast Movers',
      driver: 'Sandeep Yadav',
      vehicle: 'HR-26-5555 (Tempo)',
      pickup: 'Ghazipur Mandi',
      drop: 'Dwarka, Delhi',
      distance: 33,
      time: '1 hr 10 mins',
      cost: 450,
      status: 'On the way'
    }
  },
  {
    id: 'ORD126',
    date: '2025-04-04',
    status: 'Cancelled',
    totalPrice: 760,
    paymentStatus: 'Refunded',
    retailer: {
      name: 'Daily Needs Store',
      location: 'Pitampura, Delhi',
      contact: '6666655555',
    },
    wholesaler: {
      name: 'Mandi Express',
      mandi: 'Shahdara Mandi',
    },
    products: [
      { name: 'Wheat', category: 'Grains', qty: 20, unitPrice: 15 },
      { name: 'Rice', category: 'Grains', qty: 10, unitPrice: 25 }
    ],
    transportUsed: true,
    transport: {
      transporter: 'DeliveryX',
      driver: 'Manoj Sinha',
      vehicle: 'DL-01-9090 (Mini Van)',
      pickup: 'Shahdara Mandi',
      drop: 'Pitampura, Delhi',
      distance: 19.5,
      time: '30 mins',
      cost: 210,
      status: 'Cancelled'
    }
  }
];
