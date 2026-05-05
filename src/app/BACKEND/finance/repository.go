package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"farmerapp/go_backend/db"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
)

var ErrDuplicatePaymentWebhookEvent = errors.New("duplicate payment webhook event")

type queryer interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) CreatePaymentIntent(ctx context.Context, q queryer, params CreatePaymentIntentParams) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}
	if params.Currency == "" {
		params.Currency = "INR"
	}
	if params.Status == "" {
		params.Status = PaymentIntentStatusCreated
	}

	var providerResponse interface{}
	if len(params.ProviderResponse) > 0 {
		providerResponse = params.ProviderResponse
	}

	query := `
		INSERT INTO finance_schema.payment_intents (
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			status,
			idempotency_key,
			initiated_at,
			last_error_code,
			last_error_message,
			provider_response
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17
		)
		RETURNING
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(
		ctx,
		query,
		params.CheckoutSessionID,
		params.RetailerID,
		params.ProviderCode,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.Currency,
		params.GoodsAmount,
		params.DeliveryAmount,
		params.PlatformFeeAmount,
		params.HandlingChargeAmount,
		params.GrossAmount,
		params.Status,
		params.IdempotencyKey,
		params.InitiatedAt,
		params.LastErrorCode,
		params.LastErrorMessage,
		providerResponse,
	), &intent); err != nil {
		return nil, fmt.Errorf("create payment intent: %w", err)
	}

	return &intent, nil
}

func (r *Repository) CreatePaymentAttempt(ctx context.Context, q queryer, params CreatePaymentAttemptParams) (*PaymentAttempt, error) {
	if q == nil {
		q = db.Pool
	}
	if params.Status == "" {
		params.Status = PaymentAttemptStatusInitiated
	}

	var requestPayload interface{}
	if len(params.RequestPayload) > 0 {
		requestPayload = params.RequestPayload
	}
	var responsePayload interface{}
	if len(params.ResponsePayload) > 0 {
		responsePayload = params.ResponsePayload
	}

	query := `
		INSERT INTO finance_schema.payment_attempts (
			payment_intent_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			amount,
			status,
			idempotency_key,
			request_payload,
			response_payload,
			last_error_code,
			last_error_message,
			initiated_at,
			completed_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13
		)
		RETURNING
			payment_attempt_id,
			payment_intent_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			provider_transaction_id,
			amount,
			status,
			idempotency_key,
			request_payload,
			response_payload,
			last_error_code,
			last_error_message,
			initiated_at,
			completed_at,
			created_at,
			updated_at
	`

	var attempt PaymentAttempt
	if err := scanPaymentAttempt(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.ProviderCode,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.Amount,
		params.Status,
		params.IdempotencyKey,
		requestPayload,
		responsePayload,
		params.LastErrorCode,
		params.LastErrorMessage,
		params.InitiatedAt,
		params.CompletedAt,
	), &attempt); err != nil {
		return nil, fmt.Errorf("create payment attempt: %w", err)
	}

	return &attempt, nil
}

func (r *Repository) CreateSettlementAllocation(ctx context.Context, q queryer, params CreateSettlementAllocationParams) (*SettlementAllocation, error) {
	if q == nil {
		q = db.Pool
	}
	if params.Status == "" {
		params.Status = SettlementAllocationStatusHold
	}
	if params.HoldSource == "" {
		params.HoldSource = "system"
	}

	query := `
		INSERT INTO finance_schema.settlement_allocations (
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			admin_note
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19
		)
		RETURNING
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
	`

	var allocation SettlementAllocation
	if err := scanSettlementAllocation(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.CheckoutSessionID,
		params.OrderID,
		params.JobID,
		params.AllocationType,
		params.PayeeType,
		params.PayeeID,
		params.GrossAmount,
		params.FeeAmount,
		params.TaxAmount,
		params.HoldAmount,
		params.NetPayable,
		params.Status,
		params.ReleaseAfter,
		params.HoldReason,
		params.HoldSource,
		params.HeldByUserID,
		params.HeldAt,
		params.AdminNote,
	), &allocation); err != nil {
		return nil, fmt.Errorf("create settlement allocation: %w", err)
	}

	return &allocation, nil
}

func (r *Repository) GetPaymentIntentByProviderOrderID(ctx context.Context, q queryer, providerCode, providerOrderID string) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
		FROM finance_schema.payment_intents
		WHERE provider_code = $1
		  AND provider_order_id = $2
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(ctx, query, providerCode, providerOrderID), &intent); err != nil {
		return nil, fmt.Errorf("get payment intent by provider order id: %w", err)
	}

	return &intent, nil
}

func (r *Repository) GetPaymentIntentByID(ctx context.Context, q queryer, paymentIntentID int64) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
		FROM finance_schema.payment_intents
		WHERE payment_intent_id = $1
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(ctx, query, paymentIntentID), &intent); err != nil {
		return nil, fmt.Errorf("get payment intent by id: %w", err)
	}

	return &intent, nil
}

func (r *Repository) UpdatePaymentIntentGatewayInit(ctx context.Context, q queryer, params UpdatePaymentIntentGatewayInitParams) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}

	var providerResponse interface{}
	if len(params.ProviderResponse) > 0 {
		providerResponse = params.ProviderResponse
	}

	query := `
		UPDATE finance_schema.payment_intents
		SET
			provider_order_id = $2,
			provider_payment_id = $3,
			status = $4,
			provider_response = COALESCE($5::jsonb, provider_response),
			updated_at = NOW()
		WHERE payment_intent_id = $1
		RETURNING
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.Status,
		providerResponse,
	), &intent); err != nil {
		return nil, fmt.Errorf("update payment intent gateway init: %w", err)
	}

	return &intent, nil
}

