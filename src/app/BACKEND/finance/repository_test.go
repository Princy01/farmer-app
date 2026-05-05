package finance

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"farmerapp/go_backend/db"

	"github.com/pashagolub/pgxmock"
)

func TestPaymentAttemptLifecycle(t *testing.T) {
	mockDB, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("failed to create mock db: %v", err)
	}
	defer mockDB.Close()

	originalPool := db.Pool
	db.Pool = mockDB
	defer func() {
		db.Pool = originalPool
	}()

	repository := NewRepository()
	now := time.Now()
	requestPayload := []byte(`{"amount":168.76}`)
	responsePayload := []byte(`{"payment_id":"PAY_123"}`)
	completedPayload := []byte(`{"status":"success"}`)
	providerOrderID := "ORDER_NO_0000001"
	providerPaymentID := "PAY_123"
	providerTransactionID := "TXN_123"

	mockDB.ExpectQuery(`INSERT INTO finance_schema\.payment_attempts`).
		WithArgs(
			int64(55),
			"gateway",
			&providerOrderID,
			(*string)(nil),
			168.76,
			PaymentAttemptStatusInitiated,
			"attempt:55:1",
			requestPayload,
			nil,
			(*string)(nil),
			(*string)(nil),
			&now,
			(*time.Time)(nil),
		).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"payment_attempt_id",
				"payment_intent_id",
				"provider_code",
				"provider_order_id",
				"provider_payment_id",
				"provider_transaction_id",
				"amount",
				"status",
				"idempotency_key",
				"request_payload",
				"response_payload",
				"last_error_code",
				"last_error_message",
				"initiated_at",
				"completed_at",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(1),
				int64(55),
				"gateway",
				sql.NullString{String: providerOrderID, Valid: true},
				sql.NullString{},
				sql.NullString{},
				168.76,
				PaymentAttemptStatusInitiated,
				"attempt:55:1",
				requestPayload,
				[]byte(nil),
				sql.NullString{},
				sql.NullString{},
				sql.NullTime{Time: now, Valid: true},
				sql.NullTime{},
				now,
				now,
			),
		)

	attempt, err := repository.CreatePaymentAttempt(context.Background(), nil, CreatePaymentAttemptParams{
		PaymentIntentID: 55,
		ProviderCode:    "gateway",
		ProviderOrderID: &providerOrderID,
		Amount:          168.76,
		Status:          PaymentAttemptStatusInitiated,
		IdempotencyKey:  "attempt:55:1",
		RequestPayload:  requestPayload,
		InitiatedAt:     &now,
	})
	if err != nil {
		t.Fatalf("CreatePaymentAttempt returned error: %v", err)
	}
	if attempt.PaymentAttemptID != 1 {
		t.Fatalf("expected payment_attempt_id 1, got %d", attempt.PaymentAttemptID)
	}

	mockDB.ExpectQuery(`UPDATE finance_schema\.payment_attempts`).
		WithArgs(
			int64(55),
			providerOrderID,
			providerPaymentID,
			PaymentAttemptStatusPending,
			responsePayload,
		).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"payment_attempt_id",
				"payment_intent_id",
				"provider_code",
				"provider_order_id",
				"provider_payment_id",
				"provider_transaction_id",
				"amount",
				"status",
				"idempotency_key",
				"request_payload",
				"response_payload",
				"last_error_code",
				"last_error_message",
				"initiated_at",
				"completed_at",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(1),
				int64(55),
				"gateway",
				sql.NullString{String: providerOrderID, Valid: true},
				sql.NullString{String: providerPaymentID, Valid: true},
				sql.NullString{},
				168.76,
				PaymentAttemptStatusPending,
				"attempt:55:1",
				requestPayload,
				responsePayload,
				sql.NullString{},
				sql.NullString{},
				sql.NullTime{Time: now, Valid: true},
				sql.NullTime{},
				now,
				now,
			),
		)

	attempt, err = repository.UpdatePaymentAttemptGatewayInit(context.Background(), nil, UpdatePaymentAttemptGatewayInitParams{
		PaymentIntentID:   55,
		ProviderOrderID:   providerOrderID,
		ProviderPaymentID: providerPaymentID,
		Status:            PaymentAttemptStatusPending,
		ResponsePayload:   responsePayload,
	})
	if err != nil {
		t.Fatalf("UpdatePaymentAttemptGatewayInit returned error: %v", err)
	}
	if attempt.Status != PaymentAttemptStatusPending {
		t.Fatalf("expected pending status, got %q", attempt.Status)
	}

	mockDB.ExpectQuery(`UPDATE finance_schema\.payment_attempts`).
		WithArgs(
			"gateway",
			providerOrderID,
			&providerPaymentID,
			&providerTransactionID,
			PaymentAttemptStatusCaptured,
			completedPayload,
			(*string)(nil),
			(*string)(nil),
			&now,
		).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"payment_attempt_id",
				"payment_intent_id",
				"provider_code",
				"provider_order_id",
				"provider_payment_id",
				"provider_transaction_id",
				"amount",
				"status",
				"idempotency_key",
				"request_payload",
				"response_payload",
				"last_error_code",
				"last_error_message",
				"initiated_at",
				"completed_at",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(1),
				int64(55),
				"gateway",
				sql.NullString{String: providerOrderID, Valid: true},
				sql.NullString{String: providerPaymentID, Valid: true},
				sql.NullString{String: providerTransactionID, Valid: true},
				168.76,
				PaymentAttemptStatusCaptured,
				"attempt:55:1",
				requestPayload,
				completedPayload,
				sql.NullString{},
				sql.NullString{},
				sql.NullTime{Time: now, Valid: true},
				sql.NullTime{Time: now, Valid: true},
				now,
				now,
			),
		)

	attempt, err = repository.UpdatePaymentAttemptTerminal(context.Background(), nil, UpdatePaymentAttemptTerminalParams{
		ProviderCode:          "gateway",
		ProviderOrderID:       providerOrderID,
		ProviderPaymentID:     &providerPaymentID,
		ProviderTransactionID: &providerTransactionID,
		Status:                PaymentAttemptStatusCaptured,
		ResponsePayload:       completedPayload,
		CompletedAt:           &now,
	})
	if err != nil {
		t.Fatalf("UpdatePaymentAttemptTerminal returned error: %v", err)
	}
	if attempt.ProviderTransactionID == nil || *attempt.ProviderTransactionID != providerTransactionID {
		t.Fatalf("expected provider transaction id to be set")
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}
