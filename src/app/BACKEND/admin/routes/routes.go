package routes

import (
	"farmerapp/internal/admin/handlers"
	"farmerapp/internal/admin/repository"
	"farmerapp/internal/admin/services"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(r fiber.Router) {

	repo := &repository.AdminRepository{}
	service := services.NewAdminService(repo)
	handler := handlers.NewAdminHandler(service)

	// Dashboard summary
	// GET: /admin/dashboard/summary
	// Used for admin overview tiles (orders, disputes, escrows, revenue)
	r.Get("/dashboard/summary", handler.GetDashboardSummary)

	// Control tower summary
	// GET: /admin/control-tower/summary
	// Lightweight admin landing dashboard summary
	r.Get("/control-tower/summary", handler.GetControlTowerSummary)

	// Ops dashboard summary
	// GET: /admin/ops-dashboard/summary
	// Lightweight ops landing dashboard summary
	r.Get("/ops-dashboard/summary", handler.GetOpsDashboardSummary)

	// Finance dashboard summary
	// GET: /admin/finance-dashboard/summary
	// Lightweight finance landing dashboard summary
	r.Get("/finance-dashboard/summary", handler.GetFinanceDashboardSummary)

	// Onboarding watch
	r.Get("/onboarding-watch/summary", handler.GetOnboardingWatchSummary)
	r.Get("/onboarding-watch/list", handler.ListOnboardingWatchItems)
	r.Put("/branches/:id/document-verification", handler.UpdateBranchDocumentVerification)
	r.Put("/branches/:id/location-verification", handler.UpdateBranchLocationVerification)

	// Transport watch
	r.Get("/transport-watch/summary", handler.GetTransportWatchSummary)
	r.Get("/transport-watch/list", handler.ListTransportWatchItems)

	// Payment watch
	r.Get("/payment-watch/summary", handler.GetPaymentWatchSummary)
	r.Get("/payment-watch/list", handler.ListPaymentWatchItems)

	// Finance operations
	r.Get("/finance/allocations", handler.ListFinanceAllocations)
	r.Post("/finance/allocations/:allocation_id/hold", handler.HoldFinanceAllocation)
	r.Post("/finance/allocations/:allocation_id/release", handler.ReleaseFinanceAllocation)
	r.Get("/finance/exceptions", handler.ListFinanceExceptions)
	r.Put("/finance/exceptions/:exception_id/status", handler.UpdateFinanceExceptionStatus)

	// Entity overviews
	r.Get("/buyers/:id/overview", handler.GetBuyerOverview)
	r.Get("/wholesalers/:id/overview", handler.GetWholesalerOverview)
	r.Get("/transporters/:id/overview", handler.GetTransporterOverview)
	r.Put("/buyers/:id/pan-verification", handler.UpdateBuyerPANVerification)
	r.Put("/buyers/:id/aadhaar-verification", handler.UpdateBuyerAadhaarVerification)
	r.Put("/wholesalers/:id/license-verification", handler.UpdateWholesalerLicenseVerification)
	r.Put("/transporters/:id/document-verification", handler.UpdateTransporterDocumentVerification)
	r.Put("/transporters/:id/physical-verification", handler.UpdateTransporterPhysicalVerification)

	// Business management
	// GET: /admin/businesses
	// Returns all registered businesses
	r.Get("/businesses", handler.ListBusinesses)

	// PUT: /admin/businesses/:id/toggle
	// Activate or deactivate a business
	r.Put("/businesses/:id/toggle", handler.ToggleBusinessStatus)

	// Branch management
	// GET: /admin/branches?business_id=7
	// Returns branches, optionally filtered by business
	r.Get("/branches", handler.ListBranches)

	// GET: /admin/branches/branch/:branch_id
	// Returns single branch details
	r.Get("/branches/branch/:branch_id", handler.ListBranches)

	// PUT: /admin/branches/:id/toggle
	// Activate or deactivate a branch
	r.Put("/branches/:id/toggle", handler.ToggleBranchStatus)

	// User management
	// GET: /admin/users
	// Returns all users in the system
	r.Get("/users", handler.ListUsers)

	// PUT: /admin/users/:id/toggle
	// Activate or deactivate a user account
	r.Put("/users/:id/toggle", handler.ToggleUserStatus)

	// Dispute management
	// POST: /admin/disputes
	// Create a new dispute manually from admin
	r.Post("/disputes", handler.CreateDispute)

	// GET: /admin/disputes
	// List disputes (supports status filter: ?status=open)
	r.Get("/disputes", handler.ListDisputes)

	// POST: /admin/disputes/:id/action
	// Add action or change status of a dispute
	r.Post("/disputes/:id/action", handler.AddDisputeAction)

	// Escrow management
	// GET: /admin/escrows
	// Returns all escrow records
	r.Get("/escrows", handler.ListEscrows)

	// PUT: /admin/escrows/:id?status=released|blocked
	// Update escrow status
	r.Put("/escrows/:id", handler.UpdateEscrowStatus)

	// Payment error tracking
	// GET: /admin/payments/errors/:order_id
	// Returns payment failures for a specific order
	r.Get("/payments/errors/:order_id", handler.GetPaymentErrors)

	// Reports
	// GET: /admin/reports/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
	// Daily transaction count report
	r.Get("/reports/transactions", handler.DailyTransactions)

	// GET: /admin/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
	// Daily revenue report from orders
	r.Get("/reports/revenue", handler.DailyRevenue)

	// GET: /admin/reports/disputes?from=YYYY-MM-DD&to=YYYY-MM-DD
	// Daily disputes report
	r.Get("/reports/disputes", handler.DailyDisputes)

	// GET: /admin/reports/escrow-summary
	// Overall escrow totals and status breakdown
	r.Get("/reports/escrow-summary", handler.EscrowSummary)

	// GET: /admin/reports/escrow-aging?days=1
	// Escrows held longer than given days
	r.Get("/reports/escrow-aging", handler.EscrowAging)

	// GET: /admin/reports/stuck-orders?days=1
	// Orders not moving status for given days
	r.Get("/reports/stuck-orders", handler.StuckOrders)

	// GET: /admin/reports/top-disputed-businesses?from=YYYY-MM-DD&to=YYYY-MM-DD
	// Businesses with highest disputes counts
	r.Get("/reports/top-disputed-businesses", handler.TopDisputedBusinesses)

}
