package models

import "time"

type PagingMeta struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalCount int64 `json:"total_count"`
}

type OnboardingWatchSummary struct {
	DashboardRefreshMeta
	PendingBranchVerification         int64 `json:"pending_branch_verification"`
	PendingBranchDocuments            int64 `json:"pending_branch_documents"`
	RejectedBranchDocuments           int64 `json:"rejected_branch_documents"`
	ManualReviewBranches              int64 `json:"manual_review_branches"`
	PendingBuyerKYC                   int64 `json:"pending_buyer_kyc"`
	RejectedBuyerKYC                  int64 `json:"rejected_buyer_kyc"`
	PendingWholesalerLicense          int64 `json:"pending_wholesaler_license"`
	RejectedWholesalerLicense         int64 `json:"rejected_wholesaler_license"`
	PendingDriverDocuments            int64 `json:"pending_driver_documents"`
	PendingDriverPhysicalVerification int64 `json:"pending_driver_physical_verification"`
	PendingDriverReview               int64 `json:"pending_driver_review"`
	RejectedDrivers                   int64 `json:"rejected_drivers"`
	TotalPending                      int64 `json:"total_pending"`
}

type OnboardingWatchItem struct {
	WatchType      string     `json:"watch_type"`
	EntityID       int64      `json:"entity_id"`
	DisplayName    string     `json:"display_name"`
	SecondaryLabel string     `json:"secondary_label,omitempty"`
	ContactNumber  string     `json:"contact_number,omitempty"`
	CityName       string     `json:"city_name,omitempty"`
	StateName      string     `json:"state_name,omitempty"`
	Status         string     `json:"status"`
	CaptureSource  string     `json:"capture_source,omitempty"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}

type OnboardingWatchListResponse struct {
	PagingMeta
	Items []OnboardingWatchItem `json:"items"`
}

type TransportWatchSummary struct {
	DashboardRefreshMeta
	RideNotAssigned int64 `json:"ride_not_assigned"`
	RideNotTaken    int64 `json:"ride_not_taken"`
	PickupDelayed   int64 `json:"pickup_delayed"`
	DeliveryOverdue int64 `json:"delivery_overdue"`
	TotalExceptions int64 `json:"total_exceptions"`
}

type TransportWatchItem struct {
	WatchType          string     `json:"watch_type"`
	JobID              int64      `json:"job_id"`
	OrderIDs           []int64    `json:"order_ids"`
	JobStatus          string     `json:"job_status"`
	DeliveryStatus     string     `json:"delivery_status,omitempty"`
	DriverID           *int64     `json:"driver_id,omitempty"`
	RequestedDate      *time.Time `json:"requested_date,omitempty"`
	ExpectedDeliveryAt *time.Time `json:"expected_delivery_at,omitempty"`
	AcceptedAt         *time.Time `json:"accepted_at,omitempty"`
	PickupConfirmedAt  *time.Time `json:"pickup_confirmed_at,omitempty"`
	BasePrice          float64    `json:"base_price"`
}

type TransportWatchListResponse struct {
	PagingMeta
	Items []TransportWatchItem `json:"items"`
}

type PaymentWatchSummary struct {
	DashboardRefreshMeta
	FailedOrders          int64 `json:"failed_orders"`
	FailureEvents         int64 `json:"failure_events"`
	RecentFailures24Hours int64 `json:"recent_failures_24_hours"`
	OpenPaymentDisputes   int64 `json:"open_payment_disputes"`
	PendingExecution      int64 `json:"pending_execution"`
}

type PaymentWatchItem struct {
	OrderID            int64     `json:"order_id"`
	RetailerID         *int64    `json:"retailer_id,omitempty"`
	OrderAmount        float64   `json:"order_amount"`
	PaymentID          *string   `json:"payment_id,omitempty"`
	Gateway            *string   `json:"gateway,omitempty"`
	LatestErrorCode    *string   `json:"latest_error_code,omitempty"`
	LatestErrorMessage *string   `json:"latest_error_message,omitempty"`
	LatestErrorAt      time.Time `json:"latest_error_at"`
	ErrorCount         int64     `json:"error_count"`
}

type PaymentWatchListResponse struct {
	PagingMeta
	Items []PaymentWatchItem `json:"items"`
}
