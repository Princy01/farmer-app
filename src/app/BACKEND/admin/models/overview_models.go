package models

import "time"

type EntityDisputeOverview struct {
	TotalDisputes       int64 `json:"total_disputes"`
	OpenDisputes        int64 `json:"open_disputes"`
	SuspectedFraudCases int64 `json:"suspected_fraud_cases"`
	DeliveryMismatch    int64 `json:"delivery_mismatch"`
	NoShowIssues        int64 `json:"no_show_issues"`
	PaymentIssues       int64 `json:"payment_issues"`
	FraudClaimIssues    int64 `json:"fraud_claim_issues"`
}

type EntityRatingOverview struct {
	Available      bool    `json:"available"`
	Score          float64 `json:"score"`
	MaxScore       float64 `json:"max_score"`
	Band           string  `json:"band"`
	Confidence     string  `json:"confidence"`
	RatedEvents    int64   `json:"rated_events"`
	NegativeEvents int64   `json:"negative_events"`
	IssueRate      float64 `json:"issue_rate"`
}

type TransporterOverview struct {
	DashboardRefreshMeta
	Profile      TransporterProfileOverview      `json:"profile"`
	Verification TransporterVerificationOverview `json:"verification"`
	Vehicle      TransporterVehicleOverview      `json:"vehicle"`
	Performance  TransporterPerformanceOverview  `json:"performance"`
	Disputes     EntityDisputeOverview           `json:"disputes"`
	Issues       TransporterIssueOverview        `json:"issues"`
	Rating       EntityRatingOverview            `json:"rating"`
	PeerRating   PeerRatingOverview              `json:"peer_rating"`
}

type TransporterProfileOverview struct {
	DriverID       int64      `json:"driver_id"`
	FullName       string     `json:"full_name"`
	PhoneNumber    string     `json:"phone_number"`
	AlternatePhone *string    `json:"alternate_phone,omitempty"`
	Email          *string    `json:"email,omitempty"`
	Age            *int       `json:"age,omitempty"`
	CityOfOps      string     `json:"city_of_ops,omitempty"`
	Address        string     `json:"address,omitempty"`
	DateOfJoining  *time.Time `json:"date_of_joining,omitempty"`
	ActiveStatus   bool       `json:"active_status"`
	DriverStatus   string     `json:"driver_status,omitempty"`
	ProfileImage   *string    `json:"profile_image,omitempty"`
}

type TransporterVerificationOverview struct {
	LicenceNumber              string     `json:"licence_number"`
	LicenceType                string     `json:"licence_type"`
	LicenceIssuedDate          time.Time  `json:"licence_issued_date"`
	LicenceExpiryDate          time.Time  `json:"licence_expiry_date"`
	LicenceExpiringSoon        bool       `json:"licence_expiring_soon"`
	MaskedPAN                  string     `json:"masked_pan,omitempty"`
	MaskedAadhaar              string     `json:"masked_aadhaar,omitempty"`
	DocumentVerificationStatus string     `json:"document_verification_status"`
	DocumentVerifiedAt         *time.Time `json:"document_verified_at,omitempty"`
	DocumentVerifiedByUserID   *int64     `json:"document_verified_by_user_id,omitempty"`
	DocumentVerificationNotes  string     `json:"document_verification_notes,omitempty"`
	PhysicalVerificationStatus string     `json:"physical_verification_status"`
	PhysicalVerifiedAt         *time.Time `json:"physical_verified_at,omitempty"`
	PhysicalVerifiedByUserID   *int64     `json:"physical_verified_by_user_id,omitempty"`
	PhysicalVerificationNotes  string     `json:"physical_verification_notes,omitempty"`
	OnboardingStatus           string     `json:"onboarding_status"`
	RegistrationComplete       bool       `json:"registration_complete"`
	CanActOnLiveJobs           bool       `json:"can_act_on_live_jobs"`
	OnboardingVerifiedAt       *time.Time `json:"onboarding_verified_at,omitempty"`
	OnboardingVerifiedByUserID *int64     `json:"onboarding_verified_by_user_id,omitempty"`
	VerificationNotes          string     `json:"verification_notes,omitempty"`
}

