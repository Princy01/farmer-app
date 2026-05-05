package checkout

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"farmerapp/go_backend/db"

	"github.com/pashagolub/pgxmock"
)

func TestCreateCheckoutSession(t *testing.T) {
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
	sourceCartDate := time.Date(2026, 5, 4, 0, 0, 0, 0, time.UTC)

	mockDB.ExpectQuery(`INSERT INTO business_schema\.checkout_sessions`).
		WithArgs(
			int64(77),
			12,
			3,
			&sourceCartDate,
			"INR",
			100.0,
			10.0,
			110.0,
			"Delhi delivery address",
			StatusCreated,
			"checkout-key-1",
			"request-hash-1",
		).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"checkout_session_id",
				"retailer_id",
				"retailer_user_id",
				"retailer_branch_id",
				"source_cart_date",
				"currency",
				"goods_amount",
				"delivery_amount",
				"gross_amount",
				"delivery_address",
				"status",
				"idempotency_key",
				"request_hash",
				"current_payment_intent_id",
				"payment_started_at",
				"payment_captured_at",
				"payment_failed_at",
				"expired_at",
				"cancelled_at",
				"materialized_at",
				"cancel_reason",
				"last_payment_error_code",
				"last_payment_error_message",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(101),
				int64(77),
				12,
				3,
				sql.NullTime{Time: sourceCartDate, Valid: true},
				"INR",
				100.0,
				10.0,
				110.0,
				"Delhi delivery address",
				StatusCreated,
				"checkout-key-1",
				"request-hash-1",
				nil,
				nil,
				nil,
				nil,
				nil,
				nil,
				nil,
				nil,
				nil,
				nil,
				now,
				now,
			),
		)

	session, err := repository.CreateCheckoutSession(context.Background(), nil, CreateCheckoutSessionParams{
		RetailerID:       77,
		RetailerUserID:   12,
		RetailerBranchID: 3,
		SourceCartDate:   &sourceCartDate,
		Currency:         "INR",
		GoodsAmount:      100,
		DeliveryAmount:   10,
		GrossAmount:      110,
		DeliveryAddress:  "Delhi delivery address",
		Status:           StatusCreated,
		IdempotencyKey:   "checkout-key-1",
		RequestHash:      "request-hash-1",
	})
	if err != nil {
		t.Fatalf("CreateCheckoutSession returned error: %v", err)
	}

	if session.CheckoutSessionID != 101 {
		t.Fatalf("expected checkout_session_id 101, got %d", session.CheckoutSessionID)
	}
	if session.GrossAmount != 110 {
		t.Fatalf("expected gross_amount 110, got %.2f", session.GrossAmount)
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}

func TestListRetailerCheckoutSessionsByStatus(t *testing.T) {
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

	mockDB.ExpectQuery(`FROM business_schema\.checkout_sessions`).
		WithArgs(int64(77), []string{StatusPaymentPending, StatusPaymentFailed}, 20).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"checkout_session_id",
				"retailer_id",
				"retailer_user_id",
				"retailer_branch_id",
				"source_cart_date",
				"currency",
				"goods_amount",
				"delivery_amount",
				"gross_amount",
				"delivery_address",
				"status",
				"idempotency_key",
				"request_hash",
				"current_payment_intent_id",
				"payment_started_at",
				"payment_captured_at",
				"payment_failed_at",
				"expired_at",
				"cancelled_at",
				"materialized_at",
				"cancel_reason",
				"last_payment_error_code",
				"last_payment_error_message",
				"created_at",
				"updated_at",
			}).
				AddRow(
					int64(201),
					int64(77),
					12,
					3,
					sql.NullTime{},
					"INR",
					120.0,
					10.0,
					130.0,
					"Address 1",
					StatusPaymentPending,
					"key-201",
					"hash-201",
					nil,
					sql.NullTime{Time: now, Valid: true},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullString{},
					sql.NullString{},
					sql.NullString{},
					now,
					now,
				).
				AddRow(
					int64(202),
					int64(77),
					12,
					3,
					sql.NullTime{},
					"INR",
					99.0,
					8.0,
					107.0,
					"Address 2",
					StatusPaymentFailed,
					"key-202",
					"hash-202",
					nil,
					sql.NullTime{Time: now, Valid: true},
					sql.NullTime{},
					sql.NullTime{Time: now, Valid: true},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullTime{},
					sql.NullString{},
					sql.NullString{String: "GATEWAY_TIMEOUT", Valid: true},
					sql.NullString{String: "payment timed out", Valid: true},
					now,
					now,
				),
		)

	sessions, err := repository.ListRetailerCheckoutSessionsByStatus(
		context.Background(),
		nil,
		77,
		[]string{StatusPaymentPending, StatusPaymentFailed},
		20,
	)
	if err != nil {
		t.Fatalf("ListRetailerCheckoutSessionsByStatus returned error: %v", err)
	}

	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}
	if sessions[0].Status != StatusPaymentPending {
		t.Fatalf("expected first status %q, got %q", StatusPaymentPending, sessions[0].Status)
	}
	if sessions[1].LastPaymentErrorCode == nil || *sessions[1].LastPaymentErrorCode != "GATEWAY_TIMEOUT" {
		t.Fatalf("expected last payment error code to be populated")
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}

