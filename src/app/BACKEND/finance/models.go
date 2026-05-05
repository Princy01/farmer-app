package finance

import (
	"encoding/json"
	"time"
)

const (
	PaymentIntentStatusCreated                     = "created"
	PaymentIntentStatusPending                     = "pending"
	PaymentIntentStatusProviderConfirmationPending = "provider_confirmation_pending"
	PaymentIntentStatusCaptured                    = "captured"
	PaymentIntentStatusPartiallyCaptured           = "partially_captured"
	PaymentIntentStatusFailed                      = "failed"
	PaymentIntentStatusCancelled                   = "cancelled"
	PaymentIntentStatusExpired                     = "expired"
)

const (
	SettlementAllocationStatusHold             = "hold"
	SettlementAllocationStatusReadyForRelease  = "ready_for_release"
	SettlementAllocationStatusReleaseInitiated = "release_initiated"
	SettlementAllocationStatusReleased         = "released"
	SettlementAllocationStatusBlocked          = "blocked"
	SettlementAllocationStatusCancelled        = "cancelled"
)

const (
	PaymentAttemptStatusInitiated = "initiated"
	PaymentAttemptStatusPending   = "pending"
	PaymentAttemptStatusCaptured  = "captured"
	PaymentAttemptStatusFailed    = "failed"
	PaymentAttemptStatusCancelled = "cancelled"
	PaymentAttemptStatusExpired   = "expired"
)

const (
	WebhookProcessingStatusReceived          = "received"
	WebhookProcessingStatusProcessing        = "processing"
	WebhookProcessingStatusProcessed         = "processed"
	WebhookProcessingStatusFailed            = "failed"
	WebhookProcessingStatusDuplicate         = "duplicate"
	WebhookProcessingStatusInvalidSignature  = "invalid_signature"
	WebhookProcessingStatusUnmatched         = "unmatched"
	WebhookProcessingStatusReprocessRequired = "reprocess_required"
)

const (
	FinanceExceptionSeverityInfo     = "info"
	FinanceExceptionSeverityWarning  = "warning"
	FinanceExceptionSeverityCritical = "critical"
)

const (
	FinanceExceptionStatusOpen          = "open"
	FinanceExceptionStatusAssigned      = "assigned"
	FinanceExceptionStatusInvestigating = "investigating"
	FinanceExceptionStatusResolved      = "resolved"
	FinanceExceptionStatusIgnored       = "ignored"
)

type PaymentIntent struct {
	PaymentIntentID      int64           `json:"payment_intent_id"`
	CheckoutSessionID    int64           `json:"checkout_session_id"`
	RetailerID           int64           `json:"retailer_id"`
	ProviderCode         string          `json:"provider_code"`
	ProviderOrderID      *string         `json:"provider_order_id,omitempty"`
	ProviderPaymentID    *string         `json:"provider_payment_id,omitempty"`
	Currency             string          `json:"currency"`
	GoodsAmount          float64         `json:"goods_amount"`
	DeliveryAmount       float64         `json:"delivery_amount"`
	PlatformFeeAmount    float64         `json:"platform_fee_amount"`
	HandlingChargeAmount float64         `json:"handling_charge_amount"`
	GrossAmount          float64         `json:"gross_amount"`
	CapturedAmount       float64         `json:"captured_amount"`
	RefundedAmount       float64         `json:"refunded_amount"`
	Status               string          `json:"status"`
	IdempotencyKey       string          `json:"idempotency_key"`
	InitiatedAt          *time.Time      `json:"initiated_at,omitempty"`
	CollectedAt          *time.Time      `json:"collected_at,omitempty"`
	FailedAt             *time.Time      `json:"failed_at,omitempty"`
	LastErrorCode        *string         `json:"last_error_code,omitempty"`
	LastErrorMessage     *string         `json:"last_error_message,omitempty"`
	ProviderResponse     json.RawMessage `json:"provider_response,omitempty"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

type SettlementAllocation struct {
	AllocationID       int64      `json:"allocation_id"`
	PaymentIntentID    int64      `json:"payment_intent_id"`
	CheckoutSessionID  int64      `json:"checkout_session_id"`
	OrderID            *int64     `json:"order_id,omitempty"`
	JobID              *int64     `json:"job_id,omitempty"`
	AllocationType     string     `json:"allocation_type"`
	PayeeType          string     `json:"payee_type"`
	PayeeID            int64      `json:"payee_id"`
	GrossAmount        float64    `json:"gross_amount"`
	FeeAmount          float64    `json:"fee_amount"`
	TaxAmount          float64    `json:"tax_amount"`
	HoldAmount         float64    `json:"hold_amount"`
	NetPayable         float64    `json:"net_payable"`
	Status             string     `json:"status"`
	ReleaseAfter       *time.Time `json:"release_after,omitempty"`
	HoldReason         *string    `json:"hold_reason,omitempty"`
	HoldSource         string     `json:"hold_source"`
	HeldByUserID       *int64     `json:"held_by_user_id,omitempty"`
	HeldAt             *time.Time `json:"held_at,omitempty"`
	ReleaseBlockReason *string    `json:"release_block_reason,omitempty"`
	ReleaseApprovedBy  *int64     `json:"release_approved_by,omitempty"`
	ReleaseApprovedAt  *time.Time `json:"release_approved_at,omitempty"`
	AdminNote          *string    `json:"admin_note,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type PaymentAttempt struct {
	PaymentAttemptID      int64           `json:"payment_attempt_id"`
	PaymentIntentID       int64           `json:"payment_intent_id"`
	ProviderCode          string          `json:"provider_code"`
	ProviderOrderID       *string         `json:"provider_order_id,omitempty"`
	ProviderPaymentID     *string         `json:"provider_payment_id,omitempty"`
	ProviderTransactionID *string         `json:"provider_transaction_id,omitempty"`
	Amount                float64         `json:"amount"`
	Status                string          `json:"status"`
	IdempotencyKey        string          `json:"idempotency_key"`
	RequestPayload        json.RawMessage `json:"request_payload,omitempty"`
	ResponsePayload       json.RawMessage `json:"response_payload,omitempty"`
	LastErrorCode         *string         `json:"last_error_code,omitempty"`
	LastErrorMessage      *string         `json:"last_error_message,omitempty"`
	InitiatedAt           *time.Time      `json:"initiated_at,omitempty"`
	CompletedAt           *time.Time      `json:"completed_at,omitempty"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`
}

