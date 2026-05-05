package banking

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/checkout"
	financepkg "farmerapp/internal/finance"

	"github.com/pashagolub/pgxmock"
)

func TestInitiatePaymentUsesAuthorizationHeaderAndNormalizesPaymentURL(t *testing.T) {
	repo := NewPaymentRepository()
	creds := &MerchantCredentials{
		MerchantID:  "MERCH_TEST",
		MerchantKey: "SECRET_KEY",
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/initiatePayment" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer "+creds.MerchantID {
			t.Fatalf("expected Authorization header, got %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(InitiatePaymentResponse{
			Success: true,
			Message: "ok",
			Data: InitiatePaymentResponseData{
				PaymentID:  "PAY_123",
				Status:     PaymentStatusPending,
				PaymentURL: "/api/processPayment/PAY_123",
				Checksum:   "checksum",
			},
		})
	}))
	defer server.Close()

	service := NewPaymentService(repo, creds, server.URL)
	resp, err := service.InitiatePayment(CreatePaymentOrderRequest{
		UserID:      7,
		Amount:      125.5,
		Currency:    "INR",
		Description: "test order",
	})
	if err != nil {
		t.Fatalf("InitiatePayment returned error: %v", err)
	}

	wantURL := server.URL + "/api/processPayment/PAY_123"
	if resp.PaymentURL != wantURL {
		t.Fatalf("expected normalized payment URL %q, got %q", wantURL, resp.PaymentURL)
	}
}

