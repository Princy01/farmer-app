package banking

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type MerchantCredentials struct {
	MerchantID  string `json:"merchant_id"`
	MerchantKey string `json:"merchant_key"`
}

type InitiatePaymentRequest struct {
	MerchantID string  `json:"merchant_id"`
	OrderID    string  `json:"order_id"`
	Amount     float64 `json:"amount" validate:"required,gt=0"`
	Checksum   string  `json:"checksum"`
}

type InitiatePaymentResponseData struct {
	PaymentID         string  `json:"payment_id"`
	Status            string  `json:"status"`
	PaymentURL        string  `json:"payment_url"` // We need to tell the frontend to redirect to this URL on a new tab
	Checksum          string  `json:"checksum"`
	Message           string  `json:"message"`
	OrderID           string  `json:"order_id"`
	CheckoutSessionID *int64  `json:"checkout_session_id,omitempty"`
	PaymentIntentID   *int64  `json:"payment_intent_id,omitempty"`
	GrossAmount       float64 `json:"gross_amount,omitempty"`
}

type InitiatePaymentResponse struct {
	Success bool                        `json:"success"`
	Message string                      `json:"message"`
	Data    InitiatePaymentResponseData `json:"data"`
}

type PaymentOrder struct {
	ID          int     `db:"id" json:"id"`
	UserID      int     `db:"user_id" json:"user_id"`
	OrderID     string  `db:"order_id" json:"order_id"`
	Amount      float64 `db:"amount" json:"amount"`
	Currency    string  `db:"currency" json:"currency"`
	Description string  `db:"description" json:"description,omitempty"`

	// Gateway fields
	PaymentID       *string `db:"payment_id" json:"payment_id,omitempty"`
	TransactionID   *string `db:"transaction_id" json:"transaction_id,omitempty"`
	GatewayChecksum *string `db:"gateway_checksum" json:"gateway_checksum,omitempty"`

	// Status
	Status          string  `db:"status" json:"status"`
	PaymentMethod   *string `db:"payment_method" json:"payment_method,omitempty"`
	GatewayResponse JSONMap `db:"gateway_response" json:"gateway_response,omitempty"`

	// Timestamps
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
	PaidAt    *time.Time `db:"paid_at" json:"paid_at,omitempty"`
}

type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, j)
}

type PaymentOrderHistory struct {
	ID        int       `db:"id" json:"id"`
	OrderID   string    `db:"order_id" json:"order_id"`
	OldStatus *string   `db:"old_status" json:"old_status,omitempty"`
	NewStatus string    `db:"new_status" json:"new_status"`
	Remarks   *string   `db:"remarks" json:"remarks,omitempty"`
	ChangedAt time.Time `db:"changed_at" json:"changed_at"`
}

const (
	PaymentStatusPending    = "pending"
	PaymentStatusInitiated  = "initiated"
	PaymentStatusProcessing = "processing"
	PaymentStatusSuccess    = "success"
	PaymentStatusFailed     = "failed"
	PaymentStatusCancelled  = "cancelled"
)

type CreatePaymentOrderRequest struct {
	UserID            int     `json:"user_id,omitempty"`
	CheckoutSessionID int64   `json:"checkout_session_id,omitempty"`
	Amount            float64 `json:"amount" validate:"required,gt=0"`
	Currency          string  `json:"currency"`
	Description       string  `json:"description"`
	ProviderCode      string  `json:"provider_code,omitempty"`
	PaymentMethod     string  `json:"payment_method,omitempty"`
}

type PaymentStatusResponse struct {
	OrderID           string     `json:"order_id"`
	CheckoutSessionID *int64     `json:"checkout_session_id,omitempty"`
	PaymentIntentID   *int64     `json:"payment_intent_id,omitempty"`
	PaymentID         *string    `json:"payment_id,omitempty"`
	Status            string     `json:"status"`
	Amount            float64    `json:"amount"`
	OrderIDs          []int64    `json:"order_ids,omitempty"`
	CheckoutStatus    *string    `json:"checkout_status,omitempty"`
	MaterializedAt    *time.Time `json:"materialized_at,omitempty"`
	TransactionID     *string    `json:"transaction_id,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	PaidAt            *time.Time `json:"paid_at,omitempty"`
	FailureReason     *string    `json:"failure_reason,omitempty"`
}

type PaymentCallback struct {
	PaymentID     *string `json:"payment_id,omitempty"`
	OrderID       string  `json:"order_id"`
	Amount        string  `json:"amount"`
	Status        string  `json:"status"`
	TransactionID *string `json:"transaction_id,omitempty"`
	EventID       *string `json:"event_id,omitempty"`
	Checksum      string  `json:"checksum"`
	Timestamp     string  `json:"timestamp"`
	MerchantID    string  `json:"merchant_id"`
	GatewayID     string  `json:"gateway_id"`
	RawBody       []byte  `json:"-"`
}
