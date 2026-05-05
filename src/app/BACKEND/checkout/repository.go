package checkout

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"farmerapp/go_backend/db"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
)

type queryer interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) CreateCheckoutSession(ctx context.Context, q queryer, params CreateCheckoutSessionParams) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	if params.Currency == "" {
		params.Currency = "INR"
	}
	if params.Status == "" {
		params.Status = StatusCreated
	}

	query := `
		INSERT INTO business_schema.checkout_sessions (
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash
		)
		VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12
		)
		RETURNING
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
	`

	var session CheckoutSession
	if err := scanCheckoutSession(q.QueryRow(
		ctx,
		query,
		params.RetailerID,
		params.RetailerUserID,
		params.RetailerBranchID,
		params.SourceCartDate,
		params.Currency,
		params.GoodsAmount,
		params.DeliveryAmount,
		params.GrossAmount,
		params.DeliveryAddress,
		params.Status,
		params.IdempotencyKey,
		params.RequestHash,
	), &session); err != nil {
		return nil, fmt.Errorf("create checkout session: %w", err)
	}

	return &session, nil
}

func (r *Repository) AddCheckoutSessionItem(ctx context.Context, q queryer, params CreateCheckoutSessionItemParams) (*CheckoutSessionItem, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		INSERT INTO business_schema.checkout_session_items (
			checkout_session_id,
			selected_item_id,
			wholeseller_id,
			wholeseller_branch_id,
			product_id,
			unit_id,
			product_name_snapshot,
			unit_name_snapshot,
			image_path_snapshot,
			quantity,
			unit_price,
			discount_amount,
			tax_amount,
			line_goods_amount,
			line_final_amount,
			sort_order
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14, $15, $16
		)
		RETURNING
			checkout_session_item_id,
			checkout_session_id,
			selected_item_id,
			wholeseller_id,
			wholeseller_branch_id,
			product_id,
			unit_id,
			product_name_snapshot,
			unit_name_snapshot,
			image_path_snapshot,
			quantity,
			unit_price,
			discount_amount,
			tax_amount,
			line_goods_amount,
			line_final_amount,
			sort_order,
			created_at,
			updated_at
	`

	var item CheckoutSessionItem
	if err := scanCheckoutSessionItem(q.QueryRow(
		ctx,
		query,
		params.CheckoutSessionID,
		params.SelectedItemID,
		params.WholesellerID,
		params.WholesellerBranchID,
		params.ProductID,
		params.UnitID,
		params.ProductNameSnapshot,
		params.UnitNameSnapshot,
		params.ImagePathSnapshot,
		params.Quantity,
		params.UnitPrice,
		params.DiscountAmount,
		params.TaxAmount,
		params.LineGoodsAmount,
		params.LineFinalAmount,
		params.SortOrder,
	), &item); err != nil {
		return nil, fmt.Errorf("add checkout session item: %w", err)
	}

	return &item, nil
}

func (r *Repository) GetCheckoutSessionByID(ctx context.Context, q queryer, checkoutSessionID int64) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
		FROM business_schema.checkout_sessions
		WHERE checkout_session_id = $1
	`

	var session CheckoutSession
	if err := scanCheckoutSession(q.QueryRow(ctx, query, checkoutSessionID), &session); err != nil {
		return nil, fmt.Errorf("get checkout session by id: %w", err)
	}

	return &session, nil
}