type PaymentWebhookEvent struct {
	WebhookEventID    int64           `json:"webhook_event_id"`
	ProviderCode      string          `json:"provider_code"`
	ProviderEventID   string          `json:"provider_event_id"`
	EventType         string          `json:"event_type"`
	PaymentIntentID   *int64          `json:"payment_intent_id,omitempty"`
	CheckoutSessionID *int64          `json:"checkout_session_id,omitempty"`
	ProviderOrderID   *string         `json:"provider_order_id,omitempty"`
	ProviderPaymentID *string         `json:"provider_payment_id,omitempty"`
	RawBody           *string         `json:"raw_body,omitempty"`
	Payload           json.RawMessage `json:"payload,omitempty"`
	SignatureValid    bool            `json:"signature_valid"`
	Processed         bool            `json:"processed"`
	ProcessingStatus  string          `json:"processing_status"`
	ProcessingError   *string         `json:"processing_error,omitempty"`
	ProcessedAt       *time.Time      `json:"processed_at,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type FinanceEvent struct {
	FinanceEventID    int64           `json:"finance_event_id"`
	EntityType        string          `json:"entity_type"`
	EntityID          int64           `json:"entity_id"`
	ParentEntityType  *string         `json:"parent_entity_type,omitempty"`
	ParentEntityID    *int64          `json:"parent_entity_id,omitempty"`
	CheckoutSessionID *int64          `json:"checkout_session_id,omitempty"`
	OrderID           *int64          `json:"order_id,omitempty"`
	PaymentIntentID   *int64          `json:"payment_intent_id,omitempty"`
	EventType         string          `json:"event_type"`
	OldStatus         *string         `json:"old_status,omitempty"`
	NewStatus         *string         `json:"new_status,omitempty"`
	Amount            *float64        `json:"amount,omitempty"`
	Currency          string          `json:"currency"`
	ActorType         string          `json:"actor_type"`
	ActorUserID       *int64          `json:"actor_user_id,omitempty"`
	SourceSystem      string          `json:"source_system"`
	SourceReference   *string         `json:"source_reference,omitempty"`
	Notes             *string         `json:"notes,omitempty"`
	Metadata          json.RawMessage `json:"metadata,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
}