func TestCheckoutSessionOrderLifecycle(t *testing.T) {
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

	mockDB.ExpectQuery(`INSERT INTO business_schema\.checkout_session_orders`).
		WithArgs(int64(301), int64(9001), 44).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"checkout_session_order_id",
				"checkout_session_id",
				"order_id",
				"wholeseller_id",
				"created_at",
			}).AddRow(
				int64(1),
				int64(301),
				int64(9001),
				44,
				now,
			),
		)

	added, err := repository.AddCheckoutSessionOrder(context.Background(), nil, CreateCheckoutSessionOrderParams{
		CheckoutSessionID: 301,
		OrderID:           9001,
		WholesellerID:     44,
	})
	if err != nil {
		t.Fatalf("AddCheckoutSessionOrder returned error: %v", err)
	}
	if added.OrderID != 9001 {
		t.Fatalf("expected order_id 9001, got %d", added.OrderID)
	}

	mockDB.ExpectQuery(`FROM business_schema\.checkout_session_orders`).
		WithArgs(int64(301)).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"checkout_session_order_id",
				"checkout_session_id",
				"order_id",
				"wholeseller_id",
				"created_at",
			}).AddRow(
				int64(1),
				int64(301),
				int64(9001),
				44,
				now,
			),
		)

	orders, err := repository.ListCheckoutSessionOrders(context.Background(), nil, 301)
	if err != nil {
		t.Fatalf("ListCheckoutSessionOrders returned error: %v", err)
	}
	if len(orders) != 1 {
		t.Fatalf("expected 1 checkout session order, got %d", len(orders))
	}

	mockDB.ExpectQuery(`UPDATE business_schema\.checkout_sessions`).
		WithArgs(int64(301), StatusMaterialized, now).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"checkout_session_id",
				"retailer_id",
				"retailer_user_id",
				"retailer_branch_id",
				"source_cart_date",
				"currency",
				"goods_amount",
				"delivery_amount",
				"gross_amount",
				"delivery_address",
				"status",
				"idempotency_key",
				"request_hash",
				"current_payment_intent_id",
				"payment_started_at",
				"payment_captured_at",
				"payment_failed_at",
				"expired_at",
				"cancelled_at",
				"materialized_at",
				"cancel_reason",
				"last_payment_error_code",
				"last_payment_error_message",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(301),
				int64(77),
				12,
				3,
				sql.NullTime{},
				"INR",
				120.0,
				10.0,
				130.0,
				"Address 3",
				StatusMaterialized,
				"key-301",
				"hash-301",
				nil,
				sql.NullTime{Time: now, Valid: true},
				sql.NullTime{Time: now, Valid: true},
				sql.NullTime{},
				sql.NullTime{},
				sql.NullTime{},
				sql.NullTime{Time: now, Valid: true},
				sql.NullString{},
				sql.NullString{},
				sql.NullString{},
				now,
				now,
			),
		)

	session, err := repository.MarkCheckoutSessionMaterialized(context.Background(), nil, 301, now)
	if err != nil {
		t.Fatalf("MarkCheckoutSessionMaterialized returned error: %v", err)
	}
	if session.Status != StatusMaterialized {
		t.Fatalf("expected status %q, got %q", StatusMaterialized, session.Status)
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}