func (r *Repository) ListCheckoutSessionItems(ctx context.Context, q queryer, checkoutSessionID int64) ([]CheckoutSessionItem, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			checkout_session_item_id,
			checkout_session_id,
			selected_item_id,
			wholeseller_id,
			wholeseller_branch_id,
			product_id,
			unit_id,
			product_name_snapshot,
			unit_name_snapshot,
			image_path_snapshot,
			quantity,
			unit_price,
			discount_amount,
			tax_amount,
			line_goods_amount,
			line_final_amount,
			sort_order,
			created_at,
			updated_at
		FROM business_schema.checkout_session_items
		WHERE checkout_session_id = $1
		ORDER BY sort_order ASC, checkout_session_item_id ASC
	`

	rows, err := q.Query(ctx, query, checkoutSessionID)
	if err != nil {
		return nil, fmt.Errorf("list checkout session items: %w", err)
	}
	defer rows.Close()

	var items []CheckoutSessionItem
	for rows.Next() {
		var item CheckoutSessionItem
		if err := scanCheckoutSessionItem(rows, &item); err != nil {
			return nil, fmt.Errorf("scan checkout session item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate checkout session items: %w", err)
	}

	return items, nil
}

func (r *Repository) AddCheckoutSessionOrder(ctx context.Context, q queryer, params CreateCheckoutSessionOrderParams) (*CheckoutSessionOrder, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		INSERT INTO business_schema.checkout_session_orders (
			checkout_session_id,
			order_id,
			wholeseller_id
		)
		VALUES ($1, $2, $3)
		RETURNING
			checkout_session_order_id,
			checkout_session_id,
			order_id,
			wholeseller_id,
			created_at
	`

	var checkoutOrder CheckoutSessionOrder
	if err := scanCheckoutSessionOrder(
		q.QueryRow(ctx, query, params.CheckoutSessionID, params.OrderID, params.WholesellerID),
		&checkoutOrder,
	); err != nil {
		return nil, fmt.Errorf("add checkout session order: %w", err)
	}

	return &checkoutOrder, nil
}

func (r *Repository) ListCheckoutSessionOrders(ctx context.Context, q queryer, checkoutSessionID int64) ([]CheckoutSessionOrder, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			checkout_session_order_id,
			checkout_session_id,
			order_id,
			wholeseller_id,
			created_at
		FROM business_schema.checkout_session_orders
		WHERE checkout_session_id = $1
		ORDER BY checkout_session_order_id ASC
	`

	rows, err := q.Query(ctx, query, checkoutSessionID)
	if err != nil {
		return nil, fmt.Errorf("list checkout session orders: %w", err)
	}
	defer rows.Close()

	var orders []CheckoutSessionOrder
	for rows.Next() {
		var checkoutOrder CheckoutSessionOrder
		if err := scanCheckoutSessionOrder(rows, &checkoutOrder); err != nil {
			return nil, fmt.Errorf("scan checkout session order: %w", err)
		}
		orders = append(orders, checkoutOrder)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate checkout session orders: %w", err)
	}

	return orders, nil
}

func (r *Repository) ListRetailerCheckoutSessionsByStatus(ctx context.Context, q queryer, retailerID int64, statuses []string, limit int) ([]CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
		FROM business_schema.checkout_sessions
		WHERE retailer_id = $1
		  AND status = ANY($2)
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := q.Query(ctx, query, retailerID, statuses, limit)
	if err != nil {
		return nil, fmt.Errorf("list retailer checkout sessions by status: %w", err)
	}
	defer rows.Close()

	var sessions []CheckoutSession
	for rows.Next() {
		var session CheckoutSession
		if err := scanCheckoutSession(rows, &session); err != nil {
			return nil, fmt.Errorf("scan checkout session: %w", err)
		}
		sessions = append(sessions, session)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate checkout sessions: %w", err)
	}

	return sessions, nil
}

func (r *Repository) ExpireStaleCheckoutSessions(ctx context.Context, q queryer, cutoff time.Time) (int64, error) {
	if q == nil {
		q = db.Pool
	}

	tag, err := q.Exec(ctx, `
		UPDATE business_schema.checkout_sessions
		SET
			status = $1,
			payment_failed_at = COALESCE(payment_failed_at, NOW()),
			last_payment_error_code = COALESCE(last_payment_error_code, $2),
			last_payment_error_message = COALESCE(last_payment_error_message, $3),
			updated_at = NOW()
		WHERE status = ANY($4)
		  AND payment_captured_at IS NULL
		  AND materialized_at IS NULL
		  AND COALESCE(payment_started_at, created_at) <= $5
	`,
		StatusPaymentFailed,
		"timeout",
		"Payment was not completed within the allowed time window",
		[]string{StatusCreated, StatusPaymentPending},
		cutoff,
	)
	if err != nil {
		return 0, fmt.Errorf("expire stale checkout sessions: %w", err)
	}

	return tag.RowsAffected(), nil
}

func (r *Repository) MarkCheckoutSessionPaymentPending(ctx context.Context, q queryer, checkoutSessionID, paymentIntentID int64, startedAt time.Time) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE business_schema.checkout_sessions
		SET
			current_payment_intent_id = $2,
			status = $3,
			payment_started_at = $4,
			payment_failed_at = NULL,
			expired_at = NULL,
			last_payment_error_code = NULL,
			last_payment_error_message = NULL,
			updated_at = NOW()
		WHERE checkout_session_id = $1
		RETURNING
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
	`

	var session CheckoutSession
	if err := scanCheckoutSession(q.QueryRow(ctx, query, checkoutSessionID, paymentIntentID, StatusPaymentPending, startedAt), &session); err != nil {
		return nil, fmt.Errorf("mark checkout session payment pending: %w", err)
	}
	return &session, nil
}

