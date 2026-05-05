package checkout

import "time"

const (
	StatusCreated         = "created"
	StatusPaymentPending  = "payment_pending"
	StatusPaymentFailed   = "payment_failed"
	StatusPaymentExpired  = "payment_expired"
	StatusPaymentCaptured = "payment_captured"
	StatusCancelled       = "cancelled"
	StatusMaterialized    = "materialized"
)

type CheckoutSession struct {
	CheckoutSessionID int64      `json:"checkout_session_id"`
	RetailerID        int64      `json:"retailer_id"`
	RetailerUserID    int        `json:"retailer_user_id"`
	RetailerBranchID  int        `json:"retailer_branch_id"`
	SourceCartDate    *time.Time `json:"source_cart_date,omitempty"`

	Currency       string  `json:"currency"`
	GoodsAmount    float64 `json:"goods_amount"`
	DeliveryAmount float64 `json:"delivery_amount"`
	GrossAmount    float64 `json:"gross_amount"`

	DeliveryAddress string `json:"delivery_address"`
	Status          string `json:"status"`
	IdempotencyKey  string `json:"idempotency_key"`
	RequestHash     string `json:"request_hash"`

	CurrentPaymentIntentID *int64     `json:"current_payment_intent_id,omitempty"`
	PaymentStartedAt       *time.Time `json:"payment_started_at,omitempty"`
	PaymentCapturedAt      *time.Time `json:"payment_captured_at,omitempty"`
	PaymentFailedAt        *time.Time `json:"payment_failed_at,omitempty"`
	ExpiredAt              *time.Time `json:"expired_at,omitempty"`
	CancelledAt            *time.Time `json:"cancelled_at,omitempty"`
	MaterializedAt         *time.Time `json:"materialized_at,omitempty"`

	CancelReason            *string   `json:"cancel_reason,omitempty"`
	LastPaymentErrorCode    *string   `json:"last_payment_error_code,omitempty"`
	LastPaymentErrorMessage *string   `json:"last_payment_error_message,omitempty"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

type CheckoutSessionItem struct {
	CheckoutSessionItemID int64 `json:"checkout_session_item_id"`
	CheckoutSessionID     int64 `json:"checkout_session_id"`

	SelectedItemID      *int64 `json:"selected_item_id,omitempty"`
	WholesellerID       int    `json:"wholeseller_id"`
	WholesellerBranchID *int64 `json:"wholeseller_branch_id,omitempty"`
	ProductID           int64  `json:"product_id"`
	UnitID              int    `json:"unit_id"`

	ProductNameSnapshot *string `json:"product_name_snapshot,omitempty"`
	UnitNameSnapshot    *string `json:"unit_name_snapshot,omitempty"`
	ImagePathSnapshot   *string `json:"image_path_snapshot,omitempty"`

	Quantity       float64 `json:"quantity"`
	UnitPrice      float64 `json:"unit_price"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`

	LineGoodsAmount float64 `json:"line_goods_amount"`
	LineFinalAmount float64 `json:"line_final_amount"`
	SortOrder       int     `json:"sort_order"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CheckoutSessionOrder struct {
	CheckoutSessionOrderID int64     `json:"checkout_session_order_id"`
	CheckoutSessionID      int64     `json:"checkout_session_id"`
	OrderID                int64     `json:"order_id"`
	WholesellerID          int       `json:"wholeseller_id"`
	CreatedAt              time.Time `json:"created_at"`
}

type CreateCheckoutSessionParams struct {
	RetailerID       int64
	RetailerUserID   int
	RetailerBranchID int
	SourceCartDate   *time.Time
	Currency         string
	GoodsAmount      float64
	DeliveryAmount   float64
	GrossAmount      float64
	DeliveryAddress  string
	Status           string
	IdempotencyKey   string
	RequestHash      string
}

type CreateCheckoutSessionItemParams struct {
	CheckoutSessionID   int64
	SelectedItemID      *int64
	WholesellerID       int
	WholesellerBranchID *int64
	ProductID           int64
	UnitID              int
	ProductNameSnapshot *string
	UnitNameSnapshot    *string
	ImagePathSnapshot   *string
	Quantity            float64
	UnitPrice           float64
	DiscountAmount      float64
	TaxAmount           float64
	LineGoodsAmount     float64
	LineFinalAmount     float64
	SortOrder           int
}

type CreateCheckoutSessionOrderParams struct {
	CheckoutSessionID int64
	OrderID           int64
	WholesellerID     int
}