func (r *Repository) UpdatePaymentAttemptGatewayInit(ctx context.Context, q queryer, params UpdatePaymentAttemptGatewayInitParams) (*PaymentAttempt, error) {
	if q == nil {
		q = db.Pool
	}

	var responsePayload interface{}
	if len(params.ResponsePayload) > 0 {
		responsePayload = params.ResponsePayload
	}

	query := `
		UPDATE finance_schema.payment_attempts
		SET
			provider_order_id = $2,
			provider_payment_id = $3,
			status = $4,
			response_payload = COALESCE($5::jsonb, response_payload),
			updated_at = NOW()
		WHERE payment_intent_id = $1
		RETURNING
			payment_attempt_id,
			payment_intent_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			provider_transaction_id,
			amount,
			status,
			idempotency_key,
			request_payload,
			response_payload,
			last_error_code,
			last_error_message,
			initiated_at,
			completed_at,
			created_at,
			updated_at
	`

	var attempt PaymentAttempt
	if err := scanPaymentAttempt(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.Status,
		responsePayload,
	), &attempt); err != nil {
		return nil, fmt.Errorf("update payment attempt gateway init: %w", err)
	}

	return &attempt, nil
}

func (r *Repository) UpdatePaymentIntentFailure(ctx context.Context, q queryer, params UpdatePaymentIntentFailureParams) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}

	var providerResponse interface{}
	if len(params.ProviderResponse) > 0 {
		providerResponse = params.ProviderResponse
	}

	query := `
		UPDATE finance_schema.payment_intents
		SET
			status = $2,
			failed_at = NOW(),
			last_error_code = $3,
			last_error_message = $4,
			provider_payment_id = COALESCE($5, provider_payment_id),
			provider_response = COALESCE($6::jsonb, provider_response),
			updated_at = NOW()
		WHERE payment_intent_id = $1
		RETURNING
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.Status,
		params.LastErrorCode,
		params.LastErrorMessage,
		params.ProviderPaymentID,
		providerResponse,
	), &intent); err != nil {
		return nil, fmt.Errorf("update payment intent failure: %w", err)
	}

	return &intent, nil
}

func (r *Repository) UpdatePaymentAttemptFailureByIntent(ctx context.Context, q queryer, params UpdatePaymentAttemptFailureByIntentParams) (*PaymentAttempt, error) {
	if q == nil {
		q = db.Pool
	}

	var responsePayload interface{}
	if len(params.ResponsePayload) > 0 {
		responsePayload = params.ResponsePayload
	}

	query := `
		UPDATE finance_schema.payment_attempts
		SET
			status = $2,
			response_payload = COALESCE($3::jsonb, response_payload),
			last_error_code = $4,
			last_error_message = $5,
			completed_at = COALESCE($6, completed_at, NOW()),
			updated_at = NOW()
		WHERE payment_intent_id = $1
		RETURNING
			payment_attempt_id,
			payment_intent_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			provider_transaction_id,
			amount,
			status,
			idempotency_key,
			request_payload,
			response_payload,
			last_error_code,
			last_error_message,
			initiated_at,
			completed_at,
			created_at,
			updated_at
	`

	var attempt PaymentAttempt
	if err := scanPaymentAttempt(q.QueryRow(
		ctx,
		query,
		params.PaymentIntentID,
		params.Status,
		responsePayload,
		params.LastErrorCode,
		params.LastErrorMessage,
		params.CompletedAt,
	), &attempt); err != nil {
		return nil, fmt.Errorf("update payment attempt failure by intent: %w", err)
	}

	return &attempt, nil
}

func (r *Repository) UpdatePaymentIntentCapture(ctx context.Context, q queryer, params UpdatePaymentIntentCaptureParams) (*PaymentIntent, error) {
	if q == nil {
		q = db.Pool
	}

	var providerResponse interface{}
	if len(params.ProviderResponse) > 0 {
		providerResponse = params.ProviderResponse
	}

	query := `
		UPDATE finance_schema.payment_intents
		SET
			provider_payment_id = COALESCE($3, provider_payment_id),
			status = $4,
			captured_amount = $5,
			collected_at = $6,
			last_error_code = $7,
			last_error_message = $8,
			provider_response = COALESCE($9::jsonb, provider_response),
			updated_at = NOW()
		WHERE provider_order_id = $1
		  AND provider_code = $2
		RETURNING
			payment_intent_id,
			checkout_session_id,
			retailer_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			currency,
			goods_amount,
			delivery_amount,
			platform_fee_amount,
			handling_charge_amount,
			gross_amount,
			captured_amount,
			refunded_amount,
			status,
			idempotency_key,
			initiated_at,
			collected_at,
			failed_at,
			last_error_code,
			last_error_message,
			provider_response,
			created_at,
			updated_at
	`

	var intent PaymentIntent
	if err := scanPaymentIntent(q.QueryRow(
		ctx,
		query,
		params.ProviderOrderID,
		params.ProviderCode,
		params.ProviderPaymentID,
		params.Status,
		params.CapturedAmount,
		params.CollectedAt,
		params.LastErrorCode,
		params.LastErrorMessage,
		providerResponse,
	), &intent); err != nil {
		return nil, fmt.Errorf("update payment intent capture: %w", err)
	}

	return &intent, nil
}

func (r *Repository) UpdatePaymentAttemptTerminal(ctx context.Context, q queryer, params UpdatePaymentAttemptTerminalParams) (*PaymentAttempt, error) {
	if q == nil {
		q = db.Pool
	}

	var responsePayload interface{}
	if len(params.ResponsePayload) > 0 {
		responsePayload = params.ResponsePayload
	}

	query := `
		UPDATE finance_schema.payment_attempts
		SET
			provider_payment_id = COALESCE($3, provider_payment_id),
			provider_transaction_id = COALESCE($4, provider_transaction_id),
			status = $5,
			response_payload = COALESCE($6::jsonb, response_payload),
			last_error_code = $7,
			last_error_message = $8,
			completed_at = COALESCE($9, completed_at, NOW()),
			updated_at = NOW()
		WHERE provider_code = $1
		  AND provider_order_id = $2
		RETURNING
			payment_attempt_id,
			payment_intent_id,
			provider_code,
			provider_order_id,
			provider_payment_id,
			provider_transaction_id,
			amount,
			status,
			idempotency_key,
			request_payload,
			response_payload,
			last_error_code,
			last_error_message,
			initiated_at,
			completed_at,
			created_at,
			updated_at
	`

	var attempt PaymentAttempt
	if err := scanPaymentAttempt(q.QueryRow(
		ctx,
		query,
		params.ProviderCode,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.ProviderTransactionID,
		params.Status,
		responsePayload,
		params.LastErrorCode,
		params.LastErrorMessage,
		params.CompletedAt,
	), &attempt); err != nil {
		return nil, fmt.Errorf("update payment attempt terminal: %w", err)
	}

	return &attempt, nil
}

func (r *Repository) CancelOpenSettlementAllocationsByPaymentIntentID(ctx context.Context, q queryer, paymentIntentID int64, holdReason, adminNote *string) (int64, error) {
	if q == nil {
		q = db.Pool
	}

	tag, err := q.Exec(ctx, `
		UPDATE finance_schema.settlement_allocations
		SET
			status = $2,
			hold_reason = COALESCE($3, hold_reason),
			admin_note = COALESCE($4, admin_note),
			updated_at = NOW()
		WHERE payment_intent_id = $1
		  AND status IN ('hold', 'ready_for_release', 'release_initiated', 'blocked')
	`,
		paymentIntentID,
		SettlementAllocationStatusCancelled,
		holdReason,
		adminNote,
	)
	if err != nil {
		return 0, fmt.Errorf("cancel open settlement allocations by payment intent id: %w", err)
	}

	return tag.RowsAffected(), nil
}

func (r *Repository) AssignOrderToWholesellerAllocations(ctx context.Context, q queryer, paymentIntentID int64, wholesellerID int64, orderID int64) (int64, error) {
	if q == nil {
		q = db.Pool
	}

	tag, err := q.Exec(ctx, `
		UPDATE finance_schema.settlement_allocations
		SET
			order_id = $3,
			updated_at = NOW()
		WHERE payment_intent_id = $1
		  AND payee_type = 'wholeseller'
		  AND payee_id = $2
		  AND order_id IS NULL
	`,
		paymentIntentID,
		wholesellerID,
		orderID,
	)
	if err != nil {
		return 0, fmt.Errorf("assign order to wholeseller allocations: %w", err)
	}

	return tag.RowsAffected(), nil
}

func (r *Repository) CreatePaymentWebhookEvent(ctx context.Context, q queryer, params CreatePaymentWebhookEventParams) (*PaymentWebhookEvent, error) {
	if q == nil {
		q = db.Pool
	}
	if params.ProcessingStatus == "" {
		params.ProcessingStatus = WebhookProcessingStatusReceived
	}

	var payload interface{}
	if len(params.Payload) > 0 {
		payload = params.Payload
	}

	query := `
		INSERT INTO finance_schema.payment_webhook_events (
			provider_code,
			provider_event_id,
			event_type,
			payment_intent_id,
			checkout_session_id,
			provider_order_id,
			provider_payment_id,
			raw_body,
			payload,
			signature_valid,
			processed,
			processing_status,
			processing_error,
			processed_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13, $14
		)
		RETURNING
			webhook_event_id,
			provider_code,
			provider_event_id,
			event_type,
			payment_intent_id,
			checkout_session_id,
			provider_order_id,
			provider_payment_id,
			raw_body,
			payload,
			signature_valid,
			processed,
			processing_status,
			processing_error,
			processed_at,
			created_at,
			updated_at
	`

	var event PaymentWebhookEvent
	if err := scanPaymentWebhookEvent(q.QueryRow(
		ctx,
		query,
		params.ProviderCode,
		params.ProviderEventID,
		params.EventType,
		params.PaymentIntentID,
		params.CheckoutSessionID,
		params.ProviderOrderID,
		params.ProviderPaymentID,
		params.RawBody,
		payload,
		params.SignatureValid,
		params.Processed,
		params.ProcessingStatus,
		params.ProcessingError,
		params.ProcessedAt,
	), &event); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicatePaymentWebhookEvent
		}
		return nil, fmt.Errorf("create payment webhook event: %w", err)
	}

	return &event, nil
}

func (r *Repository) UpdatePaymentWebhookEventProcessing(ctx context.Context, q queryer, params UpdatePaymentWebhookEventProcessingParams) (*PaymentWebhookEvent, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE finance_schema.payment_webhook_events
		SET
			payment_intent_id = COALESCE($2, payment_intent_id),
			checkout_session_id = COALESCE($3, checkout_session_id),
			processed = $4,
			processing_status = $5,
			processing_error = $6,
			processed_at = $7,
			updated_at = NOW()
		WHERE webhook_event_id = $1
		RETURNING
			webhook_event_id,
			provider_code,
			provider_event_id,
			event_type,
			payment_intent_id,
			checkout_session_id,
			provider_order_id,
			provider_payment_id,
			raw_body,
			payload,
			signature_valid,
			processed,
			processing_status,
			processing_error,
			processed_at,
			created_at,
			updated_at
	`

	var event PaymentWebhookEvent
	if err := scanPaymentWebhookEvent(q.QueryRow(
		ctx,
		query,
		params.WebhookEventID,
		params.PaymentIntentID,
		params.CheckoutSessionID,
		params.Processed,
		params.ProcessingStatus,
		params.ProcessingError,
		params.ProcessedAt,
	), &event); err != nil {
		return nil, fmt.Errorf("update payment webhook event processing: %w", err)
	}

	return &event, nil
}