func (r *Repository) MarkCheckoutSessionPaymentFailed(ctx context.Context, q queryer, checkoutSessionID int64, failedAt time.Time, errorCode, errorMessage string) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE business_schema.checkout_sessions
		SET
			status = $2,
			payment_failed_at = $3,
			last_payment_error_code = $4,
			last_payment_error_message = $5,
			updated_at = NOW()
		WHERE checkout_session_id = $1
		RETURNING
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
	`

	var session CheckoutSession
	if err := scanCheckoutSession(
		q.QueryRow(ctx, query, checkoutSessionID, StatusPaymentFailed, failedAt, errorCode, errorMessage),
		&session,
	); err != nil {
		return nil, fmt.Errorf("mark checkout session payment failed: %w", err)
	}
	return &session, nil
}

func (r *Repository) MarkCheckoutSessionPaymentCaptured(ctx context.Context, q queryer, checkoutSessionID int64, capturedAt time.Time) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE business_schema.checkout_sessions
		SET
			status = $2,
			payment_captured_at = $3,
			last_payment_error_code = NULL,
			last_payment_error_message = NULL,
			updated_at = NOW()
		WHERE checkout_session_id = $1
		RETURNING
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
	`

	var session CheckoutSession
	if err := scanCheckoutSession(q.QueryRow(ctx, query, checkoutSessionID, StatusPaymentCaptured, capturedAt), &session); err != nil {
		return nil, fmt.Errorf("mark checkout session payment captured: %w", err)
	}
	return &session, nil
}

