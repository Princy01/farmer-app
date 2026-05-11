import { CanActivateFn, Routes } from '@angular/router';
import { VerifyEmailPage } from './verify-email/verify-email.page';
import { authGuard, requireRolesGuard } from './auth/auth.guard';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/auth.page').then((m) => m.LoginPage),
  },
  {
    path: 'verify-email',
    component: VerifyEmailPage
  },
  {
    path: 'wholesaler/home',
    loadComponent: () => import('./Wholesaler/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'wholesaler/product-details/:id',
    loadComponent: () => import('./Wholesaler/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
  },
  {
    path: 'wholesaler/profile',
    loadComponent: () => import('./Wholesaler/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'wholesaler/settings',
    loadComponent: () => import('./Wholesaler/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'wholesaler/orders',
    loadComponent: () => import('./Wholesaler/orders-received/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'wholesaler/order-details/:id',
    loadComponent: () => import('./Wholesaler/order-details/order-details.component').then(m => m.OrderDetailsComponent)
  },
  {
    path: 'wholesaler/report-issue/:orderId',
    loadComponent: () => import('./Wholesaler/disputes/report-issue/report-issue.component').then((m) => m.ReportIssueComponent),
  },
  {
    path: 'wholesaler/issue-submitted/:id',
    loadComponent: () => import('./Wholesaler/disputes/issue-submitted/issue-submitted.component').then((m) => m.IssueSubmittedComponent),
  },
  {
    path: 'wholesaler/my-issues',
    loadComponent: () => import('./Wholesaler/disputes/my-issues/my-issues.component').then((m) => m.MyIssuesComponent),
  },
  {
    path: 'wholesaler/issue-detail/:id',
    loadComponent: () => import('./Wholesaler/disputes/issue-detail/issue-detail.component').then((m) => m.IssueDetailComponent),
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
    loadComponent: () => import('./Wholesaler/sales-trends/sales-trends.component').then((m) => m.SalesTrendsComponent),
  },
  {
    path: 'wholesaler/trends/demand-trends',
    loadComponent: () => import('./Wholesaler/demand-trends/demand-trends.component').then((m) => m.DemandTrendsComponent),
  },
  {
    path: 'wholesaler/trends/stock-insights',
    loadComponent: () => import('./Wholesaler/stock-insights/stock-insights.component').then((m) => m.StockInsightsComponent),
  },
  {
    path: 'wholesaler/trends/market-comparison',
    loadComponent: () => import('./Wholesaler/market-comparison/market-comparison.component').then((m) => m.MarketComparisonComponent),
  },
  {
    path: 'wholesaler/market-opportunities',
    loadComponent: () => import('./Wholesaler/market-opportunities/market-opportunities.component').then((m) => m.MarketOpportunitiesComponent),
  },
  {
    path: 'wholesaler/restocking-recommendations',
    loadComponent: () => import('./Wholesaler/restocking-recommendations/restocking-recommendations.component').then((m) => m.RestockingRecommendationsComponent),
  },
  {
    path: 'wholesaler/business-registration',
    loadComponent: () => import('./Wholesaler/business-registration/business-registration.component').then((m) => m.BusinessRegistrationComponent),
  },
  {
    path: 'wholesaler/business-info',
    loadComponent: () => import('./Wholesaler/business-info/business-info.component').then((m) => m.BusinessInfoComponent),
  },
  {
    path: 'wholesaler/business-locations',
    loadComponent: () => import('./Wholesaler/business-locations/business-locations.component').then((m) => m.BusinessLocationsComponent),
  },
  {
    path: 'wholesaler/add-business-location',
    loadComponent: () => import('./Wholesaler/add-business-location/add-business-location.component').then((m) => m.AddBusinessLocationComponent),
  },
  {
    path: 'wholesaler/branch-products',
    loadComponent: () => import('./Wholesaler/branch-products/branch-products.component').then((m) => m.BranchProductsComponent),
  },
  {
    path: 'wholesaler/stock-dashboard',
    loadComponent: () => import('./Wholesaler/stock-dashboard/stock-dashboard.component').then((m) => m.StockDashboardComponent),
  },
  {
    path: 'wholesaler/add-stock',
    loadComponent: () => import('./Wholesaler/add-stock/add-stock.component').then((m) => m.AddStockComponent),
  },
  {
    path: 'wholesaler/update-stock',
    loadComponent: () => import('./Wholesaler/update-stock/update-stock.component').then((m) => m.UpdateStockComponent),
  },
  {
    path: 'wholesaler/pickup-orders',
    loadComponent: () => import('./Wholesaler/pickup-orders/pickup-orders.component').then((m) => m.WholesalerPickupOrdersComponent),
  },

  {
    path: 'buyer',
    loadComponent: () => import('./buyer/buyer.page').then((m) => m.BuyerPage),
    children: [
      {
        path: 'business-registration',
        loadComponent: () => import('./buyer/business-registration/business-registration.component').then((m) => m.BusinessRegistrationComponent),
      },
      {
        path: 'business-info',
        loadComponent: () => import('./buyer/business-info/business-info.component').then((m) => m.BusinessInfoComponent),
      },
      {
        path: 'business-locations',
        loadComponent: () => import('./buyer/business-locations/business-locations.component').then((m) => m.BusinessLocationsComponent),
      },
      {
        path: 'add-business-location',
        loadComponent: () => import('./buyer/add-business-location/add-business-location.component').then((m) => m.AddBusinessLocationComponent),
      },
      {
        path: 'buyer-home',
        loadComponent: () => import('./buyer/buyer-home/buyer-home.component').then((m) => m.BuyerHomeComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./buyer/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./buyer/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'category/:categoryId',
        loadComponent: () => import('./buyer/category/category.component').then((m) => m.CategoryPageComponent),
      },
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
        path: 'retailer-order-history',
        loadComponent: () => import('./buyer/retailer-order-history/retailer-order-history.component').then((m) => m.RetailerOrderHistoryComponent),
      },
      {
        path: 'retailer-order-details/:id',
        loadComponent: () => import('./buyer/retailer-order-details/retailer-order-details.component').then((m) => m.RetailerOrderDetailsComponent),
      },
      {
        path: 'report-issue/:orderId',
        loadComponent: () => import('./buyer/disputes/report-issue/report-issue.component').then((m) => m.ReportIssueComponent),
      },
      {
        path: 'issue-submitted/:id',
        loadComponent: () => import('./buyer/disputes/issue-submitted/issue-submitted.component').then((m) => m.IssueSubmittedComponent),
      },
      {
        path: 'my-issues',
        loadComponent: () => import('./buyer/disputes/my-issues/my-issues.component').then((m) => m.MyIssuesComponent),
      },
      {
        path: 'issue-detail/:id',
        loadComponent: () => import('./buyer/disputes/issue-detail/issue-detail.component').then((m) => m.IssueDetailComponent),
      },
      {
        path: 'RetailerTrends',
        loadComponent: () => import('./buyer/retailer-trends/retailer-trends.component').then((m) => m.RetailerTrendsComponent),
      },
      {
        path: 'payment',
        loadComponent: () => import('./buyer/payment/payment.component').then((m) => m.PaymentComponent),
      },
      {
        path: 'order-confirmation',
        loadComponent: () => import('./buyer/order-confirmation/order-confirmation.component').then((m) => m.OrderConfirmationComponent),
      },

    ]
  },
  {
    path: 'warehouse',
    children: [
      {
        path: '',
        redirectTo: 'warehouse-list',
        pathMatch: 'full'
      },
      {
        path: 'warehouse-list',
        loadComponent: () =>
          import('./warehouse/warehouse-list/warehouse-list.component').then((m) => m.WarehouseListComponent)
      },
      {
        path: 'warehouse-list/:warehouseId/inventory',
        loadComponent: () =>
          import('./warehouse/inventory-list/inventory-list.component').then((m) => m.InventoryListComponent)
      },
      {
        path: 'warehouse-list/:warehouseId/inventory/add',
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
      },
      {
        path: 'receiving-inspection',
        loadComponent: () =>
          import('./warehouse/receiving-inspection/receiving-inspection.component').then((m) => m.ReceivingInspectionComponent)
      },
      {
        path: 'storage-management',
        loadComponent: () =>
          import('./warehouse/storage-management/storage-management.component').then((m) => m.StorageManagementComponent)
      },
      {
        path: 'dispatch-order-management',
        loadComponent: () =>
          import('./warehouse/dispatch-order-management/dispatch-order-management.component').then((m) => m.DispatchOrderManagementComponent)
      },
      {
        path: 'stock-movement-audit',
        loadComponent: () =>
          import('./warehouse/stock-movement-audit/stock-movement-audit.component').then((m) => m.StockMovementAuditComponent)
      },
      {
        path: 'stock-movements',
        loadComponent: () =>
          import('./warehouse/stock-movement-audit/stock-movements/stock-movements.component').then((m) => m.StockMovementsComponent)
      },
      {
        path: 'stock-audits',
        loadComponent: () =>
          import('./warehouse/stock-movement-audit/stock-audits/stock-audits.component').then((m) => m.StockAuditsComponent)
      },
      {
        path: 'wastage-spoilage',
        loadComponent: () =>
          import('./warehouse/wastage-spoilage/wastage-spoilage.component').then((m) => m.WastageSpoilageComponent)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./console/console-shell.component').then((m) => m.ConsoleShellComponent),
    data: { consoleRole: 'admin' },
    children: [
      {
        path: '',
        redirectTo: 'control-tower',
        pathMatch: 'full',
      },
      {
        path: 'control-tower',
        loadComponent: () => import('./console/console-summary-page.component').then((m) => m.ConsoleSummaryPageComponent),
        data: {
          summaryKind: 'admin',
          consoleLabel: 'Admin Console',
          title: 'Control Tower',
          description: 'This will become the admin landing page with control-tower summary cards, refresh metadata, and drilldowns into watch lists.',
        },
      },
      {
        path: 'master-data',
        loadComponent: () => import('./console/console-master-data-page.component').then((m) => m.ConsoleMasterDataPageComponent),
        data: {
          consoleLabel: 'Admin Console',
          title: 'Master Data',
          description: 'Foundational admin entry page for states, cities, and locations, with room to grow into mandi, product, and payment master setup.',
        },
      },
      {
        path: 'console-access',
        loadComponent: () => import('./console/console-access-page.component').then((m) => m.ConsoleAccessPageComponent),
        data: {
          consoleLabel: 'Admin Console',
          title: 'Console Access',
          description: 'Grant and revoke ops and finance console access without leaving the admin workspace.',
        },
      },
      {
        path: 'onboarding-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Admin Console',
          title: 'Onboarding Watch',
          description: 'This page will host buyer KYC, wholesaler license, branch verification, and driver onboarding watchlists.',
        },
      },
      {
        path: 'transport-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Admin Console',
          title: 'Transport Watch',
          description: 'This page will show ride-not-assigned, ride-not-taken, pickup delayed, and delivery overdue operational views.',
        },
      },
      {
        path: 'payment-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Admin Console',
          title: 'Payment Watch',
          description: 'This page will show payment failures, finance exceptions, and payment-linked dispute monitoring.',
        },
      },
    ],
  },
  {
    path: 'ops',
    loadComponent: () => import('./console/console-shell.component').then((m) => m.ConsoleShellComponent),
    data: { consoleRole: 'ops' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./console/console-summary-page.component').then((m) => m.ConsoleSummaryPageComponent),
        data: {
          summaryKind: 'ops',
          consoleLabel: 'Ops Console',
          title: 'Ops Dashboard',
          description: 'This will become the ops landing page for case handling, onboarding review, and transport exception workflows.',
        },
      },
      {
        path: 'onboarding-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Ops Console',
          title: 'Onboarding Watch',
          description: 'This page will give ops a focused onboarding queue for KYC, branch verification, and document review.',
        },
      },
      {
        path: 'transport-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Ops Console',
          title: 'Transport Watch',
          description: 'This page will give ops the daily transport watchlists and time-sensitive operational queue.',
        },
      },
    ],
  },
  {
    path: 'finance',
    loadComponent: () => import('./console/console-shell.component').then((m) => m.ConsoleShellComponent),
    data: { consoleRole: 'finance' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./console/console-summary-page.component').then((m) => m.ConsoleSummaryPageComponent),
        data: {
          summaryKind: 'finance',
          consoleLabel: 'Finance Console',
          title: 'Finance Dashboard',
          description: 'This will become the finance landing page for payment failures, pending execution, and finance-owned dispute work.',
        },
      },
      {
        path: 'payment-watch',
        loadComponent: () => import('./console/console-placeholder.component').then((m) => m.ConsolePlaceholderComponent),
        data: {
          consoleLabel: 'Finance Console',
          title: 'Payment Watch',
          description: 'This page will show payment failures, exception lists, and finance-side follow-up work.',
        },
      },
    ],
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
        path: 'driver-registration',
        loadComponent: () => import('./transport/driver-registration/driver-registration.component').then((m) => m.DriverRegistrationComponent),
      },
      // {
      //   path: 'driver-registration/basic-info',
      //   loadComponent: () => import('./transport/driver-registration/driver-basic-info/driver-basic-info.component').then((m) => m.DriverBasicInfoComponent),
      // },
      // {
      //           path: 'driver-registration/documents',
      //   loadComponent: () => import('./transport/driver-registration/driver-documents/driver-documents.component').then((m) => m.DriverDocumentsComponent),
      // },
      // {
      //           path: 'driver-registration/vehicles',
      //   loadComponent: () => import('./transport/driver-registration/driver-vehicles/driver-vehicles.component').then((m) => m.DriverVehiclesComponent),
      // },
      // {
      //           path: 'driver-registration/insurance',
      //   loadComponent: () => import('./transport/driver-registration/driver-insurance/driver-insurance.component').then((m) => m.DriverInsuranceComponent),
      // },
      // {
      //           path: 'driver-registration/review',
      //   loadComponent: () => import('./transport/driver-registration/review-submit/review-submit.component').then((m) => m.ReviewSubmitComponent),
      // },
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
        path: 'pickup-orders',
        loadComponent: () => import('./transport/pickup-orders/pickup-orders.component').then((m) => m.PickupOrdersComponent),
      },
      //     {
      // path: 'delivery-confirmation/:jobId/:orderId',
      //       loadComponent: () => import('./transport/delivery-confirmation/delivery-confirmation.component').then((m) => m.DeliveryConfirmationComponent),
      //     },
      {
        path: 'delivery-confirmation/:jobId',
        loadComponent: () => import('./transport/delivery-confirmation/delivery-confirmation.component').then((m) => m.DeliveryConfirmationComponent),
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
        path: 'report-issue/:orderId',
        loadComponent: () => import('./transport/disputes/report-issue/report-issue.component').then((m) => m.ReportIssueComponent),
      },
      {
        path: 'issue-submitted/:id',
        loadComponent: () => import('./transport/disputes/issue-submitted/issue-submitted.component').then((m) => m.IssueSubmittedComponent),
      },
      {
        path: 'my-issues',
        loadComponent: () => import('./transport/disputes/my-issues/my-issues.component').then((m) => m.MyIssuesComponent),
      },
      {
        path: 'issue-detail/:id',
        loadComponent: () => import('./transport/disputes/issue-detail/issue-detail.component').then((m) => m.IssueDetailComponent),
      },
      {
        path: 'dispute-management',
        redirectTo: 'my-issues',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () => import('./transport/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./transport/settings/settings.page').then((m) => m.SettingsPage),
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
      },
      {
        path: 'customer-chat',
        loadComponent: () => import('./transport/customer-chat/customer-chat.component').then((m) => m.CustomerChatComponent),
      },
      {
        path: 'location-selection',
        loadComponent: () => import('./transport/location-selection/location-selection.component').then((m) => m.LocationSelectionModalComponent),
      }
    ]
  }
];

