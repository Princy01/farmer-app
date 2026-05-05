package banking

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/checkout"
	financepkg "farmerapp/internal/finance"
	orderflow "farmerapp/internal/orders"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
)

type PaymentService struct {
	repo         *PaymentRepository
	checkoutRepo *checkout.Repository
	financeRepo  *financepkg.Repository
	materializer *orderflow.Materializer
	credentials  *MerchantCredentials
	gatewayURL   string
	returnURL    string
	callbackURL  string
	httpClient   *http.Client
}

const checkoutSessionPaymentTimeout = 5 * time.Minute

func NewPaymentService(repo *PaymentRepository, credentials *MerchantCredentials, gatewayURL string) *PaymentService {
	return &PaymentService{
		repo:         repo,
		checkoutRepo: checkout.NewRepository(),
		financeRepo:  financepkg.NewRepository(),
		materializer: orderflow.NewMaterializer(),
		credentials:  credentials,
		gatewayURL:   gatewayURL,
		returnURL:    GetGatewayReturnURL(),
		callbackURL:  GetGatewayCallbackURL(),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type repositoryQueryer interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}

// NewPaymentServiceSimple creates a service with default repository
func NewPaymentServiceSimple(credentials *MerchantCredentials, gatewayURL string) *PaymentService {
	return NewPaymentService(NewPaymentRepository(), credentials, gatewayURL)
}

// InitiatePayment creates order and initiates payment at gateway
func (s *PaymentService) InitiatePayment(req CreatePaymentOrderRequest) (*InitiatePaymentResponseData, error) {
	if req.CheckoutSessionID != 0 {
		return s.initiateCheckoutSessionPayment(req)
	}
	return s.initiateLegacyPayment(req)
}

func (s *PaymentService) initiateLegacyPayment(req CreatePaymentOrderRequest) (*InitiatePaymentResponseData, error) {
	// Validate request
	if req.UserID <= 0 {
		return nil, errors.New("invalid user_id")
	}
	if req.Amount <= 0 {
		return nil, errors.New("amount must be greater than 0")
	}

	// Set defaults
	if req.Currency == "" {
		req.Currency = "INR"
	}

	// Generate order ID
	orderID := GenerateOrderID()

	// Create order in database
	order := &PaymentOrder{
		UserID:      req.UserID,
		OrderID:     orderID,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Description: req.Description,
		Status:      PaymentStatusPending,
	}

	if err := s.repo.CreateOrder(order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Generate checksum for gateway
	amountStr := fmt.Sprintf("%.2f", req.Amount)
	checksum := GeneratePaymentChecksum(
		s.credentials.MerchantID,
		orderID,
		amountStr,
		s.credentials.MerchantKey,
	)

	// Prepare gateway request
	gatewayReq := InitiatePaymentRequest{
		MerchantID: s.credentials.MerchantID,
		OrderID:    orderID,
		Amount:     req.Amount,
		Checksum:   checksum,
	}

	// Call gateway API
	gatewayResp, err := s.callGatewayInitiatePayment(gatewayReq)
	if err != nil {
		// Mark order as failed if gateway call fails
		s.repo.UpdateOrderStatus(orderID, PaymentStatusFailed, fmt.Sprintf("Gateway error: %v", err))
		return nil, fmt.Errorf("gateway error: %w", err)
	}

	if !gatewayResp.Success {
		s.repo.UpdateOrderStatus(orderID, PaymentStatusFailed, gatewayResp.Message)
		return nil, errors.New(gatewayResp.Message)
	}

	// Update order with payment ID from gateway
	err = s.repo.UpdateOrderWithPaymentID(
		orderID,
		gatewayResp.Data.PaymentID,
		gatewayResp.Data.Checksum,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}

	// Attach local order ID to gateway response data so callers receive it
	gatewayResp.Data.OrderID = orderID

	return &gatewayResp.Data, nil
}

func (s *PaymentService) initiateCheckoutSessionPayment(req CreatePaymentOrderRequest) (*InitiatePaymentResponseData, error) {
	if req.UserID <= 0 {
		return nil, errors.New("invalid user_id")
	}
	if req.CheckoutSessionID <= 0 {
		return nil, errors.New("checkout_session_id is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	session, err := s.checkoutRepo.GetCheckoutSessionByID(ctx, nil, req.CheckoutSessionID)
	if err != nil {
		return nil, fmt.Errorf("checkout session not found: %w", err)
	}
	if session.RetailerUserID != req.UserID {
		return nil, errors.New("unauthorized checkout session access")
	}

	currentIntent, err := s.loadCurrentCheckoutPaymentIntent(ctx, session)
	if err != nil {
		return nil, err
	}

	if timedOut := s.sessionTimedOut(session, time.Now()); timedOut &&
		(session.Status == checkout.StatusCreated || session.Status == checkout.StatusPaymentPending) {
		failedSession, err := s.checkoutRepo.MarkCheckoutSessionPaymentFailed(ctx, nil, session.CheckoutSessionID, time.Now(), "timeout", "Payment was not completed within the allowed time window")
		if err != nil {
			return nil, fmt.Errorf("failed to expire stale checkout session: %w", err)
		}
		session = failedSession
		if _, err := s.syncActiveIntentWithSessionFailure(ctx, nil, session, currentIntent, time.Now()); err != nil {
			return nil, fmt.Errorf("failed to expire stale payment intent: %w", err)
		}
		return nil, errors.New("checkout session payment window has expired")
	}

	switch session.Status {
	case checkout.StatusCancelled, checkout.StatusMaterialized, checkout.StatusPaymentCaptured:
		return nil, fmt.Errorf("checkout session cannot start payment from status %s", session.Status)
	}

	if session.Status == checkout.StatusPaymentPending && currentIntent != nil {
		if currentIntent.Status == financepkg.PaymentIntentStatusPending || currentIntent.Status == financepkg.PaymentIntentStatusProviderConfirmationPending {
			if resumed := s.buildResumePaymentResponse(currentIntent); resumed != nil {
				return resumed, nil
			}
		}
	}

	items, err := s.checkoutRepo.ListCheckoutSessionItems(ctx, nil, session.CheckoutSessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to load checkout session items: %w", err)
	}
	if len(items) == 0 {
		return nil, errors.New("checkout session has no items")
	}

	now := time.Now()
	providerCode := req.ProviderCode
	if providerCode == "" {
		providerCode = "gateway"
	}
	currency := session.Currency
	if currency == "" {
		currency = "INR"
	}
	providerOrderID := GenerateOrderID()
	intentKey := fmt.Sprintf("intent:%d:%d", session.CheckoutSessionID, now.UnixNano())

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin payment transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(context.Background())
		}
	}()

	if err := s.closeSupersededCheckoutPaymentIntent(ctx, tx, session, currentIntent, now); err != nil {
		return nil, err
	}

	intent, err := s.financeRepo.CreatePaymentIntent(ctx, tx, financepkg.CreatePaymentIntentParams{
		CheckoutSessionID:    session.CheckoutSessionID,
		RetailerID:           session.RetailerID,
		ProviderCode:         providerCode,
		ProviderOrderID:      &providerOrderID,
		Currency:             currency,
		GoodsAmount:          session.GoodsAmount,
		DeliveryAmount:       session.DeliveryAmount,
		PlatformFeeAmount:    0,
		HandlingChargeAmount: 0,
		GrossAmount:          session.GrossAmount,
		Status:               financepkg.PaymentIntentStatusPending,
		IdempotencyKey:       intentKey,
		InitiatedAt:          &now,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	attemptRequestPayload, err := json.Marshal(map[string]interface{}{
		"checkout_session_id": session.CheckoutSessionID,
		"provider_code":       providerCode,
		"provider_order_id":   providerOrderID,
		"payment_method":      req.PaymentMethod,
		"amount":              intent.GrossAmount,
		"currency":            currency,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to build payment attempt request payload: %w", err)
	}

	if _, err := s.financeRepo.CreatePaymentAttempt(ctx, tx, financepkg.CreatePaymentAttemptParams{
		PaymentIntentID: intent.PaymentIntentID,
		ProviderCode:    providerCode,
		ProviderOrderID: &providerOrderID,
		Amount:          intent.GrossAmount,
		Status:          financepkg.PaymentAttemptStatusInitiated,
		IdempotencyKey:  fmt.Sprintf("attempt:%d:1", intent.PaymentIntentID),
		RequestPayload:  attemptRequestPayload,
		InitiatedAt:     &now,
	}); err != nil {
		return nil, fmt.Errorf("failed to create payment attempt: %w", err)
	}

	if err := s.createInitialAllocations(ctx, tx, session, intent, items); err != nil {
		return nil, err
	}

	if _, err := s.checkoutRepo.MarkCheckoutSessionPaymentPending(ctx, tx, session.CheckoutSessionID, intent.PaymentIntentID, now); err != nil {
		return nil, fmt.Errorf("failed to update checkout session payment state: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit payment intent transaction: %w", err)
	}
	committed = true

	amountStr := fmt.Sprintf("%.2f", intent.GrossAmount)
	checksum := GeneratePaymentChecksum(
		s.credentials.MerchantID,
		providerOrderID,
		amountStr,
		s.credentials.MerchantKey,
	)

	gatewayResp, err := s.callGatewayInitiatePayment(InitiatePaymentRequest{
		MerchantID: s.credentials.MerchantID,
		OrderID:    providerOrderID,
		Amount:     intent.GrossAmount,
		Checksum:   checksum,
	})
	if err != nil {
		responsePayload, _ := json.Marshal(map[string]interface{}{
			"gateway_error": err.Error(),
		})
		_, _ = s.financeRepo.UpdatePaymentIntentFailure(context.Background(), nil, financepkg.UpdatePaymentIntentFailureParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentIntentStatusFailed,
			LastErrorCode:    stringPtr("gateway_error"),
			LastErrorMessage: stringPtr(fmt.Sprintf("Gateway error: %v", err)),
		})
		_, _ = s.financeRepo.UpdatePaymentAttemptFailureByIntent(context.Background(), nil, financepkg.UpdatePaymentAttemptFailureByIntentParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentAttemptStatusFailed,
			ResponsePayload:  responsePayload,
			LastErrorCode:    stringPtr("gateway_error"),
			LastErrorMessage: stringPtr(fmt.Sprintf("Gateway error: %v", err)),
			CompletedAt:      timePtr(time.Now()),
		})
		_ = s.cancelIntentAllocations(context.Background(), nil, intent.PaymentIntentID, "gateway_error", fmt.Sprintf("Gateway error: %v", err))
		_, _ = s.checkoutRepo.MarkCheckoutSessionPaymentFailed(context.Background(), nil, session.CheckoutSessionID, time.Now(), "gateway_error", fmt.Sprintf("Gateway error: %v", err))
		return nil, fmt.Errorf("gateway error: %w", err)
	}

	if !gatewayResp.Success {
		responsePayload, _ := json.Marshal(gatewayResp)
		_, _ = s.financeRepo.UpdatePaymentIntentFailure(context.Background(), nil, financepkg.UpdatePaymentIntentFailureParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentIntentStatusFailed,
			LastErrorCode:    stringPtr("gateway_declined"),
			LastErrorMessage: stringPtr(gatewayResp.Message),
		})
		_, _ = s.financeRepo.UpdatePaymentAttemptFailureByIntent(context.Background(), nil, financepkg.UpdatePaymentAttemptFailureByIntentParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentAttemptStatusFailed,
			ResponsePayload:  responsePayload,
			LastErrorCode:    stringPtr("gateway_declined"),
			LastErrorMessage: stringPtr(gatewayResp.Message),
			CompletedAt:      timePtr(time.Now()),
		})
		_ = s.cancelIntentAllocations(context.Background(), nil, intent.PaymentIntentID, "gateway_declined", gatewayResp.Message)
		_, _ = s.checkoutRepo.MarkCheckoutSessionPaymentFailed(context.Background(), nil, session.CheckoutSessionID, time.Now(), "gateway_declined", gatewayResp.Message)
		return nil, errors.New(gatewayResp.Message)
	}

	providerResponse, _ := json.Marshal(gatewayResp)
	updatedIntent, err := s.financeRepo.UpdatePaymentIntentGatewayInit(context.Background(), nil, financepkg.UpdatePaymentIntentGatewayInitParams{
		PaymentIntentID:   intent.PaymentIntentID,
		ProviderOrderID:   providerOrderID,
		ProviderPaymentID: gatewayResp.Data.PaymentID,
		Status:            financepkg.PaymentIntentStatusPending,
		ProviderResponse:  providerResponse,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to store gateway payment details: %w", err)
	}

	if _, err := s.financeRepo.UpdatePaymentAttemptGatewayInit(context.Background(), nil, financepkg.UpdatePaymentAttemptGatewayInitParams{
		PaymentIntentID:   intent.PaymentIntentID,
		ProviderOrderID:   providerOrderID,
		ProviderPaymentID: gatewayResp.Data.PaymentID,
		Status:            financepkg.PaymentAttemptStatusPending,
		ResponsePayload:   providerResponse,
	}); err != nil {
		return nil, fmt.Errorf("failed to update payment attempt gateway init: %w", err)
	}

	gatewayResp.Data.OrderID = providerOrderID
	gatewayResp.Data.CheckoutSessionID = &session.CheckoutSessionID
	gatewayResp.Data.PaymentIntentID = &updatedIntent.PaymentIntentID
	gatewayResp.Data.GrossAmount = updatedIntent.GrossAmount

	return &gatewayResp.Data, nil
}

// callGatewayInitiatePayment makes HTTP call to gateway
func (s *PaymentService) callGatewayInitiatePayment(req InitiatePaymentRequest) (*InitiatePaymentResponse, error) {
	if err := s.syncGatewayMerchantEndpoints(); err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/api/initiatePayment", s.gatewayURL)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Merchant-ID", s.credentials.MerchantID)
	httpReq.Header.Set("X-Merchant-Key", s.credentials.MerchantKey)
	httpReq.Header.Set("Authorization", "Bearer "+s.credentials.MerchantID)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call gateway: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gateway returned status %d: %s", resp.StatusCode, string(body))
	}

	var gatewayResp InitiatePaymentResponse
	if err := json.Unmarshal(body, &gatewayResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if gatewayResp.Data.PaymentURL != "" && strings.HasPrefix(gatewayResp.Data.PaymentURL, "/") {
		gatewayResp.Data.PaymentURL = strings.TrimRight(s.gatewayURL, "/") + gatewayResp.Data.PaymentURL
	}

	return &gatewayResp, nil
}

func (s *PaymentService) syncGatewayMerchantEndpoints() error {
	if strings.TrimSpace(s.returnURL) == "" && strings.TrimSpace(s.callbackURL) == "" {
		return nil
	}

	payload := map[string]string{}
	if strings.TrimSpace(s.returnURL) != "" {
		payload["return_url"] = strings.TrimSpace(s.returnURL)
	}
	if strings.TrimSpace(s.callbackURL) != "" {
		payload["callback_url"] = strings.TrimSpace(s.callbackURL)
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal merchant callback sync payload: %w", err)
	}

	url := fmt.Sprintf("%s/api/merchant/%s", strings.TrimRight(s.gatewayURL, "/"), s.credentials.MerchantID)
	httpReq, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create merchant callback sync request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.credentials.MerchantID)
	httpReq.Header.Set("X-Merchant-ID", s.credentials.MerchantID)
	httpReq.Header.Set("X-Merchant-Key", s.credentials.MerchantKey)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to sync merchant callback urls: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("merchant callback sync failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// HandleCallback processes payment callback from gateway
func (s *PaymentService) HandleCallback(callback *PaymentCallback) error {
	signatureValid := s.verifyCallbackChecksum(callback)
	merchantValid := callback.MerchantID == s.credentials.MerchantID

	rawCallback := callback.RawBody
	if len(rawCallback) == 0 {
		rawCallback, _ = json.Marshal(callback)
	}

	if db.Pool != nil {
		ctx := context.Background()
		now := time.Now()
		tx, err := db.Pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin callback transaction: %w", err)
		}
		committed := false
		defer func() {
			if !committed {
				_ = tx.Rollback(context.Background())
			}
		}()

		webhookEvent, err := s.financeRepo.CreatePaymentWebhookEvent(ctx, tx, financepkg.CreatePaymentWebhookEventParams{
			ProviderCode:      "gateway",
			ProviderEventID:   s.deriveProviderEventID(callback),
			EventType:         s.callbackEventType(callback),
			ProviderOrderID:   stringPtr(callback.OrderID),
			ProviderPaymentID: callback.PaymentID,
			RawBody:           stringPtr(string(rawCallback)),
			Payload:           rawCallback,
			SignatureValid:    signatureValid,
			Processed:         false,
			ProcessingStatus:  financepkg.WebhookProcessingStatusReceived,
		})
		if err != nil {
			if errors.Is(err, financepkg.ErrDuplicatePaymentWebhookEvent) {
				return nil
			}
			return err
		}

		if !signatureValid {
			errMessage := "invalid checksum - possible tampering"
			if _, err := s.financeRepo.CreateFinanceException(ctx, tx, financepkg.CreateFinanceExceptionParams{
				EntityType:    "payment_webhook_event",
				EntityID:      webhookEvent.WebhookEventID,
				SourceType:    "gateway_callback",
				ExceptionType: "invalid_signature",
				Severity:      financepkg.FinanceExceptionSeverityCritical,
				Status:        financepkg.FinanceExceptionStatusOpen,
				Metadata:      stringPtr(string(rawCallback)),
			}); err != nil {
				return fmt.Errorf("failed to create invalid signature exception: %w", err)
			}
			if _, err := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
				WebhookEventID:   webhookEvent.WebhookEventID,
				Processed:        true,
				ProcessingStatus: financepkg.WebhookProcessingStatusInvalidSignature,
				ProcessingError:  stringPtr(errMessage),
				ProcessedAt:      &now,
			}); err != nil {
				return fmt.Errorf("failed to mark webhook invalid signature: %w", err)
			}
			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit invalid signature callback: %w", err)
			}
			committed = true
			return errors.New(errMessage)
		}

		if !merchantValid {
			errMessage := "invalid merchant ID"
			if _, err := s.financeRepo.CreateFinanceException(ctx, tx, financepkg.CreateFinanceExceptionParams{
				EntityType:    "payment_webhook_event",
				EntityID:      webhookEvent.WebhookEventID,
				SourceType:    "gateway_callback",
				ExceptionType: "invalid_merchant",
				Severity:      financepkg.FinanceExceptionSeverityCritical,
				Status:        financepkg.FinanceExceptionStatusOpen,
				Metadata:      stringPtr(string(rawCallback)),
			}); err != nil {
				return fmt.Errorf("failed to create invalid merchant exception: %w", err)
			}
			if _, err := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
				WebhookEventID:   webhookEvent.WebhookEventID,
				Processed:        true,
				ProcessingStatus: financepkg.WebhookProcessingStatusFailed,
				ProcessingError:  stringPtr(errMessage),
				ProcessedAt:      &now,
			}); err != nil {
				return fmt.Errorf("failed to mark webhook invalid merchant: %w", err)
			}
			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit invalid merchant callback: %w", err)
			}
			committed = true
			return errors.New(errMessage)
		}

		intent, err := s.financeRepo.GetPaymentIntentByProviderOrderID(ctx, tx, "gateway", callback.OrderID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				errMessage := "unmatched callback for unknown provider order"
				if _, exceptionErr := s.financeRepo.CreateFinanceException(ctx, tx, financepkg.CreateFinanceExceptionParams{
					EntityType:    "payment_webhook_event",
					EntityID:      webhookEvent.WebhookEventID,
					SourceType:    "gateway_callback",
					ExceptionType: "unmatched_callback",
					Severity:      financepkg.FinanceExceptionSeverityWarning,
					Status:        financepkg.FinanceExceptionStatusOpen,
					Metadata:      stringPtr(string(rawCallback)),
				}); exceptionErr != nil {
					return fmt.Errorf("failed to create unmatched callback exception: %w", exceptionErr)
				}
				if _, updateErr := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
					WebhookEventID:   webhookEvent.WebhookEventID,
					Processed:        true,
					ProcessingStatus: financepkg.WebhookProcessingStatusUnmatched,
					ProcessingError:  stringPtr(errMessage),
					ProcessedAt:      &now,
				}); updateErr != nil {
					return fmt.Errorf("failed to mark unmatched webhook: %w", updateErr)
				}
				if err := tx.Commit(ctx); err != nil {
					return fmt.Errorf("failed to commit unmatched callback: %w", err)
				}
				committed = true
				return nil
			}
			return fmt.Errorf("failed to look up payment intent: %w", err)
		}

		if _, err := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
			WebhookEventID:    webhookEvent.WebhookEventID,
			PaymentIntentID:   &intent.PaymentIntentID,
			CheckoutSessionID: &intent.CheckoutSessionID,
			Processed:         false,
			ProcessingStatus:  financepkg.WebhookProcessingStatusProcessing,
		}); err != nil {
			return fmt.Errorf("failed to mark webhook processing: %w", err)
		}

		if strings.EqualFold(callback.Status, "success") {
			oldIntentStatus := intent.Status
			updatedIntent, err := s.financeRepo.UpdatePaymentIntentCapture(ctx, tx, financepkg.UpdatePaymentIntentCaptureParams{
				ProviderCode:      intent.ProviderCode,
				ProviderOrderID:   callback.OrderID,
				ProviderPaymentID: callback.PaymentID,
				Status:            financepkg.PaymentIntentStatusCaptured,
				CapturedAmount:    intent.GrossAmount,
				CollectedAt:       now,
				ProviderResponse:  rawCallback,
			})
			if err != nil {
				return fmt.Errorf("failed to capture payment intent: %w", err)
			}
			intent = updatedIntent

			session, err := s.checkoutRepo.MarkCheckoutSessionPaymentCaptured(ctx, tx, intent.CheckoutSessionID, now)
			if err != nil {
				return fmt.Errorf("failed to mark checkout session captured: %w", err)
			}
			if _, err := s.financeRepo.UpdatePaymentAttemptTerminal(ctx, tx, financepkg.UpdatePaymentAttemptTerminalParams{
				ProviderCode:          intent.ProviderCode,
				ProviderOrderID:       callback.OrderID,
				ProviderPaymentID:     callback.PaymentID,
				ProviderTransactionID: callback.TransactionID,
				Status:                financepkg.PaymentAttemptStatusCaptured,
				ResponsePayload:       rawCallback,
				CompletedAt:           timePtr(now),
			}); err != nil {
				return fmt.Errorf("failed to update payment attempt capture: %w", err)
			}
			if _, err := s.financeRepo.CreateFinanceEvent(ctx, tx, financepkg.CreateFinanceEventParams{
				EntityType:        "payment_intent",
				EntityID:          intent.PaymentIntentID,
				CheckoutSessionID: &intent.CheckoutSessionID,
				PaymentIntentID:   &intent.PaymentIntentID,
				EventType:         "payment_captured",
				OldStatus:         &oldIntentStatus,
				NewStatus:         stringPtr(intent.Status),
				Amount:            float64Ptr(intent.CapturedAmount),
				Currency:          intent.Currency,
				ActorType:         "system",
				SourceSystem:      "gateway_callback",
				SourceReference:   stringPtr(webhookEvent.ProviderEventID),
			}); err != nil {
				return fmt.Errorf("failed to append payment captured finance event: %w", err)
			}

			items, err := s.checkoutRepo.ListCheckoutSessionItems(ctx, tx, intent.CheckoutSessionID)
			if err != nil {
				return fmt.Errorf("failed to fetch checkout items for materialization: %w", err)
			}

			result, materializeErr := s.materializer.MaterializeCheckoutSession(ctx, tx, session, items)
			if materializeErr == nil {
				for _, link := range result.Links {
					if _, err := s.financeRepo.AssignOrderToWholesellerAllocations(ctx, tx, intent.PaymentIntentID, int64(link.WholesellerID), link.OrderID); err != nil {
						materializeErr = fmt.Errorf("failed to bind allocations to order %d: %w", link.OrderID, err)
						break
					}
					if _, err := s.financeRepo.CreateFinanceEvent(ctx, tx, financepkg.CreateFinanceEventParams{
						EntityType:        "order",
						EntityID:          link.OrderID,
						ParentEntityType:  stringPtr("payment_intent"),
						ParentEntityID:    &intent.PaymentIntentID,
						CheckoutSessionID: &intent.CheckoutSessionID,
						OrderID:           &link.OrderID,
						PaymentIntentID:   &intent.PaymentIntentID,
						EventType:         "order_materialized",
						NewStatus:         stringPtr("created"),
						Amount:            float64Ptr(intent.GrossAmount),
						Currency:          intent.Currency,
						ActorType:         "system",
						SourceSystem:      "gateway_callback",
						SourceReference:   stringPtr(webhookEvent.ProviderEventID),
					}); err != nil {
						materializeErr = fmt.Errorf("failed to append order materialized event for order %d: %w", link.OrderID, err)
						break
					}
				}
			}

			webhookStatus := financepkg.WebhookProcessingStatusProcessed
			var webhookError *string
			if materializeErr != nil {
				webhookStatus = financepkg.WebhookProcessingStatusReprocessRequired
				webhookError = stringPtr(materializeErr.Error())
				if _, err := s.financeRepo.CreateFinanceException(ctx, tx, financepkg.CreateFinanceExceptionParams{
					EntityType:        "payment_intent",
					EntityID:          intent.PaymentIntentID,
					SourceType:        "gateway_callback",
					CheckoutSessionID: &intent.CheckoutSessionID,
					PaymentIntentID:   &intent.PaymentIntentID,
					ExceptionType:     "materialization_failed",
					Severity:          financepkg.FinanceExceptionSeverityCritical,
					Status:            financepkg.FinanceExceptionStatusOpen,
					Metadata:          stringPtr(materializeErr.Error()),
				}); err != nil {
					return fmt.Errorf("failed to create materialization exception: %w", err)
				}
				if _, err := s.financeRepo.CreateFinanceEvent(ctx, tx, financepkg.CreateFinanceEventParams{
					EntityType:        "checkout_session",
					EntityID:          intent.CheckoutSessionID,
					CheckoutSessionID: &intent.CheckoutSessionID,
					PaymentIntentID:   &intent.PaymentIntentID,
					EventType:         "materialization_failed",
					OldStatus:         stringPtr(checkout.StatusPaymentCaptured),
					NewStatus:         stringPtr(checkout.StatusPaymentCaptured),
					Amount:            float64Ptr(intent.GrossAmount),
					Currency:          intent.Currency,
					ActorType:         "system",
					SourceSystem:      "gateway_callback",
					SourceReference:   stringPtr(webhookEvent.ProviderEventID),
					Notes:             webhookError,
				}); err != nil {
					return fmt.Errorf("failed to append materialization failed event: %w", err)
				}
			} else {
				if _, err := s.financeRepo.CreateFinanceEvent(ctx, tx, financepkg.CreateFinanceEventParams{
					EntityType:        "checkout_session",
					EntityID:          intent.CheckoutSessionID,
					CheckoutSessionID: &intent.CheckoutSessionID,
					PaymentIntentID:   &intent.PaymentIntentID,
					EventType:         "checkout_materialized",
					OldStatus:         stringPtr(checkout.StatusPaymentCaptured),
					NewStatus:         stringPtr(checkout.StatusMaterialized),
					Amount:            float64Ptr(intent.GrossAmount),
					Currency:          intent.Currency,
					ActorType:         "system",
					SourceSystem:      "gateway_callback",
					SourceReference:   stringPtr(webhookEvent.ProviderEventID),
				}); err != nil {
					return fmt.Errorf("failed to append checkout materialized event: %w", err)
				}
			}

			if _, err := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
				WebhookEventID:    webhookEvent.WebhookEventID,
				PaymentIntentID:   &intent.PaymentIntentID,
				CheckoutSessionID: &intent.CheckoutSessionID,
				Processed:         true,
				ProcessingStatus:  webhookStatus,
				ProcessingError:   webhookError,
				ProcessedAt:       &now,
			}); err != nil {
				return fmt.Errorf("failed to finalize webhook event: %w", err)
			}

			if err := tx.Commit(ctx); err != nil {
				return fmt.Errorf("failed to commit captured callback: %w", err)
			}
			committed = true
			return materializeErr
		}

		status := financepkg.PaymentIntentStatusFailed
		if strings.EqualFold(callback.Status, "cancelled") {
			status = financepkg.PaymentIntentStatusCancelled
		}
		lastErrorCode := stringPtr("payment_" + strings.ToLower(callback.Status))
		lastErrorMessage := stringPtr("Payment was not completed successfully")
		oldIntentStatus := intent.Status

		updatedIntent, err := s.financeRepo.UpdatePaymentIntentFailure(ctx, tx, financepkg.UpdatePaymentIntentFailureParams{
			PaymentIntentID:   intent.PaymentIntentID,
			Status:            status,
			LastErrorCode:     lastErrorCode,
			LastErrorMessage:  lastErrorMessage,
			ProviderPaymentID: callback.PaymentID,
			ProviderResponse:  rawCallback,
		})
		if err != nil {
			return fmt.Errorf("failed to mark payment intent failure: %w", err)
		}
		if err := s.cancelIntentAllocations(ctx, tx, intent.PaymentIntentID, *lastErrorCode, *lastErrorMessage); err != nil {
			return err
		}
		attemptStatus := financepkg.PaymentAttemptStatusFailed
		if status == financepkg.PaymentIntentStatusCancelled {
			attemptStatus = financepkg.PaymentAttemptStatusCancelled
		}
		if _, err := s.financeRepo.UpdatePaymentAttemptTerminal(ctx, tx, financepkg.UpdatePaymentAttemptTerminalParams{
			ProviderCode:          intent.ProviderCode,
			ProviderOrderID:       callback.OrderID,
			ProviderPaymentID:     callback.PaymentID,
			ProviderTransactionID: callback.TransactionID,
			Status:                attemptStatus,
			ResponsePayload:       rawCallback,
			LastErrorCode:         lastErrorCode,
			LastErrorMessage:      lastErrorMessage,
			CompletedAt:           timePtr(now),
		}); err != nil {
			return fmt.Errorf("failed to update payment attempt failure: %w", err)
		}
		if _, err := s.checkoutRepo.MarkCheckoutSessionPaymentFailed(ctx, tx, intent.CheckoutSessionID, now, *lastErrorCode, *lastErrorMessage); err != nil {
			return fmt.Errorf("failed to mark checkout session payment failed: %w", err)
		}
		if _, err := s.financeRepo.CreateFinanceEvent(ctx, tx, financepkg.CreateFinanceEventParams{
			EntityType:        "payment_intent",
			EntityID:          intent.PaymentIntentID,
			CheckoutSessionID: &intent.CheckoutSessionID,
			PaymentIntentID:   &intent.PaymentIntentID,
			EventType:         "payment_failed",
			OldStatus:         &oldIntentStatus,
			NewStatus:         stringPtr(updatedIntent.Status),
			Amount:            float64Ptr(updatedIntent.GrossAmount),
			Currency:          updatedIntent.Currency,
			ActorType:         "system",
			SourceSystem:      "gateway_callback",
			SourceReference:   stringPtr(webhookEvent.ProviderEventID),
			Notes:             lastErrorMessage,
		}); err != nil {
			return fmt.Errorf("failed to append payment failed event: %w", err)
		}
		if _, err := s.financeRepo.UpdatePaymentWebhookEventProcessing(ctx, tx, financepkg.UpdatePaymentWebhookEventProcessingParams{
			WebhookEventID:    webhookEvent.WebhookEventID,
			PaymentIntentID:   &intent.PaymentIntentID,
			CheckoutSessionID: &intent.CheckoutSessionID,
			Processed:         true,
			ProcessingStatus:  financepkg.WebhookProcessingStatusProcessed,
			ProcessedAt:       &now,
		}); err != nil {
			return fmt.Errorf("failed to finalize failed webhook event: %w", err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit failed callback: %w", err)
		}
		committed = true
		return nil
	}

	// Verify checksum
	if !signatureValid {
		return errors.New("invalid checksum - possible tampering")
	}

	// Verify merchant ID
	if !merchantValid {
		return errors.New("invalid merchant ID")
	}

	// Get order to verify it exists
	order, err := s.repo.GetOrderByOrderID(callback.OrderID)
	if err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	// Prevent duplicate processing (idempotency)
	if order.Status == PaymentStatusSuccess {
		// Already processed - this is a duplicate callback
		return nil // Return success to acknowledge
	}

	// Update order from callback
	if err := s.repo.UpdateOrderFromCallback(callback); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Here you can add additional business logic:
	// - Send confirmation email
	// - Update user balance/credits
	// - Trigger webhooks to other services
	// - Send notifications

	return nil
}