func (r *Repository) MarkCheckoutSessionMaterialized(ctx context.Context, q queryer, checkoutSessionID int64, materializedAt time.Time) (*CheckoutSession, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE business_schema.checkout_sessions
		SET
			status = $2,
			materialized_at = $3,
			updated_at = NOW()
		WHERE checkout_session_id = $1
		RETURNING
			checkout_session_id,
			retailer_id,
			retailer_user_id,
			retailer_branch_id,
			source_cart_date,
			currency,
			goods_amount,
			delivery_amount,
			gross_amount,
			delivery_address,
			status,
			idempotency_key,
			request_hash,
			current_payment_intent_id,
			payment_started_at,
			payment_captured_at,
			payment_failed_at,
			expired_at,
			cancelled_at,
			materialized_at,
			cancel_reason,
			last_payment_error_code,
			last_payment_error_message,
			created_at,
			updated_at
	`

	var session CheckoutSession
	if err := scanCheckoutSession(
		q.QueryRow(ctx, query, checkoutSessionID, StatusMaterialized, materializedAt),
		&session,
	); err != nil {
		return nil, fmt.Errorf("mark checkout session materialized: %w", err)
	}

	return &session, nil
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanCheckoutSession(scanner rowScanner, session *CheckoutSession) error {
	var sourceCartDate sql.NullTime
	var currentPaymentIntentID sql.NullInt64
	var paymentStartedAt sql.NullTime
	var paymentCapturedAt sql.NullTime
	var paymentFailedAt sql.NullTime
	var expiredAt sql.NullTime
	var cancelledAt sql.NullTime
	var materializedAt sql.NullTime
	var cancelReason sql.NullString
	var lastPaymentErrorCode sql.NullString
	var lastPaymentErrorMessage sql.NullString

	if err := scanner.Scan(
		&session.CheckoutSessionID,
		&session.RetailerID,
		&session.RetailerUserID,
		&session.RetailerBranchID,
		&sourceCartDate,
		&session.Currency,
		&session.GoodsAmount,
		&session.DeliveryAmount,
		&session.GrossAmount,
		&session.DeliveryAddress,
		&session.Status,
		&session.IdempotencyKey,
		&session.RequestHash,
		&currentPaymentIntentID,
		&paymentStartedAt,
		&paymentCapturedAt,
		&paymentFailedAt,
		&expiredAt,
		&cancelledAt,
		&materializedAt,
		&cancelReason,
		&lastPaymentErrorCode,
		&lastPaymentErrorMessage,
		&session.CreatedAt,
		&session.UpdatedAt,
	); err != nil {
		return err
	}

	session.SourceCartDate = nullTimePtr(sourceCartDate)
	session.CurrentPaymentIntentID = nullInt64Ptr(currentPaymentIntentID)
	session.PaymentStartedAt = nullTimePtr(paymentStartedAt)
	session.PaymentCapturedAt = nullTimePtr(paymentCapturedAt)
	session.PaymentFailedAt = nullTimePtr(paymentFailedAt)
	session.ExpiredAt = nullTimePtr(expiredAt)
	session.CancelledAt = nullTimePtr(cancelledAt)
	session.MaterializedAt = nullTimePtr(materializedAt)
	session.CancelReason = nullStringPtr(cancelReason)
	session.LastPaymentErrorCode = nullStringPtr(lastPaymentErrorCode)
	session.LastPaymentErrorMessage = nullStringPtr(lastPaymentErrorMessage)

	return nil
}

func scanCheckoutSessionItem(scanner rowScanner, item *CheckoutSessionItem) error {
	var selectedItemID sql.NullInt64
	var wholesellerBranchID sql.NullInt64
	var productNameSnapshot sql.NullString
	var unitNameSnapshot sql.NullString
	var imagePathSnapshot sql.NullString

	if err := scanner.Scan(
		&item.CheckoutSessionItemID,
		&item.CheckoutSessionID,
		&selectedItemID,
		&item.WholesellerID,
		&wholesellerBranchID,
		&item.ProductID,
		&item.UnitID,
		&productNameSnapshot,
		&unitNameSnapshot,
		&imagePathSnapshot,
		&item.Quantity,
		&item.UnitPrice,
		&item.DiscountAmount,
		&item.TaxAmount,
		&item.LineGoodsAmount,
		&item.LineFinalAmount,
		&item.SortOrder,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return err
	}

	item.SelectedItemID = nullInt64Ptr(selectedItemID)
	item.WholesellerBranchID = nullInt64Ptr(wholesellerBranchID)
	item.ProductNameSnapshot = nullStringPtr(productNameSnapshot)
	item.UnitNameSnapshot = nullStringPtr(unitNameSnapshot)
	item.ImagePathSnapshot = nullStringPtr(imagePathSnapshot)

	return nil
}

func scanCheckoutSessionOrder(scanner rowScanner, checkoutOrder *CheckoutSessionOrder) error {
	if err := scanner.Scan(
		&checkoutOrder.CheckoutSessionOrderID,
		&checkoutOrder.CheckoutSessionID,
		&checkoutOrder.OrderID,
		&checkoutOrder.WholesellerID,
		&checkoutOrder.CreatedAt,
	); err != nil {
		return err
	}

	return nil
}

func nullTimePtr(v sql.NullTime) *time.Time {
	if !v.Valid {
		return nil
	}
	t := v.Time
	return &t
}

func nullInt64Ptr(v sql.NullInt64) *int64 {
	if !v.Valid {
		return nil
	}
	n := v.Int64
	return &n
}

func nullStringPtr(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	s := v.String
	return &s
}