const publicTopLevelPaths = new Set(['', 'login', 'verify-email']);

const wholesalerRoleGuard = requireRolesGuard(['wholesaler']);
const buyerRoleGuard = requireRolesGuard(['retailer']);
const transportRoleGuard = requireRolesGuard(['driver']);
const adminRoleGuard = requireRolesGuard(['admin']);
const opsRoleGuard = requireRolesGuard(['ops_l1']);
const financeRoleGuard = requireRolesGuard(['finance']);

const getRoleGuardByPrefix = (path?: string): CanActivateFn | null => {
  if (!path) {
    return null;
  }

  if (path === 'admin' || path.startsWith('admin/')) {
    return adminRoleGuard;
  }

  if (path === 'ops' || path.startsWith('ops/')) {
    return opsRoleGuard;
  }

  if (path === 'finance' || path.startsWith('finance/')) {
    return financeRoleGuard;
  }

  if (path === 'buyer' || path.startsWith('buyer/')) {
    return buyerRoleGuard;
  }

  if (path === 'transport' || path.startsWith('transport/')) {
    return transportRoleGuard;
  }

  if (path.startsWith('wholesaler/')) {
    return wholesalerRoleGuard;
  }

  return null;
};

export const routes: Routes = appRoutes.map((route) => {
  if (publicTopLevelPaths.has(route.path ?? '')) {
    return route;
  }

  const roleGuard = getRoleGuardByPrefix(route.path);
  const existingCanActivate = route.canActivate ?? [];

  return {
    ...route,
    canActivate: roleGuard
      ? [authGuard, roleGuard, ...existingCanActivate]
      : [authGuard, ...existingCanActivate],
  };
});