type TransporterVehicleOverview struct {
	VehicleID     *int64     `json:"vehicle_id,omitempty"`
	VehicleNumber *string    `json:"vehicle_number,omitempty"`
	VehicleState  *string    `json:"vehicle_state,omitempty"`
	VehicleTypeID *int       `json:"vehicle_type_id,omitempty"`
	VehicleMake   *string    `json:"vehicle_make,omitempty"`
	VehicleModel  *string    `json:"vehicle_model,omitempty"`
	RegDate       *time.Time `json:"registration_date,omitempty"`
	LoadCapacity  *float64   `json:"load_capacity,omitempty"`
	FuelType      *string    `json:"fuel_type,omitempty"`
	RCDocument    *string    `json:"rc_document,omitempty"`
	KMSTravelled  *string    `json:"kms_travelled,omitempty"`
}

type TransporterPerformanceOverview struct {
	TripsCompleted int64   `json:"trips_completed"`
	ActiveJobs     int64   `json:"active_jobs"`
	MoneyEarned    float64 `json:"money_earned"`
}

type TransporterIssueOverview struct {
	LoadMismatchIssues            int64 `json:"load_mismatch_issues"`
	TimingIssues                  int64 `json:"timing_issues"`
	NoShowIssues                  int64 `json:"no_show_issues"`
	VehicleMismatchIssues         int64 `json:"vehicle_mismatch_issues"`
	AccidentIssues                int64 `json:"accident_issues"`
	DocumentIssues                int64 `json:"document_issues"`
	DamagedAtPickupIssues         int64 `json:"damaged_at_pickup_issues"`
	CustomerRefusedDeliveryIssues int64 `json:"customer_refused_delivery_issues"`
	PODConfirmationIssues         int64 `json:"pod_confirmation_issues"`
	RideIssues                    int64 `json:"ride_issues"`
}

type BusinessEntityProfile struct {
	BusinessID         int64      `json:"business_id"`
	OwnerName          string     `json:"owner_name"`
	RegistrationNumber string     `json:"registration_number,omitempty"`
	Address            string     `json:"address,omitempty"`
	CityName           string     `json:"city_name,omitempty"`
	StateName          string     `json:"state_name,omitempty"`
	MobileNumber       string     `json:"mobile_number,omitempty"`
	Email              string     `json:"email,omitempty"`
	GSTNumber          string     `json:"gst_number,omitempty"`
	MaskedPAN          string     `json:"masked_pan,omitempty"`
	DateOfJoining      *time.Time `json:"date_of_joining,omitempty"`
	ActiveStatus       bool       `json:"active_status"`
}

type BusinessVerificationOverview struct {
	MaskedPAN                           string     `json:"masked_pan,omitempty"`
	PANVerificationStatus               string     `json:"pan_verification_status"`
	PANVerifiedAt                       *time.Time `json:"pan_verified_at,omitempty"`
	PANVerifiedByUserID                 *int64     `json:"pan_verified_by_user_id,omitempty"`
	PANVerificationNotes                string     `json:"pan_verification_notes,omitempty"`
	MaskedAadhaar                       string     `json:"masked_aadhaar,omitempty"`
	AadhaarVerificationStatus           string     `json:"aadhaar_verification_status"`
	AadhaarVerifiedAt                   *time.Time `json:"aadhaar_verified_at,omitempty"`
	AadhaarVerifiedByUserID             *int64     `json:"aadhaar_verified_by_user_id,omitempty"`
	AadhaarVerificationNotes            string     `json:"aadhaar_verification_notes,omitempty"`
	GovernmentLicenseNumber             string     `json:"government_license_number,omitempty"`
	GovernmentLicenseVerificationStatus string     `json:"government_license_verification_status"`
	GovernmentLicenseVerifiedAt         *time.Time `json:"government_license_verified_at,omitempty"`
	GovernmentLicenseVerifiedByUserID   *int64     `json:"government_license_verified_by_user_id,omitempty"`
	GovernmentLicenseVerificationNotes  string     `json:"government_license_verification_notes,omitempty"`
	CanPlaceLiveOrders                  bool       `json:"can_place_live_orders"`
}