func (r *Repository) CreateFinanceEvent(ctx context.Context, q queryer, params CreateFinanceEventParams) (*FinanceEvent, error) {
	if q == nil {
		q = db.Pool
	}
	if params.Currency == "" {
		params.Currency = "INR"
	}
	if params.ActorType == "" {
		params.ActorType = "system"
	}
	if params.SourceSystem == "" {
		params.SourceSystem = "backend"
	}

	var metadata interface{}
	if len(params.Metadata) > 0 {
		metadata = params.Metadata
	}

	query := `
		INSERT INTO finance_schema.finance_events (
			entity_type,
			entity_id,
			parent_entity_type,
			parent_entity_id,
			checkout_session_id,
			order_id,
			payment_intent_id,
			event_type,
			old_status,
			new_status,
			amount,
			currency,
			actor_type,
			actor_user_id,
			source_system,
			source_reference,
			notes,
			metadata
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14, $15, $16, $17, $18
		)
		RETURNING
			finance_event_id,
			entity_type,
			entity_id,
			parent_entity_type,
			parent_entity_id,
			checkout_session_id,
			order_id,
			payment_intent_id,
			event_type,
			old_status,
			new_status,
			amount,
			currency,
			actor_type,
			actor_user_id,
			source_system,
			source_reference,
			notes,
			metadata,
			created_at
	`

	var event FinanceEvent
	if err := scanFinanceEvent(q.QueryRow(
		ctx,
		query,
		params.EntityType,
		params.EntityID,
		params.ParentEntityType,
		params.ParentEntityID,
		params.CheckoutSessionID,
		params.OrderID,
		params.PaymentIntentID,
		params.EventType,
		params.OldStatus,
		params.NewStatus,
		params.Amount,
		params.Currency,
		params.ActorType,
		params.ActorUserID,
		params.SourceSystem,
		params.SourceReference,
		params.Notes,
		metadata,
	), &event); err != nil {
		return nil, fmt.Errorf("create finance event: %w", err)
	}

	return &event, nil
}