type FinanceException struct {
	ExceptionID       int64      `json:"exception_id"`
	EntityType        string     `json:"entity_type"`
	EntityID          int64      `json:"entity_id"`
	SourceType        string     `json:"source_type"`
	OrderID           *int64     `json:"order_id,omitempty"`
	CheckoutSessionID *int64     `json:"checkout_session_id,omitempty"`
	PaymentIntentID   *int64     `json:"payment_intent_id,omitempty"`
	DisputeCaseID     *int64     `json:"dispute_case_id,omitempty"`
	ReturnID          *int64     `json:"return_id,omitempty"`
	ExceptionType     string     `json:"exception_type"`
	Severity          string     `json:"severity"`
	Status            string     `json:"status"`
	AssignedToUserID  *int64     `json:"assigned_to_user_id,omitempty"`
	ResolutionNote    *string    `json:"resolution_note,omitempty"`
	Metadata          *string    `json:"metadata,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	ResolvedAt        *time.Time `json:"resolved_at,omitempty"`
}

type CreatePaymentIntentParams struct {
	CheckoutSessionID    int64
	RetailerID           int64
	ProviderCode         string
	ProviderOrderID      *string
	ProviderPaymentID    *string
	Currency             string
	GoodsAmount          float64
	DeliveryAmount       float64
	PlatformFeeAmount    float64
	HandlingChargeAmount float64
	GrossAmount          float64
	Status               string
	IdempotencyKey       string
	InitiatedAt          *time.Time
	LastErrorCode        *string
	LastErrorMessage     *string
	ProviderResponse     []byte
}

type UpdatePaymentIntentGatewayInitParams struct {
	PaymentIntentID   int64
	ProviderOrderID   string
	ProviderPaymentID string
	Status            string
	ProviderResponse  []byte
}

type UpdatePaymentIntentFailureParams struct {
	PaymentIntentID   int64
	Status            string
	LastErrorCode     *string
	LastErrorMessage  *string
	ProviderPaymentID *string
	ProviderResponse  []byte
}

type UpdatePaymentIntentCaptureParams struct {
	ProviderCode      string
	ProviderOrderID   string
	ProviderPaymentID *string
	Status            string
	CapturedAmount    float64
	CollectedAt       time.Time
	LastErrorCode     *string
	LastErrorMessage  *string
	ProviderResponse  []byte
}

type CreateSettlementAllocationParams struct {
	PaymentIntentID   int64
	CheckoutSessionID int64
	OrderID           *int64
	JobID             *int64
	AllocationType    string
	PayeeType         string
	PayeeID           int64
	GrossAmount       float64
	FeeAmount         float64
	TaxAmount         float64
	HoldAmount        float64
	NetPayable        float64
	Status            string
	ReleaseAfter      *time.Time
	HoldReason        *string
	HoldSource        string
	HeldByUserID      *int64
	HeldAt            *time.Time
	AdminNote         *string
}

type CreatePaymentAttemptParams struct {
	PaymentIntentID   int64
	ProviderCode      string
	ProviderOrderID   *string
	ProviderPaymentID *string
	Amount            float64
	Status            string
	IdempotencyKey    string
	RequestPayload    []byte
	ResponsePayload   []byte
	LastErrorCode     *string
	LastErrorMessage  *string
	InitiatedAt       *time.Time
	CompletedAt       *time.Time
}

type UpdatePaymentAttemptGatewayInitParams struct {
	PaymentIntentID   int64
	ProviderOrderID   string
	ProviderPaymentID string
	Status            string
	ResponsePayload   []byte
}

type UpdatePaymentAttemptTerminalParams struct {
	ProviderCode          string
	ProviderOrderID       string
	ProviderPaymentID     *string
	ProviderTransactionID *string
	Status                string
	ResponsePayload       []byte
	LastErrorCode         *string
	LastErrorMessage      *string
	CompletedAt           *time.Time
}

type UpdatePaymentAttemptFailureByIntentParams struct {
	PaymentIntentID  int64
	Status           string
	ResponsePayload  []byte
	LastErrorCode    *string
	LastErrorMessage *string
	CompletedAt      *time.Time
}

type CreatePaymentWebhookEventParams struct {
	ProviderCode      string
	ProviderEventID   string
	EventType         string
	PaymentIntentID   *int64
	CheckoutSessionID *int64
	ProviderOrderID   *string
	ProviderPaymentID *string
	RawBody           *string
	Payload           []byte
	SignatureValid    bool
	Processed         bool
	ProcessingStatus  string
	ProcessingError   *string
	ProcessedAt       *time.Time
}

type UpdatePaymentWebhookEventProcessingParams struct {
	WebhookEventID    int64
	PaymentIntentID   *int64
	CheckoutSessionID *int64
	Processed         bool
	ProcessingStatus  string
	ProcessingError   *string
	ProcessedAt       *time.Time
}

type CreateFinanceEventParams struct {
	EntityType        string
	EntityID          int64
	ParentEntityType  *string
	ParentEntityID    *int64
	CheckoutSessionID *int64
	OrderID           *int64
	PaymentIntentID   *int64
	EventType         string
	OldStatus         *string
	NewStatus         *string
	Amount            *float64
	Currency          string
	ActorType         string
	ActorUserID       *int64
	SourceSystem      string
	SourceReference   *string
	Notes             *string
	Metadata          []byte
}

type CreateFinanceExceptionParams struct {
	EntityType        string
	EntityID          int64
	SourceType        string
	OrderID           *int64
	CheckoutSessionID *int64
	PaymentIntentID   *int64
	DisputeCaseID     *int64
	ReturnID          *int64
	ExceptionType     string
	Severity          string
	Status            string
	AssignedToUserID  *int64
	ResolutionNote    *string
	Metadata          *string
}

type UpdateFinanceExceptionStatusParams struct {
	ExceptionID      int64
	Status           string
	AssignedToUserID *int64
	ResolutionNote   *string
	ResolvedAt       *time.Time
}
