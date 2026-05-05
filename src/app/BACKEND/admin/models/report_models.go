package models

import "time"

type DashboardSummary struct {
	TotalBusinesses    int64   `json:"total_businesses"`
	TotalBranches      int64   `json:"total_branches"`
	ActiveBranches     int64   `json:"active_branches"`
	TotalOrders        int64   `json:"total_orders"`
	PendingOrders      int64   `json:"pending_orders"`
	TotalTransportJobs int64   `json:"total_transport_jobs"`
	OpenTransportJobs  int64   `json:"open_transport_jobs"`
	TotalRevenue       float64 `json:"total_revenue"`
	MonthlyRevenue     float64 `json:"monthly_revenue"`
}

type DashboardRefreshMeta struct {
	ServerTime              time.Time `json:"server_time"`
	RefreshedAt             time.Time `json:"refreshed_at"`
	NextRefreshAfterSeconds int       `json:"next_refresh_after_seconds"`
}

type ControlTowerSummary struct {
	DashboardRefreshMeta
	DashboardSummary
	TotalUsers                int64   `json:"total_users"`
	ActiveUsers               int64   `json:"active_users"`
	OpenDisputes              int64   `json:"open_disputes"`
	OverdueDisputes           int64   `json:"overdue_disputes"`
	PendingBranchVerification int64   `json:"pending_branch_verification"`
	PendingDriverOnboarding   int64   `json:"pending_driver_onboarding"`
	PendingBuyerKYC           int64   `json:"pending_buyer_kyc"`
	PendingWholesalerLicense  int64   `json:"pending_wholesaler_license"`
	LargeOrders               int64   `json:"large_orders"`
	LargeOrderThreshold       float64 `json:"large_order_threshold"`
}

type OpsDashboardSummary struct {
	DashboardRefreshMeta
	TotalOpen                 int64 `json:"total_open"`
	AwaitingEvidence          int64 `json:"awaiting_evidence"`
	UnderReview               int64 `json:"under_review"`
	PendingExternalAction     int64 `json:"pending_external_action"`
	PendingExecution          int64 `json:"pending_execution"`
	Overdue                   int64 `json:"overdue"`
	DueToday                  int64 `json:"due_today"`
	DueSoon                   int64 `json:"due_soon"`
	FirstResponseBreached     int64 `json:"first_response_breached"`
	ResolutionBreached        int64 `json:"resolution_breached"`
	PendingBranchVerification int64 `json:"pending_branch_verification"`
	PendingDriverOnboarding   int64 `json:"pending_driver_onboarding"`
	PendingBuyerKYC           int64 `json:"pending_buyer_kyc"`
	PendingWholesalerLicense  int64 `json:"pending_wholesaler_license"`
	RideNotAssigned           int64 `json:"ride_not_assigned"`
	RideNotTaken              int64 `json:"ride_not_taken"`
	PickupDelayed             int64 `json:"pickup_delayed"`
	DeliveryOverdue           int64 `json:"delivery_overdue"`
}

type FinanceDashboardSummary struct {
	DashboardRefreshMeta
	TotalOpen           int64   `json:"total_open"`
	PendingExecution    int64   `json:"pending_execution"`
	Overdue             int64   `json:"overdue"`
	DueToday            int64   `json:"due_today"`
	DueSoon             int64   `json:"due_soon"`
	PaymentFailures     int64   `json:"payment_failures"`
	HighValueCases      int64   `json:"high_value_cases"`
	TotalRevenue        float64 `json:"total_revenue"`
	MonthlyRevenue      float64 `json:"monthly_revenue"`
	LargeOrders         int64   `json:"large_orders"`
	LargeOrderThreshold float64 `json:"large_order_threshold"`
}

type TransactionReport struct {
	Date       time.Time `json:"date"`
	OrderCount int64     `json:"order_count"`
}

type RevenueReport struct {
	Date    time.Time `json:"date"`
	Revenue string    `json:"revenue"`
}

type DisputeReport struct {
	Date         time.Time `json:"date"`
	DisputeCount int64     `json:"dispute_count"`
}

type StuckOrderReport struct {
	OrderID     int64 `json:"order_id"`
	OrderStatus int   `json:"order_status"`
	DaysStuck   int64 `json:"days_stuck"`
	RetailerID  int64 `json:"retailer_id"`
}

type TopDisputedBusiness struct {
	BusinessID   int64 `json:"business_id"`
	DisputeCount int64 `json:"dispute_count"`
}