func (r *Repository) CreateFinanceException(ctx context.Context, q queryer, params CreateFinanceExceptionParams) (*FinanceException, error) {
	if q == nil {
		q = db.Pool
	}
	if params.Severity == "" {
		params.Severity = FinanceExceptionSeverityWarning
	}
	if params.Status == "" {
		params.Status = FinanceExceptionStatusOpen
	}

	query := `
		INSERT INTO finance_schema.finance_exceptions (
			entity_type,
			entity_id,
			source_type,
			order_id,
			checkout_session_id,
			payment_intent_id,
			dispute_case_id,
			return_id,
			exception_type,
			severity,
			status,
			assigned_to_user_id,
			resolution_note,
			metadata
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13, $14
		)
		RETURNING
			exception_id,
			entity_type,
			entity_id,
			source_type,
			order_id,
			checkout_session_id,
			payment_intent_id,
			dispute_case_id,
			return_id,
			exception_type,
			severity,
			status,
			assigned_to_user_id,
			resolution_note,
			metadata,
			created_at,
			resolved_at
	`

	var financeException FinanceException
	if err := scanFinanceException(q.QueryRow(
		ctx,
		query,
		params.EntityType,
		params.EntityID,
		params.SourceType,
		params.OrderID,
		params.CheckoutSessionID,
		params.PaymentIntentID,
		params.DisputeCaseID,
		params.ReturnID,
		params.ExceptionType,
		params.Severity,
		params.Status,
		params.AssignedToUserID,
		params.ResolutionNote,
		params.Metadata,
	), &financeException); err != nil {
		return nil, fmt.Errorf("create finance exception: %w", err)
	}

	return &financeException, nil
}

