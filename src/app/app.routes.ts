import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'wholesaler/home',
    loadComponent: () => import('./Wholesaler/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'wholesaler/orders',
    loadComponent: () => import('./Wholesaler/My-Orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'wholesaler/order-details/:id',
    loadComponent: () => import('./Wholesaler/order-details/order-details.component').then(m => m.OrderDetailsComponent)
  },
  {
    path: 'wholesaler/for-sale',
    loadComponent: () => import('./Wholesaler/for-sale/for-sale.component').then((m) => m.ForSaleComponent),
  },
  {
    path: 'wholesaler/past-orders',
    loadComponent: () => import('./Wholesaler/past-orders/past-orders.component').then((m) => m.PastOrdersComponent),
  },
  {
    path: 'wholesaler/trends',
    loadComponent: () => import('./Wholesaler/trends/trends.component').then((m) => m.TrendsComponent),
  },
  {
    path: 'wholesaler/trends/sales-trends',
    loadComponent: () => import('./Wholesaler/sales-trends/sales-trends.component').then((m) => m. SalesTrendsComponent),
  },
  {
    path: 'wholesaler/trends/demand-trends',
    loadComponent: () => import('./Wholesaler/demand-trends/demand-trends.component').then((m) => m. DemandTrendsComponent),
  },
  {
    path: 'wholesaler/trends/stock-insights',
    loadComponent: () => import('./Wholesaler/stock-insights/stock-insights.component').then((m) => m. StockInsightsComponent),
  },
  {
    path: 'wholesaler/trends/market-comparison',
    loadComponent: () => import('./Wholesaler/market-comparison/market-comparison.component').then((m) => m. MarketComparisonComponent),
  },
  {
    path: 'wholesaler/market-opportunities',
    loadComponent: () => import('./Wholesaler/market-opportunities/market-opportunities.component').then((m) => m.MarketOpportunitiesComponent),
  },
  {
    path: 'wholesaler/market-opportunities/offer-modal',
    loadComponent: () => import('./Wholesaler/offer-modal/offer-modal.component').then((m) => m.OfferModalComponent),
  },
  {
    path: 'wholesaler/restocking-recommendations',
    loadComponent: () => import('./Wholesaler/restocking-recommendations/restocking-recommendations.component').then((m) => m.RestockingRecommendationsComponent),
  },

  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),

    children: [
      {
        path: '',
        redirectTo: 'admin-orders',
        pathMatch: 'full',
      },
      {
        path: 'admin-orders',
        loadComponent: () =>
          import('./admin/admin-orders.page').then((m) => m.AdminOrdersPage),
      },
      {
        path: 'admin-order-detail',
        loadComponent: () =>
          import('./admin/admin-order-detail.page').then((m) => m.AdminOrderDetailPage),
      },

      {
        path: 'driver',
        loadComponent: () => import('./forms/driver/driver.component').then((m) => m.DriverComponent),
      },
      {
        path: 'states',
        loadComponent: () => import('./forms/state/state.component').then((m) => m.StateComponent),
      },
      {
        path: 'category',
        loadComponent: () => import('./forms/category/category.component').then((m) => m.CategoryComponent),
      },
      {
        path: 'location',
        loadComponent: () => import('./forms/location/location.component').then((m) => m.LocationComponent),
      },
      {
        path: 'vehicle',
        loadComponent: () => import('./forms/vehicle/vehicle.component').then((m) => m.VehicleComponent),
      },
      {
        path: 'mandi',
        loadComponent: () => import('./forms/mandi/mandi.component').then((m) => m.MandiComponent),
      },
      {
        path: 'product',
        loadComponent: () => import('./forms/product/product.component').then((m) => m.ProductComponent),
      },
      {
        path: 'violation',
        loadComponent: () => import('./forms/violation/violation.component').then((m) => m.ViolationComponent),
      },
      {
        path: 'user',
        loadComponent: () => import('./forms/user/user.component').then((m) => m.UserComponent),
      },
      {
        path: 'order-status',
        loadComponent: () => import('./forms/order-status/order-status.component').then((m) => m.OrderStatusComponent),
      },
      {
        path: 'cash-payment',
        loadComponent: () => import('./forms/cash-payment/cash-payment.component').then((m) => m.CashPaymentComponent),
      },
      {
        path: 'business',
        loadComponent: () => import('./forms/business/business.component').then((m) => m.BusinessComponent),
      },
      {
        path: 'business-type',
        loadComponent: () => import('./forms/business-type/business-type.component').then((m) => m.BusinessTypeComponent),
      },
      {
        path: 'payment-mode',
        loadComponent: () => import('./forms/payment-mode/payment-mode.component').then((m) => m.PaymentModeComponent),
      },
      {
        path: 'business-branch',
        loadComponent: () => import('./forms/business-branch/business-branch.component').then((m) => m.BusinessBranchComponent),
      },
      {
        path: 'business-category',
        loadComponent: () => import('./forms/business-category/business-category.component').then((m) => m.BusinessCategoryComponent),
      },
    ]
  },

  {
    path: 'buyer',
    loadComponent: () => import('./buyer/buyer.page').then((m) => m.BuyerPage),
    children: [
      {
        path: 'buyer-home',
        loadComponent: () => import('./buyer/buyer-home/buyer-home.component').then((m) => m.BuyerHomeComponent),
      },
      {
        path: 'category/:categoryId',
        loadComponent: () => import('./buyer/category/category.component').then((m) => m.CategoryPageComponent),
      },
      // {
      //   path: 'product-details/:selectedProduct',
      //   loadComponent: () => import('./buyer/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
      // },
      {
        path: 'wishlist',
        loadComponent: () => import('./buyer/wishlist/wishlist.component').then((m) => m.WishlistComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./buyer/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./buyer/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'ride',
        loadComponent: () => import('./buyer/ride/ride.component').then((m) => m.RideComponent),
      },
      {
        path: 'retailer-order-tracking',
        loadComponent: () => import('./buyer/retailer-order-tracking/retailer-order-tracking.component').then((m) => m.RetailerOrderTrackingComponent),
      },
      {
      path: 'RetailerTrends',
      loadComponent: () => import('./buyer/retailer-trends/retailer-trends.component').then((m) => m.RetailerTrendsComponent),
      }
    ]
  },
  {
    path: 'warehouse',
    children: [
      {
        path: '',
        redirectTo: 'inventory-list',
        pathMatch: 'full'
      },
      {
        path: 'inventory-list',
        loadComponent: () =>
          import('./warehouse/inventory-list/inventory-list.component').then((m) => m.InventoryListComponent)
      },
      {
        path: 'add-inventory',
        loadComponent: () =>
          import('./warehouse/add-inventory/add-inventory.component').then((m) => m.AddInventoryComponent)
      },
      {
        path: 'inventory-detail/:batchNo',
        loadComponent: () =>
          import('./warehouse/inventory-detail/inventory-detail.component').then((m) => m.InventoryDetailComponent)
      },
      {
        path: 'edit-inventory/:batchNo',
        loadComponent: () =>
          import('./warehouse/edit-inventory/edit-inventory.component').then((m) => m.EditInventoryComponent)
      }
    ]
  },
  {
    path: 'transport',
    loadComponent: () => import('./transport/transport.component').then((m) => m.TransportComponent),
    children: [
      {
        path: '',
        redirectTo: 'transport-requests',
        pathMatch: 'full',
      },
      {
        path: 'transport-dashboard',
        loadComponent: () => import('./transport/transport-dashboard/transport-dashboard.component').then((m) => m.TransportDashboardComponent),
      },
      {
        path: 'transport-update-rates',
        loadComponent: () => import('./transport/transport-update-rates/transport-update-rates.component').then((m) => m.TransportUpdateRatesComponent),
      },
      {
        path: 'manage-vehicles',
        loadComponent: () => import('./transport/manage-vehicles/manage-vehicles.component').then((m) => m.ManageVehiclesComponent),
      },
      {
        path: 'manage-drivers',
        loadComponent: () => import('./transport/manage-drivers/manage-drivers.component').then((m) => m.ManageDriversComponent),
      },
      {
        path: 'transport-requests',
        loadComponent: () => import('./transport/transport-requests/transport-requests.component').then((m) => m.TransportRequestsComponent),
      },
      {
        path: 'assign-driver-modal',
        loadComponent: () => import('./transport/assign-driver-modal/assign-driver-modal.component').then((m) => m.AssignDriverModalComponent),
      },
      {
        path: 'delivery-confirmation',
        loadComponent: () => import('./transport/delivery-confirmation/delivery-confirmation.component').then((m) => m.DeliveryConfirmationComponent),
      },
      {
        path: 'earnings-dashboard',
        loadComponent: () => import('./transport/earnings-dashboard/earnings-dashboard.component').then((m) => m.EarningsDashboardComponent),
      },
      {
        path: 'delivery-history',
        loadComponent: () => import('./transport/delivery-history/delivery-history.component').then((m) => m.DeliveryHistoryComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./transport/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'live-tracking',
        loadComponent: () => import('./transport/live-tracking/live-tracking.component').then((m) => m.LiveTrackingComponent),
      },
      {
        path: 'route-optimization',
        loadComponent: () => import('./transport/route-optimization/route-optimization.component').then((m) => m.RouteOptimizationComponent),
      }
]
}
];