// verifyCallbackChecksum verifies the gateway callback checksum
func (s *PaymentService) verifyCallbackChecksum(callback *PaymentCallback) bool {
	if callback == nil || callback.PaymentID == nil || callback.TransactionID == nil {
		return false
	}
	// Gateway generates checksum as: sha256(payment_id|status|transaction_id|merchant_key)
	data := fmt.Sprintf("%s|%s|%s", *callback.PaymentID, callback.Status, *callback.TransactionID)
	expectedChecksum := GenerateChecksum(data, s.credentials.MerchantKey)
	return expectedChecksum == callback.Checksum
}

// GetOrderStatus retrieves order status
func (s *PaymentService) GetOrderStatus(orderID string) (*PaymentStatusResponse, error) {
	if db.Pool != nil {
		if intent, err := s.financeRepo.GetPaymentIntentByProviderOrderID(context.Background(), nil, "gateway", orderID); err == nil {
			session, sessionErr := s.checkoutRepo.GetCheckoutSessionByID(context.Background(), nil, intent.CheckoutSessionID)
			if sessionErr == nil {
				updatedIntent, syncErr := s.syncActiveIntentWithSessionFailure(context.Background(), nil, session, intent, time.Now())
				if syncErr != nil {
					return nil, syncErr
				}
				intent = updatedIntent
			}
			response := s.mapFinanceStatusResponse(intent)
			if sessionErr == nil && session != nil {
				response.CheckoutStatus = stringPtr(session.Status)
				response.MaterializedAt = session.MaterializedAt
				if session.Status == checkout.StatusMaterialized {
					if checkoutOrders, err := s.checkoutRepo.ListCheckoutSessionOrders(context.Background(), nil, session.CheckoutSessionID); err == nil {
						orderIDs := make([]int64, 0, len(checkoutOrders))
						for _, checkoutOrder := range checkoutOrders {
							orderIDs = append(orderIDs, checkoutOrder.OrderID)
						}
						response.OrderIDs = orderIDs
					}
				} else if intent.Status == financepkg.PaymentIntentStatusCaptured {
					response.Status = PaymentStatusProcessing
				}
			}
			return response, nil
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
	}

	order, err := s.repo.GetOrderByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	return &PaymentStatusResponse{
		OrderID:       order.OrderID,
		PaymentID:     order.PaymentID,
		Status:        order.Status,
		Amount:        order.Amount,
		TransactionID: order.TransactionID,
		CreatedAt:     order.CreatedAt,
		PaidAt:        order.PaidAt,
	}, nil
}

// GetUserOrders retrieves all orders for a user
func (s *PaymentService) GetUserOrders(userID int, page, pageSize int) ([]PaymentOrder, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.GetUserOrders(userID, pageSize, offset)
}

// CancelOrder cancels a pending order
func (s *PaymentService) CancelOrder(orderID string, userID int) error {
	order, err := s.repo.GetOrderByOrderID(orderID)
	if err != nil {
		return err
	}

	// Verify ownership
	if order.UserID != userID {
		return errors.New("unauthorized: order belongs to different user")
	}

	// Only allow cancellation of pending/initiated orders
	if order.Status != PaymentStatusPending && order.Status != PaymentStatusInitiated {
		return fmt.Errorf("cannot cancel order with status: %s", order.Status)
	}

	return s.repo.UpdateOrderStatus(orderID, PaymentStatusCancelled, "Cancelled by user")
}

// SyncPaymentStatus queries gateway for latest payment status
func (s *PaymentService) SyncPaymentStatus(orderID string) error {
	if db.Pool != nil {
		if intent, err := s.financeRepo.GetPaymentIntentByProviderOrderID(context.Background(), nil, "gateway", orderID); err == nil {
			if intent.ProviderPaymentID == nil {
				return errors.New("payment not initiated at gateway")
			}
			// Reuse the gateway status call and callback mapping for the checkout-backed flow.
			url := fmt.Sprintf("%s/api/paymentStatus/%s", s.gatewayURL, *intent.ProviderPaymentID)

			httpReq, err := http.NewRequest("GET", url, nil)
			if err != nil {
				return fmt.Errorf("failed to create request: %w", err)
			}
			httpReq.Header.Set("X-Merchant-ID", s.credentials.MerchantID)
			httpReq.Header.Set("X-Merchant-Key", s.credentials.MerchantKey)
			httpReq.Header.Set("Authorization", "Bearer "+s.credentials.MerchantID)

			resp, err := s.httpClient.Do(httpReq)
			if err != nil {
				return fmt.Errorf("failed to call gateway: %w", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return fmt.Errorf("gateway returned status %d", resp.StatusCode)
			}

			var gatewayStatus struct {
				Success bool `json:"success"`
				Data    struct {
					Status        string `json:"status"`
					TransactionID string `json:"transaction_id"`
				} `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&gatewayStatus); err != nil {
				return fmt.Errorf("failed to parse response: %w", err)
			}
			if gatewayStatus.Data.Status != intent.Status {
				callback := &PaymentCallback{
					PaymentID:     intent.ProviderPaymentID,
					OrderID:       paymentIntentOrderID(intent),
					Status:        gatewayStatus.Data.Status,
					TransactionID: stringPtr(gatewayStatus.Data.TransactionID),
					MerchantID:    s.credentials.MerchantID,
					GatewayID:     "SBIEPAY_MOCK",
					Checksum:      GenerateChecksum(fmt.Sprintf("%s|%s|%s", *intent.ProviderPaymentID, gatewayStatus.Data.Status, gatewayStatus.Data.TransactionID), s.credentials.MerchantKey),
				}
				return s.HandleCallback(callback)
			}
			return nil
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
	}

	order, err := s.repo.GetOrderByOrderID(orderID)
	if err != nil {
		return err
	}

	if order.PaymentID == nil {
		return errors.New("payment not initiated at gateway")
	}

	// Call gateway status API
	url := fmt.Sprintf("%s/api/paymentStatus/%s", s.gatewayURL, *order.PaymentID)

	httpReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("X-Merchant-ID", s.credentials.MerchantID)
	httpReq.Header.Set("X-Merchant-Key", s.credentials.MerchantKey)
	httpReq.Header.Set("Authorization", "Bearer "+s.credentials.MerchantID)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to call gateway: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gateway returned status %d", resp.StatusCode)
	}

	// Parse and update status based on gateway response
	// This is a simplified version - you'd parse the actual response
	var gatewayStatus struct {
		Success bool `json:"success"`
		Data    struct {
			Status        string `json:"status"`
			TransactionID string `json:"transaction_id"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&gatewayStatus); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	// Update local status if different
	if gatewayStatus.Data.Status != order.Status {
		// Create a callback-like structure to reuse existing logic
		callback := &PaymentCallback{
			PaymentID:     order.PaymentID,
			OrderID:       order.OrderID,
			Status:        gatewayStatus.Data.Status,
			TransactionID: &gatewayStatus.Data.TransactionID,
			MerchantID:    s.credentials.MerchantID,
			GatewayID:     "SBIEPAY_MOCK",
		}
		return s.repo.UpdateOrderFromCallback(callback)
	}

	return nil
}

func (s *PaymentService) createInitialAllocations(ctx context.Context, q interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}, session *checkout.CheckoutSession, intent *financepkg.PaymentIntent, items []checkout.CheckoutSessionItem) error {
	type sellerBucket struct {
		gross float64
		tax   float64
	}

	sellers := make(map[int]sellerBucket)
	for _, item := range items {
		bucket := sellers[item.WholesellerID]
		bucket.gross += item.LineFinalAmount
		bucket.tax += item.TaxAmount
		sellers[item.WholesellerID] = bucket
	}

	for wholesellerID, bucket := range sellers {
		wholesellerID := wholesellerID
		if bucket.gross <= 0 {
			continue
		}
		if _, err := s.financeRepo.CreateSettlementAllocation(ctx, q, financepkg.CreateSettlementAllocationParams{
			PaymentIntentID:   intent.PaymentIntentID,
			CheckoutSessionID: session.CheckoutSessionID,
			AllocationType:    "wholeseller_payable",
			PayeeType:         "wholeseller",
			PayeeID:           int64(wholesellerID),
			GrossAmount:       bucket.gross,
			TaxAmount:         bucket.tax,
			NetPayable:        bucket.gross,
			Status:            financepkg.SettlementAllocationStatusHold,
			HoldSource:        "system",
			HoldReason:        stringPtr("awaiting_capture_and_release"),
		}); err != nil {
			return fmt.Errorf("failed to create wholeseller allocation %d: %w", wholesellerID, err)
		}
	}

	if session.DeliveryAmount > 0 {
		if _, err := s.financeRepo.CreateSettlementAllocation(ctx, q, financepkg.CreateSettlementAllocationParams{
			PaymentIntentID:   intent.PaymentIntentID,
			CheckoutSessionID: session.CheckoutSessionID,
			AllocationType:    "transporter_payable",
			PayeeType:         "transport_pending",
			PayeeID:           session.CheckoutSessionID,
			GrossAmount:       session.DeliveryAmount,
			NetPayable:        session.DeliveryAmount,
			Status:            financepkg.SettlementAllocationStatusHold,
			HoldSource:        "system",
			HoldReason:        stringPtr("awaiting_driver_assignment"),
		}); err != nil {
			return fmt.Errorf("failed to create transport allocation: %w", err)
		}
	}

	// Platform and handling charges are collected upfront and should never wait on
	// seller/transporter release gates. When a non-zero fee policy is wired, these
	// rows are created as immediately released allocations.
	if intent.PlatformFeeAmount > 0 {
		if _, err := s.financeRepo.CreateSettlementAllocation(ctx, q, financepkg.CreateSettlementAllocationParams{
			PaymentIntentID:   intent.PaymentIntentID,
			CheckoutSessionID: session.CheckoutSessionID,
			AllocationType:    "platform_fee",
			PayeeType:         "platform",
			PayeeID:           1,
			GrossAmount:       intent.PlatformFeeAmount,
			NetPayable:        intent.PlatformFeeAmount,
			Status:            financepkg.SettlementAllocationStatusReleased,
			HoldSource:        "system",
		}); err != nil {
			return fmt.Errorf("failed to create platform fee allocation: %w", err)
		}
	}

	if intent.HandlingChargeAmount > 0 {
		if _, err := s.financeRepo.CreateSettlementAllocation(ctx, q, financepkg.CreateSettlementAllocationParams{
			PaymentIntentID:   intent.PaymentIntentID,
			CheckoutSessionID: session.CheckoutSessionID,
			AllocationType:    "handling_charge",
			PayeeType:         "platform",
			PayeeID:           1,
			GrossAmount:       intent.HandlingChargeAmount,
			NetPayable:        intent.HandlingChargeAmount,
			Status:            financepkg.SettlementAllocationStatusReleased,
			HoldSource:        "system",
		}); err != nil {
			return fmt.Errorf("failed to create handling charge allocation: %w", err)
		}
	}

	return nil
}

func (s *PaymentService) sessionTimedOut(session *checkout.CheckoutSession, now time.Time) bool {
	if session == nil {
		return false
	}
	if session.Status != checkout.StatusCreated && session.Status != checkout.StatusPaymentPending {
		return false
	}
	startedAt := session.CreatedAt
	if session.PaymentStartedAt != nil {
		startedAt = *session.PaymentStartedAt
	}
	return startedAt.Add(checkoutSessionPaymentTimeout).Before(now) || startedAt.Add(checkoutSessionPaymentTimeout).Equal(now)
}

func (s *PaymentService) loadCurrentCheckoutPaymentIntent(ctx context.Context, session *checkout.CheckoutSession) (*financepkg.PaymentIntent, error) {
	if session == nil || session.CurrentPaymentIntentID == nil {
		return nil, nil
	}

	intent, err := s.financeRepo.GetPaymentIntentByID(ctx, nil, *session.CurrentPaymentIntentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to load current payment intent: %w", err)
	}
	return intent, nil
}

func (s *PaymentService) syncActiveIntentWithSessionFailure(ctx context.Context, q repositoryQueryer, session *checkout.CheckoutSession, intent *financepkg.PaymentIntent, now time.Time) (*financepkg.PaymentIntent, error) {
	if session == nil || intent == nil || !isActiveFinanceIntentStatus(intent.Status) {
		return intent, nil
	}

	targetStatus, errorCode, errorMessage, shouldSync := s.sessionFailureOutcome(session, now)
	if !shouldSync {
		return intent, nil
	}

	updatedIntent, err := s.financeRepo.UpdatePaymentIntentFailure(ctx, q, financepkg.UpdatePaymentIntentFailureParams{
		PaymentIntentID:  intent.PaymentIntentID,
		Status:           targetStatus,
		LastErrorCode:    stringPtr(errorCode),
		LastErrorMessage: stringPtr(errorMessage),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update payment intent failure state: %w", err)
	}

	attemptStatus := financepkg.PaymentAttemptStatusFailed
	if targetStatus == financepkg.PaymentIntentStatusExpired {
		attemptStatus = financepkg.PaymentAttemptStatusExpired
	}
	if _, err := s.financeRepo.UpdatePaymentAttemptFailureByIntent(ctx, q, financepkg.UpdatePaymentAttemptFailureByIntentParams{
		PaymentIntentID:  intent.PaymentIntentID,
		Status:           attemptStatus,
		LastErrorCode:    stringPtr(errorCode),
		LastErrorMessage: stringPtr(errorMessage),
		CompletedAt:      timePtr(now),
	}); err != nil {
		return nil, fmt.Errorf("failed to update payment attempt failure state: %w", err)
	}

	if err := s.cancelIntentAllocations(ctx, q, intent.PaymentIntentID, errorCode, errorMessage); err != nil {
		return nil, err
	}

	return updatedIntent, nil
}

func (s *PaymentService) closeSupersededCheckoutPaymentIntent(ctx context.Context, q repositoryQueryer, session *checkout.CheckoutSession, intent *financepkg.PaymentIntent, now time.Time) error {
	if intent == nil {
		return nil
	}

	wasActive := isActiveFinanceIntentStatus(intent.Status)
	updatedIntent, err := s.syncActiveIntentWithSessionFailure(ctx, q, session, intent, now)
	if err != nil {
		return err
	}
	intent = updatedIntent

	if intent.Status == financepkg.PaymentIntentStatusCaptured {
		return fmt.Errorf("checkout session %d already has a captured payment intent", session.CheckoutSessionID)
	}

	reasonCode, reasonMessage, hasSessionFailure := s.sessionFailureReason(session, now)
	if !isActiveFinanceIntentStatus(intent.Status) && hasSessionFailure {
		if !wasActive {
			if err := s.cancelIntentAllocations(ctx, q, intent.PaymentIntentID, reasonCode, reasonMessage); err != nil {
				return err
			}
		}
		return nil
	}
	if !hasSessionFailure {
		reasonCode = "superseded_retry"
		reasonMessage = "Payment attempt superseded by a new retry"
	}

	if isActiveFinanceIntentStatus(intent.Status) {
		intent, err = s.financeRepo.UpdatePaymentIntentFailure(ctx, q, financepkg.UpdatePaymentIntentFailureParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentIntentStatusCancelled,
			LastErrorCode:    stringPtr(reasonCode),
			LastErrorMessage: stringPtr(reasonMessage),
		})
		if err != nil {
			return fmt.Errorf("failed to close superseded payment intent: %w", err)
		}
		if _, err := s.financeRepo.UpdatePaymentAttemptFailureByIntent(ctx, q, financepkg.UpdatePaymentAttemptFailureByIntentParams{
			PaymentIntentID:  intent.PaymentIntentID,
			Status:           financepkg.PaymentAttemptStatusCancelled,
			LastErrorCode:    stringPtr(reasonCode),
			LastErrorMessage: stringPtr(reasonMessage),
			CompletedAt:      timePtr(now),
		}); err != nil {
			return fmt.Errorf("failed to close superseded payment attempt: %w", err)
		}
	}

	if err := s.cancelIntentAllocations(ctx, q, intent.PaymentIntentID, reasonCode, reasonMessage); err != nil {
		return err
	}

	return nil
}

func (s *PaymentService) sessionFailureOutcome(session *checkout.CheckoutSession, now time.Time) (string, string, string, bool) {
	errorCode, errorMessage, failed := s.sessionFailureReason(session, now)
	if !failed {
		return "", "", "", false
	}

	status := financepkg.PaymentIntentStatusFailed
	if errorCode == "timeout" {
		status = financepkg.PaymentIntentStatusExpired
	}
	return status, errorCode, errorMessage, true
}

func (s *PaymentService) sessionFailureReason(session *checkout.CheckoutSession, now time.Time) (string, string, bool) {
	if session == nil {
		return "", "", false
	}
	if s.sessionTimedOut(session, now) {
		return "timeout", "Payment was not completed within the allowed time window", true
	}
	if session.Status == checkout.StatusPaymentFailed {
		return valueOrDefault(session.LastPaymentErrorCode, "payment_failed"),
			valueOrDefault(session.LastPaymentErrorMessage, "Payment was not completed successfully"),
			true
	}
	return "", "", false
}

func isActiveFinanceIntentStatus(status string) bool {
	switch status {
	case financepkg.PaymentIntentStatusCreated,
		financepkg.PaymentIntentStatusPending,
		financepkg.PaymentIntentStatusProviderConfirmationPending:
		return true
	default:
		return false
	}
}

func (s *PaymentService) cancelIntentAllocations(ctx context.Context, q repositoryQueryer, paymentIntentID int64, errorCode, errorMessage string) error {
	if _, err := s.financeRepo.CancelOpenSettlementAllocationsByPaymentIntentID(ctx, q, paymentIntentID, stringPtr(errorCode), stringPtr(errorMessage)); err != nil {
		return fmt.Errorf("failed to cancel settlement allocations: %w", err)
	}
	return nil
}

func (s *PaymentService) mapFinanceStatusResponse(intent *financepkg.PaymentIntent) *PaymentStatusResponse {
	status := PaymentStatusPending
	switch intent.Status {
	case financepkg.PaymentIntentStatusCaptured:
		status = PaymentStatusSuccess
	case financepkg.PaymentIntentStatusFailed, financepkg.PaymentIntentStatusExpired:
		status = PaymentStatusFailed
	case financepkg.PaymentIntentStatusCancelled:
		status = PaymentStatusCancelled
	}

	var failureReason *string
	if intent.LastErrorMessage != nil {
		failureReason = intent.LastErrorMessage
	}

	return &PaymentStatusResponse{
		OrderID:           paymentIntentOrderID(intent),
		CheckoutSessionID: &intent.CheckoutSessionID,
		PaymentIntentID:   &intent.PaymentIntentID,
		PaymentID:         intent.ProviderPaymentID,
		Status:            status,
		Amount:            intent.GrossAmount,
		CreatedAt:         intent.CreatedAt,
		PaidAt:            intent.CollectedAt,
		FailureReason:     failureReason,
	}
}

func stringPtr(value string) *string {
	return &value
}

func float64Ptr(value float64) *float64 {
	return &value
}

func timePtr(value time.Time) *time.Time {
	return &value
}

func valueOrDefault(value *string, fallback string) string {
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}

func paymentIntentOrderID(intent *financepkg.PaymentIntent) string {
	if intent == nil || intent.ProviderOrderID == nil {
		return ""
	}
	return *intent.ProviderOrderID
}

func (s *PaymentService) deriveProviderEventID(callback *PaymentCallback) string {
	if callback != nil && callback.EventID != nil && strings.TrimSpace(*callback.EventID) != "" {
		return strings.TrimSpace(*callback.EventID)
	}
	orderID := ""
	if callback != nil {
		orderID = callback.OrderID
	}

	paymentID := ""
	if callback != nil && callback.PaymentID != nil {
		paymentID = *callback.PaymentID
	}
	transactionID := ""
	if callback != nil && callback.TransactionID != nil {
		transactionID = *callback.TransactionID
	}
	timestamp := ""
	if callback != nil {
		timestamp = callback.Timestamp
	}
	status := ""
	if callback != nil {
		status = callback.Status
	}

	return fmt.Sprintf(
		"gateway:%s:%s:%s:%s:%s",
		orderID,
		paymentID,
		transactionID,
		strings.ToLower(strings.TrimSpace(status)),
		timestamp,
	)
}

func (s *PaymentService) callbackEventType(callback *PaymentCallback) string {
	if callback == nil || strings.TrimSpace(callback.Status) == "" {
		return "payment_callback"
	}
	return "payment_" + strings.ToLower(strings.TrimSpace(callback.Status))
}

func (s *PaymentService) buildResumePaymentResponse(intent *financepkg.PaymentIntent) *InitiatePaymentResponseData {
	if intent == nil || len(intent.ProviderResponse) == 0 {
		return nil
	}

	var gatewayResp InitiatePaymentResponse
	if err := json.Unmarshal(intent.ProviderResponse, &gatewayResp); err != nil {
		return nil
	}
	if gatewayResp.Data.PaymentURL == "" || paymentIntentOrderID(intent) == "" {
		return nil
	}

	gatewayResp.Data.OrderID = paymentIntentOrderID(intent)
	gatewayResp.Data.CheckoutSessionID = &intent.CheckoutSessionID
	gatewayResp.Data.PaymentIntentID = &intent.PaymentIntentID
	gatewayResp.Data.GrossAmount = intent.GrossAmount
	return &gatewayResp.Data
}