func (r *Repository) ListSettlementAllocations(ctx context.Context, q queryer, statuses []string, page, pageSize int) ([]SettlementAllocation, int64, error) {
	if q == nil {
		q = db.Pool
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var totalCount int64
	countQuery := `SELECT COUNT(*) FROM finance_schema.settlement_allocations WHERE ($1::text[] IS NULL OR status = ANY($1))`
	if err := q.QueryRow(ctx, countQuery, nullIfEmptyStrings(statuses)).Scan(&totalCount); err != nil {
		return nil, 0, fmt.Errorf("count settlement allocations: %w", err)
	}

	query := `
		SELECT
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
		FROM finance_schema.settlement_allocations
		WHERE ($1::text[] IS NULL OR status = ANY($1))
		ORDER BY created_at DESC, allocation_id DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := q.Query(ctx, query, nullIfEmptyStrings(statuses), pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list settlement allocations: %w", err)
	}
	defer rows.Close()

	items := make([]SettlementAllocation, 0, pageSize)
	for rows.Next() {
		var item SettlementAllocation
		if err := scanSettlementAllocation(rows, &item); err != nil {
			return nil, 0, fmt.Errorf("scan settlement allocation: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate settlement allocations: %w", err)
	}

	return items, totalCount, nil
}

func (r *Repository) GetSettlementAllocationByID(ctx context.Context, q queryer, allocationID int64) (*SettlementAllocation, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		SELECT
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
		FROM finance_schema.settlement_allocations
		WHERE allocation_id = $1
	`

	var allocation SettlementAllocation
	if err := scanSettlementAllocation(q.QueryRow(ctx, query, allocationID), &allocation); err != nil {
		return nil, fmt.Errorf("get settlement allocation: %w", err)
	}

	return &allocation, nil
}

func (r *Repository) SyncSettlementAllocationReleaseState(ctx context.Context, q queryer, allocationID int64, now time.Time) (*SettlementAllocation, error) {
	if q == nil {
		q = db.Pool
	}

	allocation, err := r.GetSettlementAllocationByID(ctx, q, allocationID)
	if err != nil {
		return nil, err
	}

	releaseContext, err := r.getSettlementAllocationReleaseContext(ctx, q, allocation)
	if err != nil {
		return nil, err
	}

	decision := evaluateSettlementAllocationRelease(*releaseContext, now)
	if !settlementAllocationNeedsSync(allocation, decision) {
		return allocation, nil
	}

	return r.applySettlementAllocationReleaseDecision(ctx, q, allocationID, decision)
}

func (r *Repository) HoldSettlementAllocation(ctx context.Context, q queryer, allocationID int64, actorUserID int64, reason, note *string) (*SettlementAllocation, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE finance_schema.settlement_allocations
		SET
			status = $2,
			hold_reason = COALESCE($3, hold_reason),
			hold_source = 'admin',
			held_by_user_id = $4,
			held_at = NOW(),
			admin_note = COALESCE($5, admin_note),
			updated_at = NOW()
		WHERE allocation_id = $1
		RETURNING
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
	`

	var allocation SettlementAllocation
	if err := scanSettlementAllocation(q.QueryRow(ctx, query, allocationID, SettlementAllocationStatusBlocked, reason, actorUserID, note), &allocation); err != nil {
		return nil, fmt.Errorf("hold settlement allocation: %w", err)
	}

	return &allocation, nil
}

func (r *Repository) ReleaseSettlementAllocation(ctx context.Context, q queryer, allocationID int64, actorUserID int64, note *string) (*SettlementAllocation, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE finance_schema.settlement_allocations
		SET
			status = $2,
			hold_reason = NULL,
			hold_source = 'system',
			held_by_user_id = NULL,
			held_at = NULL,
			release_block_reason = NULL,
			release_approved_by = $3,
			release_approved_at = NOW(),
			admin_note = COALESCE($4, admin_note),
			updated_at = NOW()
		WHERE allocation_id = $1
		RETURNING
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
	`

	var allocation SettlementAllocation
	if err := scanSettlementAllocation(q.QueryRow(ctx, query, allocationID, SettlementAllocationStatusReleased, actorUserID, note), &allocation); err != nil {
		return nil, fmt.Errorf("release settlement allocation: %w", err)
	}

	return &allocation, nil
}

func (r *Repository) getSettlementAllocationReleaseContext(ctx context.Context, q queryer, allocation *SettlementAllocation) (*settlementAllocationReleaseContext, error) {
	releaseContext := &settlementAllocationReleaseContext{
		Allocation: *allocation,
	}

	if allocation.OrderID == nil {
		return releaseContext, nil
	}

	query := `
		SELECT
			o.order_status,
			COALESCE(
				(
					SELECT ta.delivered_at
					FROM transport_schema.job_orders jo
					JOIN transport_schema.trip_assignments ta ON ta.job_id = jo.job_id
					WHERE jo.order_id = $1
					  AND ta.delivered_at IS NOT NULL
					ORDER BY ta.delivered_at DESC
					LIMIT 1
				),
				(
					SELECT oht.delivery_completed_date
					FROM business_schema.order_history_table oht
					WHERE oht.order_id = $1
					  AND oht.delivery_completed_date IS NOT NULL
					ORDER BY oht.history_id DESC
					LIMIT 1
				),
				(
					SELECT oht.actual_delivery_date
					FROM business_schema.order_history_table oht
					WHERE oht.order_id = $1
					  AND oht.actual_delivery_date IS NOT NULL
					ORDER BY oht.history_id DESC
					LIMIT 1
				)
			) AS delivered_at,
			COALESCE((
				SELECT COUNT(*)
				FROM dispute_schema.dispute_cases dc
				WHERE dc.order_id = $1
				  AND dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
			), 0) AS open_dispute_count
		FROM business_schema.order_table o
		WHERE o.order_id = $1
	`

	var orderStatus sql.NullInt32
	var deliveredAt sql.NullTime
	var openDisputeCount int64

	if err := q.QueryRow(ctx, query, *allocation.OrderID).Scan(&orderStatus, &deliveredAt, &openDisputeCount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return releaseContext, nil
		}
		return nil, fmt.Errorf("load settlement allocation release context: %w", err)
	}

	if orderStatus.Valid {
		value := int(orderStatus.Int32)
		releaseContext.OrderStatusID = &value
	}
	releaseContext.DeliveredAt = nullTimePtr(deliveredAt)
	releaseContext.OpenDisputeCount = openDisputeCount

	return releaseContext, nil
}