type BusinessBranchVerificationOverview struct {
	TotalBranches             int64 `json:"total_branches"`
	ActiveBranches            int64 `json:"active_branches"`
	VerifiedBranchDocuments   int64 `json:"verified_branch_documents"`
	PendingBranchDocuments    int64 `json:"pending_branch_documents"`
	RejectedBranchDocuments   int64 `json:"rejected_branch_documents"`
	VerifiedBranches          int64 `json:"verified_branches"`
	PendingBranchVerification int64 `json:"pending_branch_verification"`
	ManualReviewBranches      int64 `json:"manual_review_branches"`
}

type BusinessOrdersOverview struct {
	TotalOrders         int64   `json:"total_orders"`
	TotalAmount         float64 `json:"total_amount"`
	MaxOrderValue       float64 `json:"max_order_value"`
	LargeOrders         int64   `json:"large_orders"`
	LargeOrderThreshold float64 `json:"large_order_threshold"`
}

type BuyerRelationshipOverview struct {
	FrequentWholesalerID     *int64  `json:"frequent_wholesaler_id,omitempty"`
	FrequentWholesalerName   string  `json:"frequent_wholesaler_name,omitempty"`
	FrequentWholesalerOrders int64   `json:"frequent_wholesaler_orders"`
	MaxSpendWholesalerID     *int64  `json:"max_spend_wholesaler_id,omitempty"`
	MaxSpendWholesalerName   string  `json:"max_spend_wholesaler_name,omitempty"`
	MaxSpendWholesalerAmount float64 `json:"max_spend_wholesaler_amount"`
}

type WholesalerRelationshipOverview struct {
	FrequentBuyerID     *int64  `json:"frequent_buyer_id,omitempty"`
	FrequentBuyerName   string  `json:"frequent_buyer_name,omitempty"`
	FrequentBuyerOrders int64   `json:"frequent_buyer_orders"`
	MaxBuyerID          *int64  `json:"max_buyer_id,omitempty"`
	MaxBuyerName        string  `json:"max_buyer_name,omitempty"`
	MaxBuyerAmount      float64 `json:"max_buyer_amount"`
}

type BuyerPaymentOverview struct {
	FailedOrders         int64 `json:"failed_orders"`
	FailureEvents        int64 `json:"failure_events"`
	RecentFailures30Days int64 `json:"recent_failures_30_days"`
}

type BuyerOverview struct {
	DashboardRefreshMeta
	Profile       BusinessEntityProfile              `json:"profile"`
	Verification  BusinessVerificationOverview       `json:"verification"`
	Branches      BusinessBranchVerificationOverview `json:"branches"`
	Orders        BusinessOrdersOverview             `json:"orders"`
	Payments      BuyerPaymentOverview               `json:"payments"`
	Relationships BuyerRelationshipOverview          `json:"relationships"`
	Disputes      EntityDisputeOverview              `json:"disputes"`
	Rating        EntityRatingOverview               `json:"rating"`
	PeerRating    PeerRatingOverview                 `json:"peer_rating"`
}

type WholesalerOverview struct {
	DashboardRefreshMeta
	Profile       BusinessEntityProfile              `json:"profile"`
	Verification  BusinessVerificationOverview       `json:"verification"`
	Branches      BusinessBranchVerificationOverview `json:"branches"`
	Orders        BusinessOrdersOverview             `json:"orders"`
	Relationships WholesalerRelationshipOverview     `json:"relationships"`
	Disputes      EntityDisputeOverview              `json:"disputes"`
	Rating        EntityRatingOverview               `json:"rating"`
	PeerRating    PeerRatingOverview                 `json:"peer_rating"`
}