func TestSyncPaymentStatusUsesAuthorizationHeader(t *testing.T) {
	repo := NewPaymentRepository()
	creds := &MerchantCredentials{
		MerchantID:  "MERCH_TEST",
		MerchantKey: "SECRET_KEY",
	}

	order := &PaymentOrder{
		UserID:   7,
		OrderID:  "ORDER_NO_0000001",
		Amount:   99,
		Currency: "INR",
		Status:   PaymentStatusInitiated,
	}
	if err := repo.CreateOrder(order); err != nil {
		t.Fatalf("CreateOrder returned error: %v", err)
	}
	if err := repo.UpdateOrderWithPaymentID(order.OrderID, "PAY_123", "checksum"); err != nil {
		t.Fatalf("UpdateOrderWithPaymentID returned error: %v", err)
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer "+creds.MerchantID {
			t.Fatalf("expected Authorization header, got %q", got)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true,"data":{"status":"initiated","transaction_id":""}}`))
	}))
	defer server.Close()

	service := NewPaymentService(repo, creds, server.URL)
	if err := service.SyncPaymentStatus(order.OrderID); err != nil {
		t.Fatalf("SyncPaymentStatus returned error: %v", err)
	}
}

func TestSyncActiveIntentWithSessionFailureExpiresIntentAndCancelsAllocations(t *testing.T) {
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

	service := NewPaymentService(NewPaymentRepository(), &MerchantCredentials{
		MerchantID:  "MERCH_TEST",
		MerchantKey: "SECRET_KEY",
	}, "http://example.com")

	now := time.Now()
	timeoutMessage := "Payment was not completed within the allowed time window"

	session := &checkout.CheckoutSession{
		CheckoutSessionID:       91,
		Status:                  checkout.StatusPaymentFailed,
		LastPaymentErrorCode:    stringPtr("timeout"),
		LastPaymentErrorMessage: stringPtr(timeoutMessage),
		CreatedAt:               now.Add(-10 * time.Minute),
	}
	intent := &financepkg.PaymentIntent{
		PaymentIntentID:   41,
		CheckoutSessionID: 91,
		RetailerID:        7,
		ProviderCode:      "gateway",
		GrossAmount:       168.76,
		Status:            financepkg.PaymentIntentStatusPending,
		IdempotencyKey:    "intent-key",
		CreatedAt:         now.Add(-5 * time.Minute),
		UpdatedAt:         now.Add(-5 * time.Minute),
	}

	mockDB.ExpectQuery(`UPDATE finance_schema\.payment_intents`).
		WithArgs(
			int64(41),
			financepkg.PaymentIntentStatusExpired,
			stringPtr("timeout"),
			stringPtr(timeoutMessage),
			(*string)(nil),
			nil,
		).
		WillReturnRows(
			pgxmock.NewRows([]string{
				"payment_intent_id",
				"checkout_session_id",
				"retailer_id",
				"provider_code",
				"provider_order_id",
				"provider_payment_id",
				"currency",
				"goods_amount",
				"delivery_amount",
				"platform_fee_amount",
				"handling_charge_amount",
				"gross_amount",
				"captured_amount",
				"refunded_amount",
				"status",
				"idempotency_key",
				"initiated_at",
				"collected_at",
				"failed_at",
				"last_error_code",
				"last_error_message",
				"provider_response",
				"created_at",
				"updated_at",
			}).AddRow(
				int64(41),
				int64(91),
				int64(7),
				"gateway",
				sql.NullString{},
				sql.NullString{},
				"INR",
				118.76,
				50.0,
				0.0,
				0.0,
				168.76,
				0.0,
				0.0,
				financepkg.PaymentIntentStatusExpired,
				"intent-key",
				sql.NullTime{},
				sql.NullTime{},
				sql.NullTime{Time: now, Valid: true},
				sql.NullString{String: "timeout", Valid: true},
				sql.NullString{String: timeoutMessage, Valid: true},
				[]byte(nil),
				now.Add(-5*time.Minute),
				now,
			),
		)

	mockDB.ExpectQuery(`UPDATE finance_schema\.payment_attempts`).
		WithArgs(
			int64(41),
			financepkg.PaymentAttemptStatusExpired,
			nil,
			stringPtr("timeout"),
			stringPtr(timeoutMessage),
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
				int64(7),
				int64(41),
				"gateway",
				sql.NullString{},
				sql.NullString{},
				sql.NullString{},
				168.76,
				financepkg.PaymentAttemptStatusExpired,
				"attempt:41:1",
				[]byte(nil),
				[]byte(nil),
				sql.NullString{String: "timeout", Valid: true},
				sql.NullString{String: timeoutMessage, Valid: true},
				sql.NullTime{Time: now.Add(-5 * time.Minute), Valid: true},
				sql.NullTime{Time: now, Valid: true},
				now.Add(-5*time.Minute),
				now,
			),
		)

	mockDB.ExpectExec(`UPDATE finance_schema\.settlement_allocations`).
		WithArgs(
			int64(41),
			financepkg.SettlementAllocationStatusCancelled,
			stringPtr("timeout"),
			stringPtr(timeoutMessage),
		).
		WillReturnResult(pgxmock.NewResult("UPDATE", 2))

	updatedIntent, err := service.syncActiveIntentWithSessionFailure(context.Background(), nil, session, intent, now)
	if err != nil {
		t.Fatalf("syncActiveIntentWithSessionFailure returned error: %v", err)
	}

	if updatedIntent.Status != financepkg.PaymentIntentStatusExpired {
		t.Fatalf("expected updated intent status %q, got %q", financepkg.PaymentIntentStatusExpired, updatedIntent.Status)
	}
	if updatedIntent.LastErrorCode == nil || *updatedIntent.LastErrorCode != "timeout" {
		t.Fatalf("expected timeout error code on updated intent")
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}

func TestCreateInitialAllocationsReleasesPlatformAndHandlingCharges(t *testing.T) {
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

	service := NewPaymentService(NewPaymentRepository(), &MerchantCredentials{
		MerchantID:  "MERCH_TEST",
		MerchantKey: "SECRET_KEY",
	}, "http://example.com")

	now := time.Now()
	var nilInt64 *int64
	var nilTime *time.Time
	var nilString *string
	session := &checkout.CheckoutSession{
		CheckoutSessionID: 88,
		RetailerID:        7,
		GoodsAmount:       100,
		DeliveryAmount:    25,
		GrossAmount:       125,
	}
	intent := &financepkg.PaymentIntent{
		PaymentIntentID:      55,
		CheckoutSessionID:    88,
		RetailerID:           7,
		PlatformFeeAmount:    5,
		HandlingChargeAmount: 2,
		GrossAmount:          132,
	}
	items := []checkout.CheckoutSessionItem{
		{
			CheckoutSessionID: 88,
			WholesellerID:     4,
			LineFinalAmount:   100,
			TaxAmount:         0,
		},
	}

	mockDB.ExpectQuery(`INSERT INTO finance_schema\.settlement_allocations`).
		WithArgs(
			int64(55),
			int64(88),
			nilInt64,
			nilInt64,
			"wholeseller_payable",
			"wholeseller",
			int64(4),
			100.0,
			0.0,
			0.0,
			0.0,
			100.0,
			financepkg.SettlementAllocationStatusHold,
			nilTime,
			stringPtr("awaiting_capture_and_release"),
			"system",
			nilInt64,
			nilTime,
			nilString,
		).
		WillReturnRows(mockSettlementAllocationRow(
			1,
			55,
			88,
			nil,
			nil,
			"wholeseller_payable",
			"wholeseller",
			4,
			100,
			0,
			0,
			0,
			100,
			financepkg.SettlementAllocationStatusHold,
			nil,
			stringPtr("awaiting_capture_and_release"),
			"system",
			nil,
			nil,
			nil,
			nil,
			nil,
			nil,
			now,
			now,
		))

	mockDB.ExpectQuery(`INSERT INTO finance_schema\.settlement_allocations`).
		WithArgs(
			int64(55),
			int64(88),
			nilInt64,
			nilInt64,
			"transporter_payable",
			"transport_pending",
			int64(88),
			25.0,
			0.0,
			0.0,
			0.0,
			25.0,
			financepkg.SettlementAllocationStatusHold,
			nilTime,
			stringPtr("awaiting_driver_assignment"),
			"system",
			nilInt64,
			nilTime,
			nilString,
		).
		WillReturnRows(mockSettlementAllocationRow(
			2,
			55,
			88,
			nil,
			nil,
			"transporter_payable",
			"transport_pending",
			88,
			25,
			0,
			0,
			0,
			25,
			financepkg.SettlementAllocationStatusHold,
			nil,
			stringPtr("awaiting_driver_assignment"),
			"system",
			nil,
			nil,
			nil,
			nil,
			nil,
			nil,
			now,
			now,
		))

	mockDB.ExpectQuery(`INSERT INTO finance_schema\.settlement_allocations`).
		WithArgs(
			int64(55),
			int64(88),
			nilInt64,
			nilInt64,
			"platform_fee",
			"platform",
			int64(1),
			5.0,
			0.0,
			0.0,
			0.0,
			5.0,
			financepkg.SettlementAllocationStatusReleased,
			nilTime,
			nilString,
			"system",
			nilInt64,
			nilTime,
			nilString,
		).
		WillReturnRows(mockSettlementAllocationRow(
			3,
			55,
			88,
			nil,
			nil,
			"platform_fee",
			"platform",
			1,
			5,
			0,
			0,
			0,
			5,
			financepkg.SettlementAllocationStatusReleased,
			nil,
			nil,
			"system",
			nil,
			nil,
			nil,
			nil,
			nil,
			nil,
			now,
			now,
		))

	mockDB.ExpectQuery(`INSERT INTO finance_schema\.settlement_allocations`).
		WithArgs(
			int64(55),
			int64(88),
			nilInt64,
			nilInt64,
			"handling_charge",
			"platform",
			int64(1),
			2.0,
			0.0,
			0.0,
			0.0,
			2.0,
			financepkg.SettlementAllocationStatusReleased,
			nilTime,
			nilString,
			"system",
			nilInt64,
			nilTime,
			nilString,
		).
		WillReturnRows(mockSettlementAllocationRow(
			4,
			55,
			88,
			nil,
			nil,
			"handling_charge",
			"platform",
			1,
			2,
			0,
			0,
			0,
			2,
			financepkg.SettlementAllocationStatusReleased,
			nil,
			nil,
			"system",
			nil,
			nil,
			nil,
			nil,
			nil,
			nil,
			now,
			now,
		))

	if err := service.createInitialAllocations(context.Background(), mockDB, session, intent, items); err != nil {
		t.Fatalf("createInitialAllocations returned error: %v", err)
	}

	if err := mockDB.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet db expectations: %v", err)
	}
}

func TestCallGatewayInitiatePaymentSyncsMerchantEndpointsWhenConfigured(t *testing.T) {
	repo := NewPaymentRepository()
	creds := &MerchantCredentials{
		MerchantID:  "MERCH_TEST",
		MerchantKey: "SECRET_KEY",
	}

	sawMerchantSync := false
	sawPaymentInit := false

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPut && r.URL.Path == "/api/merchant/"+creds.MerchantID:
			sawMerchantSync = true
			if got := r.Header.Get("Authorization"); got != "Bearer "+creds.MerchantID {
				t.Fatalf("expected merchant sync Authorization header, got %q", got)
			}
			var payload map[string]string
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				t.Fatalf("failed to decode merchant sync payload: %v", err)
			}
			if payload["return_url"] != "http://127.0.0.1:3000/payments/return" {
				t.Fatalf("unexpected return_url payload: %#v", payload)
			}
			if payload["callback_url"] != "http://127.0.0.1:8085/payments/callback" {
				t.Fatalf("unexpected callback_url payload: %#v", payload)
			}
			w.Header().Set("Content-Type", "application/json")
			_, _ = io.WriteString(w, `{"status":"success"}`)
			return
		case r.Method == http.MethodPost && r.URL.Path == "/api/initiatePayment":
			sawPaymentInit = true
			if got := r.Header.Get("Authorization"); got != "Bearer "+creds.MerchantID {
				t.Fatalf("expected payment init Authorization header, got %q", got)
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(InitiatePaymentResponse{
				Success: true,
				Message: "ok",
				Data: InitiatePaymentResponseData{
					PaymentID:  "PAY_123",
					Status:     PaymentStatusPending,
					PaymentURL: "/api/processPayment/PAY_123",
					Checksum:   "checksum",
				},
			})
			return
		default:
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	service := NewPaymentService(repo, creds, server.URL)
	service.returnURL = "http://127.0.0.1:3000/payments/return"
	service.callbackURL = "http://127.0.0.1:8085/payments/callback"

	resp, err := service.InitiatePayment(CreatePaymentOrderRequest{
		UserID:      7,
		Amount:      125.5,
		Currency:    "INR",
		Description: "test order",
	})
	if err != nil {
		t.Fatalf("InitiatePayment returned error: %v", err)
	}

	if !sawMerchantSync {
		t.Fatalf("expected merchant endpoint sync call before payment initiation")
	}
	if !sawPaymentInit {
		t.Fatalf("expected gateway payment initiation call")
	}

	wantURL := server.URL + "/api/processPayment/PAY_123"
	if resp.PaymentURL != wantURL {
		t.Fatalf("expected normalized payment URL %q, got %q", wantURL, resp.PaymentURL)
	}
}

func mockSettlementAllocationRow(
	allocationID int64,
	paymentIntentID int64,
	checkoutSessionID int64,
	orderID *int64,
	jobID *int64,
	allocationType string,
	payeeType string,
	payeeID int64,
	grossAmount float64,
	feeAmount float64,
	taxAmount float64,
	holdAmount float64,
	netPayable float64,
	status string,
	releaseAfter *time.Time,
	holdReason *string,
	holdSource string,
	heldByUserID *int64,
	heldAt *time.Time,
	releaseBlockReason *string,
	releaseApprovedBy *int64,
	releaseApprovedAt *time.Time,
	adminNote *string,
	createdAt time.Time,
	updatedAt time.Time,
) *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"allocation_id",
		"payment_intent_id",
		"checkout_session_id",
		"order_id",
		"job_id",
		"allocation_type",
		"payee_type",
		"payee_id",
		"gross_amount",
		"fee_amount",
		"tax_amount",
		"hold_amount",
		"net_payable",
		"status",
		"release_after",
		"hold_reason",
		"hold_source",
		"held_by_user_id",
		"held_at",
		"release_block_reason",
		"release_approved_by",
		"release_approved_at",
		"admin_note",
		"created_at",
		"updated_at",
	}).AddRow(
		allocationID,
		paymentIntentID,
		checkoutSessionID,
		nullInt64(orderID),
		nullInt64(jobID),
		allocationType,
		payeeType,
		payeeID,
		grossAmount,
		feeAmount,
		taxAmount,
		holdAmount,
		netPayable,
		status,
		nullTime(releaseAfter),
		nullString(holdReason),
		holdSource,
		nullInt64(heldByUserID),
		nullTime(heldAt),
		nullString(releaseBlockReason),
		nullInt64(releaseApprovedBy),
		nullTime(releaseApprovedAt),
		nullString(adminNote),
		createdAt,
		updatedAt,
	)
}

func nullInt64(value *int64) sql.NullInt64 {
	if value == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: *value, Valid: true}
}

func nullTime(value *time.Time) sql.NullTime {
	if value == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *value, Valid: true}
}

func nullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}