func (r *Repository) applySettlementAllocationReleaseDecision(ctx context.Context, q queryer, allocationID int64, decision settlementAllocationReleaseDecision) (*SettlementAllocation, error) {
	query := `
		UPDATE finance_schema.settlement_allocations
		SET
			status = $2,
			release_after = $3,
			hold_reason = $4,
			hold_source = 'system',
			held_by_user_id = NULL,
			held_at = NULL,
			release_block_reason = $5,
			release_approved_by = NULL,
			release_approved_at = NULL,
			updated_at = NOW()
		WHERE allocation_id = $1
		RETURNING
			allocation_id,
			payment_intent_id,
			checkout_session_id,
			order_id,
			job_id,
			allocation_type,
			payee_type,
			payee_id,
			gross_amount,
			fee_amount,
			tax_amount,
			hold_amount,
			net_payable,
			status,
			release_after,
			hold_reason,
			hold_source,
			held_by_user_id,
			held_at,
			release_block_reason,
			release_approved_by,
			release_approved_at,
			admin_note,
			created_at,
			updated_at
	`

	var allocation SettlementAllocation
	if err := scanSettlementAllocation(
		q.QueryRow(ctx, query, allocationID, decision.Status, decision.ReleaseAfter, decision.HoldReason, decision.ReleaseBlockReason),
		&allocation,
	); err != nil {
		return nil, fmt.Errorf("apply settlement allocation release decision: %w", err)
	}

	return &allocation, nil
}

func (r *Repository) ListFinanceExceptions(ctx context.Context, q queryer, statuses []string, page, pageSize int) ([]FinanceException, int64, error) {
	if q == nil {
		q = db.Pool
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var totalCount int64
	countQuery := `SELECT COUNT(*) FROM finance_schema.finance_exceptions WHERE ($1::text[] IS NULL OR status = ANY($1))`
	if err := q.QueryRow(ctx, countQuery, nullIfEmptyStrings(statuses)).Scan(&totalCount); err != nil {
		return nil, 0, fmt.Errorf("count finance exceptions: %w", err)
	}

	query := `
		SELECT
			exception_id,
			entity_type,
			entity_id,
			source_type,
			order_id,
			checkout_session_id,
			payment_intent_id,
			dispute_case_id,
			return_id,
			exception_type,
			severity,
			status,
			assigned_to_user_id,
			resolution_note,
			metadata,
			created_at,
			resolved_at
		FROM finance_schema.finance_exceptions
		WHERE ($1::text[] IS NULL OR status = ANY($1))
		ORDER BY created_at DESC, exception_id DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := q.Query(ctx, query, nullIfEmptyStrings(statuses), pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list finance exceptions: %w", err)
	}
	defer rows.Close()

	items := make([]FinanceException, 0, pageSize)
	for rows.Next() {
		var item FinanceException
		if err := scanFinanceException(rows, &item); err != nil {
			return nil, 0, fmt.Errorf("scan finance exception: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate finance exceptions: %w", err)
	}

	return items, totalCount, nil
}

func (r *Repository) UpdateFinanceExceptionStatus(ctx context.Context, q queryer, params UpdateFinanceExceptionStatusParams) (*FinanceException, error) {
	if q == nil {
		q = db.Pool
	}

	query := `
		UPDATE finance_schema.finance_exceptions
		SET
			status = $2,
			assigned_to_user_id = COALESCE($3, assigned_to_user_id),
			resolution_note = COALESCE($4, resolution_note),
			resolved_at = $5
		WHERE exception_id = $1
		RETURNING
			exception_id,
			entity_type,
			entity_id,
			source_type,
			order_id,
			checkout_session_id,
			payment_intent_id,
			dispute_case_id,
			return_id,
			exception_type,
			severity,
			status,
			assigned_to_user_id,
			resolution_note,
			metadata,
			created_at,
			resolved_at
	`

	var financeException FinanceException
	if err := scanFinanceException(q.QueryRow(
		ctx,
		query,
		params.ExceptionID,
		params.Status,
		params.AssignedToUserID,
		params.ResolutionNote,
		params.ResolvedAt,
	), &financeException); err != nil {
		return nil, fmt.Errorf("update finance exception status: %w", err)
	}

	return &financeException, nil
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanPaymentAttempt(scanner rowScanner, attempt *PaymentAttempt) error {
	var providerOrderID sql.NullString
	var providerPaymentID sql.NullString
	var providerTransactionID sql.NullString
	var requestPayload []byte
	var responsePayload []byte
	var lastErrorCode sql.NullString
	var lastErrorMessage sql.NullString
	var initiatedAt sql.NullTime
	var completedAt sql.NullTime

	if err := scanner.Scan(
		&attempt.PaymentAttemptID,
		&attempt.PaymentIntentID,
		&attempt.ProviderCode,
		&providerOrderID,
		&providerPaymentID,
		&providerTransactionID,
		&attempt.Amount,
		&attempt.Status,
		&attempt.IdempotencyKey,
		&requestPayload,
		&responsePayload,
		&lastErrorCode,
		&lastErrorMessage,
		&initiatedAt,
		&completedAt,
		&attempt.CreatedAt,
		&attempt.UpdatedAt,
	); err != nil {
		return err
	}

	attempt.ProviderOrderID = nullStringPtr(providerOrderID)
	attempt.ProviderPaymentID = nullStringPtr(providerPaymentID)
	attempt.ProviderTransactionID = nullStringPtr(providerTransactionID)
	attempt.RequestPayload = requestPayload
	attempt.ResponsePayload = responsePayload
	attempt.LastErrorCode = nullStringPtr(lastErrorCode)
	attempt.LastErrorMessage = nullStringPtr(lastErrorMessage)
	attempt.InitiatedAt = nullTimePtr(initiatedAt)
	attempt.CompletedAt = nullTimePtr(completedAt)

	return nil
}

func scanPaymentIntent(scanner rowScanner, intent *PaymentIntent) error {
	var providerOrderID sql.NullString
	var providerPaymentID sql.NullString
	var initiatedAt sql.NullTime
	var collectedAt sql.NullTime
	var failedAt sql.NullTime
	var lastErrorCode sql.NullString
	var lastErrorMessage sql.NullString
	var providerResponse []byte

	if err := scanner.Scan(
		&intent.PaymentIntentID,
		&intent.CheckoutSessionID,
		&intent.RetailerID,
		&intent.ProviderCode,
		&providerOrderID,
		&providerPaymentID,
		&intent.Currency,
		&intent.GoodsAmount,
		&intent.DeliveryAmount,
		&intent.PlatformFeeAmount,
		&intent.HandlingChargeAmount,
		&intent.GrossAmount,
		&intent.CapturedAmount,
		&intent.RefundedAmount,
		&intent.Status,
		&intent.IdempotencyKey,
		&initiatedAt,
		&collectedAt,
		&failedAt,
		&lastErrorCode,
		&lastErrorMessage,
		&providerResponse,
		&intent.CreatedAt,
		&intent.UpdatedAt,
	); err != nil {
		return err
	}

	intent.ProviderOrderID = nullStringPtr(providerOrderID)
	intent.ProviderPaymentID = nullStringPtr(providerPaymentID)
	intent.InitiatedAt = nullTimePtr(initiatedAt)
	intent.CollectedAt = nullTimePtr(collectedAt)
	intent.FailedAt = nullTimePtr(failedAt)
	intent.LastErrorCode = nullStringPtr(lastErrorCode)
	intent.LastErrorMessage = nullStringPtr(lastErrorMessage)
	intent.ProviderResponse = providerResponse
	return nil
}

func scanSettlementAllocation(scanner rowScanner, allocation *SettlementAllocation) error {
	var orderID sql.NullInt64
	var jobID sql.NullInt64
	var releaseAfter sql.NullTime
	var holdReason sql.NullString
	var heldByUserID sql.NullInt64
	var heldAt sql.NullTime
	var releaseBlockReason sql.NullString
	var releaseApprovedBy sql.NullInt64
	var releaseApprovedAt sql.NullTime
	var adminNote sql.NullString

	if err := scanner.Scan(
		&allocation.AllocationID,
		&allocation.PaymentIntentID,
		&allocation.CheckoutSessionID,
		&orderID,
		&jobID,
		&allocation.AllocationType,
		&allocation.PayeeType,
		&allocation.PayeeID,
		&allocation.GrossAmount,
		&allocation.FeeAmount,
		&allocation.TaxAmount,
		&allocation.HoldAmount,
		&allocation.NetPayable,
		&allocation.Status,
		&releaseAfter,
		&holdReason,
		&allocation.HoldSource,
		&heldByUserID,
		&heldAt,
		&releaseBlockReason,
		&releaseApprovedBy,
		&releaseApprovedAt,
		&adminNote,
		&allocation.CreatedAt,
		&allocation.UpdatedAt,
	); err != nil {
		return err
	}

	allocation.OrderID = nullInt64Ptr(orderID)
	allocation.JobID = nullInt64Ptr(jobID)
	allocation.ReleaseAfter = nullTimePtr(releaseAfter)
	allocation.HoldReason = nullStringPtr(holdReason)
	allocation.HeldByUserID = nullInt64Ptr(heldByUserID)
	allocation.HeldAt = nullTimePtr(heldAt)
	allocation.ReleaseBlockReason = nullStringPtr(releaseBlockReason)
	allocation.ReleaseApprovedBy = nullInt64Ptr(releaseApprovedBy)
	allocation.ReleaseApprovedAt = nullTimePtr(releaseApprovedAt)
	allocation.AdminNote = nullStringPtr(adminNote)
	return nil
}

func settlementAllocationNeedsSync(current *SettlementAllocation, decision settlementAllocationReleaseDecision) bool {
	if current.Status != decision.Status {
		return true
	}
	if !equalOptionalTime(current.ReleaseAfter, decision.ReleaseAfter) {
		return true
	}
	if !equalOptionalString(current.HoldReason, decision.HoldReason) {
		return true
	}
	if !equalOptionalString(current.ReleaseBlockReason, decision.ReleaseBlockReason) {
		return true
	}
	if current.Status != SettlementAllocationStatusBlocked && current.HoldSource != "system" {
		return true
	}
	return false
}

func equalOptionalTime(left, right *time.Time) bool {
	if left == nil && right == nil {
		return true
	}
	if left == nil || right == nil {
		return false
	}
	return left.Equal(*right)
}

func equalOptionalString(left, right *string) bool {
	if left == nil && right == nil {
		return true
	}
	if left == nil || right == nil {
		return false
	}
	return *left == *right
}

func scanPaymentWebhookEvent(scanner rowScanner, event *PaymentWebhookEvent) error {
	var paymentIntentID sql.NullInt64
	var checkoutSessionID sql.NullInt64
	var providerOrderID sql.NullString
	var providerPaymentID sql.NullString
	var rawBody sql.NullString
	var payload []byte
	var processingError sql.NullString
	var processedAt sql.NullTime

	if err := scanner.Scan(
		&event.WebhookEventID,
		&event.ProviderCode,
		&event.ProviderEventID,
		&event.EventType,
		&paymentIntentID,
		&checkoutSessionID,
		&providerOrderID,
		&providerPaymentID,
		&rawBody,
		&payload,
		&event.SignatureValid,
		&event.Processed,
		&event.ProcessingStatus,
		&processingError,
		&processedAt,
		&event.CreatedAt,
		&event.UpdatedAt,
	); err != nil {
		return err
	}

	event.PaymentIntentID = nullInt64Ptr(paymentIntentID)
	event.CheckoutSessionID = nullInt64Ptr(checkoutSessionID)
	event.ProviderOrderID = nullStringPtr(providerOrderID)
	event.ProviderPaymentID = nullStringPtr(providerPaymentID)
	event.RawBody = nullStringPtr(rawBody)
	event.Payload = payload
	event.ProcessingError = nullStringPtr(processingError)
	event.ProcessedAt = nullTimePtr(processedAt)
	return nil
}

func scanFinanceEvent(scanner rowScanner, event *FinanceEvent) error {
	var parentEntityType sql.NullString
	var parentEntityID sql.NullInt64
	var checkoutSessionID sql.NullInt64
	var orderID sql.NullInt64
	var paymentIntentID sql.NullInt64
	var oldStatus sql.NullString
	var newStatus sql.NullString
	var amount sql.NullFloat64
	var actorUserID sql.NullInt64
	var sourceReference sql.NullString
	var notes sql.NullString
	var metadata []byte

	if err := scanner.Scan(
		&event.FinanceEventID,
		&event.EntityType,
		&event.EntityID,
		&parentEntityType,
		&parentEntityID,
		&checkoutSessionID,
		&orderID,
		&paymentIntentID,
		&event.EventType,
		&oldStatus,
		&newStatus,
		&amount,
		&event.Currency,
		&event.ActorType,
		&actorUserID,
		&event.SourceSystem,
		&sourceReference,
		&notes,
		&metadata,
		&event.CreatedAt,
	); err != nil {
		return err
	}

	event.ParentEntityType = nullStringPtr(parentEntityType)
	event.ParentEntityID = nullInt64Ptr(parentEntityID)
	event.CheckoutSessionID = nullInt64Ptr(checkoutSessionID)
	event.OrderID = nullInt64Ptr(orderID)
	event.PaymentIntentID = nullInt64Ptr(paymentIntentID)
	event.OldStatus = nullStringPtr(oldStatus)
	event.NewStatus = nullStringPtr(newStatus)
	event.Amount = nullFloat64Ptr(amount)
	event.ActorUserID = nullInt64Ptr(actorUserID)
	event.SourceReference = nullStringPtr(sourceReference)
	event.Notes = nullStringPtr(notes)
	event.Metadata = metadata
	return nil
}

func scanFinanceException(scanner rowScanner, financeException *FinanceException) error {
	var orderID sql.NullInt64
	var checkoutSessionID sql.NullInt64
	var paymentIntentID sql.NullInt64
	var disputeCaseID sql.NullInt64
	var returnID sql.NullInt64
	var assignedToUserID sql.NullInt64
	var resolutionNote sql.NullString
	var metadata sql.NullString
	var resolvedAt sql.NullTime

	if err := scanner.Scan(
		&financeException.ExceptionID,
		&financeException.EntityType,
		&financeException.EntityID,
		&financeException.SourceType,
		&orderID,
		&checkoutSessionID,
		&paymentIntentID,
		&disputeCaseID,
		&returnID,
		&financeException.ExceptionType,
		&financeException.Severity,
		&financeException.Status,
		&assignedToUserID,
		&resolutionNote,
		&metadata,
		&financeException.CreatedAt,
		&resolvedAt,
	); err != nil {
		return err
	}

	financeException.OrderID = nullInt64Ptr(orderID)
	financeException.CheckoutSessionID = nullInt64Ptr(checkoutSessionID)
	financeException.PaymentIntentID = nullInt64Ptr(paymentIntentID)
	financeException.DisputeCaseID = nullInt64Ptr(disputeCaseID)
	financeException.ReturnID = nullInt64Ptr(returnID)
	financeException.AssignedToUserID = nullInt64Ptr(assignedToUserID)
	financeException.ResolutionNote = nullStringPtr(resolutionNote)
	financeException.Metadata = nullStringPtr(metadata)
	financeException.ResolvedAt = nullTimePtr(resolvedAt)
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

func nullFloat64Ptr(v sql.NullFloat64) *float64 {
	if !v.Valid {
		return nil
	}
	f := v.Float64
	return &f
}

func nullIfEmptyStrings(values []string) interface{} {
	if len(values) == 0 {
		return nil
	}
	return values
}
