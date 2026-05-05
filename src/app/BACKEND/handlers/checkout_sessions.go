package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/checkout"
	"farmerapp/internal/common/utils"
	commonverification "farmerapp/internal/common/verification"

	"github.com/gofiber/fiber/v2"
)

type CheckoutSessionResponse struct {
	CheckoutSessionID int64   `json:"checkout_session_id"`
	Status            string  `json:"status"`
	GoodsAmount       float64 `json:"goods_amount"`
	DeliveryAmount    float64 `json:"delivery_amount"`
	GrossAmount       float64 `json:"gross_amount"`
	OrderGroupsCount  int     `json:"order_groups_count"`
	ItemsCount        int     `json:"items_count"`
}

type RetailerCheckoutSessionSummary struct {
	CheckoutSessionID      int64      `json:"checkout_session_id"`
	Status                 string     `json:"status"`
	GoodsAmount            float64    `json:"goods_amount"`
	DeliveryAmount         float64    `json:"delivery_amount"`
	GrossAmount            float64    `json:"gross_amount"`
	DeliveryAddress        string     `json:"delivery_address"`
	CurrentPaymentIntentID *int64     `json:"current_payment_intent_id,omitempty"`
	PaymentStartedAt       *time.Time `json:"payment_started_at,omitempty"`
	PaymentFailedAt        *time.Time `json:"payment_failed_at,omitempty"`
	ExpiredAt              *time.Time `json:"expired_at,omitempty"`
	PaymentTimeoutAt       *time.Time `json:"payment_timeout_at,omitempty"`
	SecondsUntilTimeout    *int64     `json:"seconds_until_timeout,omitempty"`
	LastPaymentErrorCode   *string    `json:"last_payment_error_code,omitempty"`
	LastPaymentError       *string    `json:"last_payment_error,omitempty"`
	CanResumePayment       bool       `json:"can_resume_payment"`
	CanRetryPayment        bool       `json:"can_retry_payment"`
	CanCancelCheckout      bool       `json:"can_cancel_checkout"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

type RetailerCheckoutSessionDetailItem struct {
	SelectedID    *int64   `json:"selected_id,omitempty"`
	ProductID     int64    `json:"product_id"`
	ProductName   string   `json:"product_name"`
	Quantity      float64  `json:"quantity"`
	UnitID        int      `json:"unit_id"`
	UnitName      string   `json:"unit_name"`
	Price         float64  `json:"price"`
	Discount      float64  `json:"discount_amount"`
	TaxAmount     float64  `json:"tax_amount"`
	WholesellerID int      `json:"wholeseller_id"`
	BranchID      *int64   `json:"branch_id,omitempty"`
}

type RetailerCheckoutSessionDetailGroup struct {
	WholesellerID    int                                 `json:"wholeseller_id"`
	BranchID         *int64                              `json:"branch_id,omitempty"`
	Items            []RetailerCheckoutSessionDetailItem `json:"items"`
	TotalOrderAmount float64                             `json:"total_order_amount"`
	DiscountAmount   float64                             `json:"discount_amount"`
	TaxAmount        float64                             `json:"tax_amount"`
	FinalAmount      float64                             `json:"final_amount"`
}

type RetailerCheckoutSessionDetail struct {
	CheckoutSessionID      int64                               `json:"checkout_session_id"`
	Status                 string                              `json:"status"`
	RetailerBranchID       int                                 `json:"retailer_branch_id"`
	GoodsAmount            float64                             `json:"goods_amount"`
	DeliveryAmount         float64                             `json:"delivery_amount"`
	GrossAmount            float64                             `json:"gross_amount"`
	DeliveryAddress        string                              `json:"delivery_address"`
	CurrentPaymentIntentID *int64                              `json:"current_payment_intent_id,omitempty"`
	PaymentStartedAt       *time.Time                          `json:"payment_started_at,omitempty"`
	PaymentFailedAt        *time.Time                          `json:"payment_failed_at,omitempty"`
	PaymentTimeoutAt       *time.Time                          `json:"payment_timeout_at,omitempty"`
	SecondsUntilTimeout    *int64                              `json:"seconds_until_timeout,omitempty"`
	LastPaymentErrorCode   *string                             `json:"last_payment_error_code,omitempty"`
	LastPaymentError       *string                             `json:"last_payment_error,omitempty"`
	CanResumePayment       bool                                `json:"can_resume_payment"`
	CanRetryPayment        bool                                `json:"can_retry_payment"`
	CanCancelCheckout      bool                                `json:"can_cancel_checkout"`
	OrderGroups            []RetailerCheckoutSessionDetailGroup `json:"order_groups"`
	CreatedAt              time.Time                           `json:"created_at"`
	UpdatedAt              time.Time                           `json:"updated_at"`
}

const checkoutPendingPaymentTimeout = 5 * time.Minute

func CreateRetailerCheckoutSession(c *fiber.Ctx) error {
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return errorResponse(c, fiber.StatusUnauthorized, "Unauthorized or invalid retailer user ID")
	}
	if retailerUserID == -1 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid retailer user ID")
	}

	var retailerBusinessID int
	err = db.Pool.QueryRow(context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID).Scan(&retailerBusinessID)
	if err != nil {
		log.Printf("Error fetching business ID for user %d: %v", retailerUserID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch retailer business ID")
	}

	var req CreateBatchOrderRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Error parsing checkout session body: %v", err)
		return errorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.OrderGroups) == 0 {
		return errorResponse(c, fiber.StatusBadRequest, "At least one order group is required")
	}
	if req.DeliveryAddress == "" {
		return errorResponse(c, fiber.StatusBadRequest, "Delivery address is required")
	}
	if req.RetailerBranchID == 0 {
		return errorResponse(c, fiber.StatusBadRequest, "Retailer branch ID is required")
	}

	businessVerification, err := getRetailerBusinessOperationalVerification(context.Background(), retailerBusinessID)
	if err != nil {
		log.Printf("Error fetching retailer business verification status for business %d: %v", retailerBusinessID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to validate retailer business")
	}
	if !commonverification.BuyerCanPlaceLiveOrders(businessVerification.PANStatus, businessVerification.AadhaarStatus) {
		return errorResponse(
			c,
			fiber.StatusForbidden,
			commonverification.BuyerOperationalBlockReason(businessVerification.PANStatus, businessVerification.AadhaarStatus),
		)
	}

	branchVerification, branchBelongsToBusiness, err := getRetailerBranchOperationalVerification(
		context.Background(),
		retailerBusinessID,
		req.RetailerBranchID,
	)
	if err != nil {
		log.Printf("Error fetching retailer branch verification status for branch %d: %v", req.RetailerBranchID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to validate retailer branch")
	}
	if !branchBelongsToBusiness {
		return errorResponse(c, fiber.StatusForbidden, "Selected retailer branch does not belong to your business")
	}
	if branchVerification.DocumentStatus != commonverification.BranchDocumentVerificationVerified {
		return errorResponse(c, fiber.StatusForbidden, "Selected retailer branch documents must be verified before placing live orders")
	}
	if branchVerification.LocationStatus != branchLocationVerificationVerified {
		return errorResponse(c, fiber.StatusForbidden, "Selected retailer branch location must be verified before placing live orders")
	}

	var goodsAmount float64
	itemsCount := 0
	for i, group := range req.OrderGroups {
		if len(group.Items) == 0 {
			return errorResponse(c, fiber.StatusBadRequest, fmt.Sprintf("Order group %d has no items", i))
		}
		if group.WholesellerID == 0 {
			return errorResponse(c, fiber.StatusBadRequest, fmt.Sprintf("Order group %d missing wholeseller_id", i))
		}
		if group.FinalAmount <= 0 {
			return errorResponse(c, fiber.StatusBadRequest, fmt.Sprintf("Order group %d has invalid final amount", i))
		}
		goodsAmount += group.FinalAmount
		itemsCount += len(group.Items)

		for _, item := range group.Items {
			if item.WholesellerID != group.WholesellerID {
				return errorResponse(c, fiber.StatusBadRequest, fmt.Sprintf("Item wholeseller_id mismatch in group %d", i))
			}
		}
	}

	idempotencyKey, requestHash, err := deriveOrderIdempotencyKey(c, int64(retailerBusinessID), req)
	if err != nil {
		log.Printf("Failed to derive checkout session idempotency key: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to prepare checkout session request")
	}

	replay, acquired, err := acquireOrderIdempotency(
		context.Background(),
		checkoutSessionIdempotencyEndpoint,
		idempotencyKey,
		requestHash,
		int64(retailerBusinessID),
	)
	if err != nil {
		if fiberErr, ok := err.(*fiber.Error); ok {
			return c.Status(fiberErr.Code).JSON(fiber.Map{
				"status":  "error",
				"message": fiberErr.Message,
			})
		}
		log.Printf("Failed to acquire checkout session idempotency row: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to prepare checkout session request")
	}
	if replay != nil {
		return c.Status(replay.HTTPStatus).Type("json").Send(replay.Body)
	}

	idempotencyCompleted := false
	defer func() {
		if acquired && !idempotencyCompleted {
			if err := abandonOrderIdempotency(context.Background(), checkoutSessionIdempotencyEndpoint, idempotencyKey); err != nil {
				log.Printf("Failed to abandon checkout session idempotency key %s: %v", idempotencyKey, err)
			}
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		log.Printf("Failed to begin checkout session transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to start checkout session transaction")
	}

	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(context.Background())
		}
	}()

	repository := checkout.NewRepository()
	sourceCartDate := deriveCheckoutSourceDate(req.DateOfOrder)
	grossAmount := goodsAmount + req.DeliveryAmount

	session, err := repository.CreateCheckoutSession(ctx, tx, checkout.CreateCheckoutSessionParams{
		RetailerID:       int64(retailerBusinessID),
		RetailerUserID:   retailerUserID,
		RetailerBranchID: req.RetailerBranchID,
		SourceCartDate:   sourceCartDate,
		Currency:         "INR",
		GoodsAmount:      goodsAmount,
		DeliveryAmount:   req.DeliveryAmount,
		GrossAmount:      grossAmount,
		DeliveryAddress:  req.DeliveryAddress,
		Status:           checkout.StatusCreated,
		IdempotencyKey:   idempotencyKey,
		RequestHash:      requestHash,
	})
	if err != nil {
		log.Printf("Failed to create checkout session: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to create checkout session")
	}

	sortOrder := 0
	for _, group := range req.OrderGroups {
		for _, item := range group.Items {
			lineGoodsAmount := item.Quantity * item.Price
			lineFinalAmount := lineGoodsAmount - item.Discount + item.TaxAmount

			var selectedItemID *int64
			if item.SelectedID != 0 {
				selectedItemID = &item.SelectedID
			}
			var wholesellerBranchID *int64
			if item.BranchID != 0 {
				branchID := item.BranchID
				wholesellerBranchID = &branchID
			}
			var productNameSnapshot *string
			if item.ProductName != "" {
				name := item.ProductName
				productNameSnapshot = &name
			}
			var unitNameSnapshot *string
			if item.UnitName != "" {
				unitName := item.UnitName
				unitNameSnapshot = &unitName
			}

			_, err := repository.AddCheckoutSessionItem(ctx, tx, checkout.CreateCheckoutSessionItemParams{
				CheckoutSessionID:   session.CheckoutSessionID,
				SelectedItemID:      selectedItemID,
				WholesellerID:       item.WholesellerID,
				WholesellerBranchID: wholesellerBranchID,
				ProductID:           item.ProductID,
				UnitID:              item.UnitID,
				ProductNameSnapshot: productNameSnapshot,
				UnitNameSnapshot:    unitNameSnapshot,
				ImagePathSnapshot:   nil,
				Quantity:            item.Quantity,
				UnitPrice:           item.Price,
				DiscountAmount:      item.Discount,
				TaxAmount:           item.TaxAmount,
				LineGoodsAmount:     lineGoodsAmount,
				LineFinalAmount:     lineFinalAmount,
				SortOrder:           sortOrder,
			})
			if err != nil {
				log.Printf("Failed to create checkout session item: %v", err)
				return errorResponse(c, fiber.StatusInternalServerError, "Failed to snapshot checkout items")
			}
			sortOrder++
		}
	}

	clearDOE := time.Now().Format("2006-01-02")
	if sourceCartDate != nil {
		clearDOE = sourceCartDate.Format("2006-01-02")
	}
	if _, err := tx.Exec(
		ctx,
		"SELECT business_schema.clear_selected_items_by_retailer_and_date($1, $2)",
		int64(retailerBusinessID),
		clearDOE,
	); err != nil {
		log.Printf("Failed to clear cart after checkout snapshot: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to clear cart after checkout snapshot")
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("Failed to commit checkout session transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize checkout session")
	}
	committed = true

	responsePayload := fiber.Map{
		"status":  "success",
		"message": "Checkout session created successfully",
		"data": CheckoutSessionResponse{
			CheckoutSessionID: session.CheckoutSessionID,
			Status:            session.Status,
			GoodsAmount:       session.GoodsAmount,
			DeliveryAmount:    session.DeliveryAmount,
			GrossAmount:       session.GrossAmount,
			OrderGroupsCount:  len(req.OrderGroups),
			ItemsCount:        itemsCount,
		},
	}

	responseBody, err := json.Marshal(responsePayload)
	if err != nil {
		log.Printf("Failed to marshal checkout session response: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize checkout session")
	}

	if err := completeOrderIdempotency(context.Background(), checkoutSessionIdempotencyEndpoint, idempotencyKey, fiber.StatusOK, responseBody); err != nil {
		log.Printf("Failed to complete checkout session idempotency key %s: %v", idempotencyKey, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize checkout session")
	}
	idempotencyCompleted = true

	return c.Status(fiber.StatusOK).Type("json").Send(responseBody)
}

func deriveCheckoutSourceDate(dateOfOrder string) *time.Time {
	layouts := []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if ts, err := time.Parse(layout, dateOfOrder); err == nil {
			dateOnly := time.Date(ts.Year(), ts.Month(), ts.Day(), 0, 0, 0, 0, ts.Location())
			return &dateOnly
		}
	}

	now := time.Now()
	dateOnly := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return &dateOnly
}

func GetRetailerCheckoutSessions(c *fiber.Ctx) error {
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return errorResponse(c, fiber.StatusUnauthorized, "Unauthorized or invalid retailer user ID")
	}
	if retailerUserID == -1 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid retailer user ID")
	}

	var retailerBusinessID int64
	err = db.Pool.QueryRow(context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID).Scan(&retailerBusinessID)
	if err != nil {
		log.Printf("Error fetching retailer business ID for user %d: %v", retailerUserID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch retailer business ID")
	}

	statuses := parseCheckoutSessionStatuses(c.Query("statuses"))
	limit := c.QueryInt("limit", 20)
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	repository := checkout.NewRepository()
	if _, err := repository.ExpireStaleCheckoutSessions(
		context.Background(),
		nil,
		time.Now().Add(-checkoutPendingPaymentTimeout),
	); err != nil {
		log.Printf("Failed to expire stale checkout sessions for retailer %d: %v", retailerBusinessID, err)
	}
	sessions, err := repository.ListRetailerCheckoutSessionsByStatus(
		context.Background(),
		nil,
		retailerBusinessID,
		statuses,
		limit,
	)
	if err != nil {
		log.Printf("Failed to list checkout sessions for retailer %d: %v", retailerBusinessID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch checkout sessions")
	}

	summaries := make([]RetailerCheckoutSessionSummary, 0, len(sessions))
	for _, session := range sessions {
		summaries = append(summaries, buildRetailerCheckoutSessionSummary(session))
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Checkout sessions fetched successfully",
		"data": fiber.Map{
			"checkout_sessions": summaries,
		},
	})
}

func GetRetailerCheckoutSessionDetail(c *fiber.Ctx) error {
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return errorResponse(c, fiber.StatusUnauthorized, "Unauthorized or invalid retailer user ID")
	}
	if retailerUserID == -1 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid retailer user ID")
	}

	var retailerBusinessID int64
	if err := db.Pool.QueryRow(context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID,
	).Scan(&retailerBusinessID); err != nil {
		log.Printf("Error fetching retailer business ID for user %d: %v", retailerUserID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch retailer business ID")
	}

	checkoutSessionID, err := c.ParamsInt("checkout_session_id")
	if err != nil || checkoutSessionID <= 0 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid checkout session ID")
	}

	repository := checkout.NewRepository()
	if _, err := repository.ExpireStaleCheckoutSessions(
		context.Background(),
		nil,
		time.Now().Add(-checkoutPendingPaymentTimeout),
	); err != nil {
		log.Printf("Failed to expire stale checkout session %d before detail load: %v", checkoutSessionID, err)
	}

	session, err := repository.GetCheckoutSessionByID(context.Background(), nil, int64(checkoutSessionID))
	if err != nil {
		log.Printf("Failed to fetch checkout session %d: %v", checkoutSessionID, err)
		return errorResponse(c, fiber.StatusNotFound, "Checkout session not found")
	}
	if session.RetailerID != retailerBusinessID {
		return errorResponse(c, fiber.StatusForbidden, "Checkout session does not belong to this retailer")
	}

	items, err := repository.ListCheckoutSessionItems(context.Background(), nil, session.CheckoutSessionID)
	if err != nil {
		log.Printf("Failed to fetch checkout session items for %d: %v", session.CheckoutSessionID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch checkout session items")
	}

	groups := buildRetailerCheckoutSessionGroups(items)
	timeoutAt, secondsUntilTimeout := deriveCheckoutPaymentTimeout(*session)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Checkout session fetched successfully",
		"data": RetailerCheckoutSessionDetail{
			CheckoutSessionID:      session.CheckoutSessionID,
			Status:                 session.Status,
			RetailerBranchID:       session.RetailerBranchID,
			GoodsAmount:            session.GoodsAmount,
			DeliveryAmount:         session.DeliveryAmount,
			GrossAmount:            session.GrossAmount,
			DeliveryAddress:        session.DeliveryAddress,
			CurrentPaymentIntentID: session.CurrentPaymentIntentID,
			PaymentStartedAt:       session.PaymentStartedAt,
			PaymentFailedAt:        session.PaymentFailedAt,
			PaymentTimeoutAt:       timeoutAt,
			SecondsUntilTimeout:    secondsUntilTimeout,
			LastPaymentErrorCode:   session.LastPaymentErrorCode,
			LastPaymentError:       session.LastPaymentErrorMessage,
			CanResumePayment:       canResumeCheckoutPayment(session.Status),
			CanRetryPayment:        canRetryCheckoutPayment(session.Status),
			CanCancelCheckout:      canCancelCheckout(session.Status),
			OrderGroups:            groups,
			CreatedAt:              session.CreatedAt,
			UpdatedAt:              session.UpdatedAt,
		},
	})
}

func buildRetailerCheckoutSessionSummary(session checkout.CheckoutSession) RetailerCheckoutSessionSummary {
	timeoutAt, secondsUntilTimeout := deriveCheckoutPaymentTimeout(session)
	return RetailerCheckoutSessionSummary{
		CheckoutSessionID:      session.CheckoutSessionID,
		Status:                 session.Status,
		GoodsAmount:            session.GoodsAmount,
		DeliveryAmount:         session.DeliveryAmount,
		GrossAmount:            session.GrossAmount,
		DeliveryAddress:        session.DeliveryAddress,
		CurrentPaymentIntentID: session.CurrentPaymentIntentID,
		PaymentStartedAt:       session.PaymentStartedAt,
		PaymentFailedAt:        session.PaymentFailedAt,
		ExpiredAt:              session.ExpiredAt,
		PaymentTimeoutAt:       timeoutAt,
		SecondsUntilTimeout:    secondsUntilTimeout,
		LastPaymentErrorCode:   session.LastPaymentErrorCode,
		LastPaymentError:       session.LastPaymentErrorMessage,
		CanResumePayment:       canResumeCheckoutPayment(session.Status),
		CanRetryPayment:        canRetryCheckoutPayment(session.Status),
		CanCancelCheckout:      canCancelCheckout(session.Status),
		CreatedAt:              session.CreatedAt,
		UpdatedAt:              session.UpdatedAt,
	}
}

func deriveCheckoutPaymentTimeout(session checkout.CheckoutSession) (*time.Time, *int64) {
	if session.Status != checkout.StatusCreated && session.Status != checkout.StatusPaymentPending {
		return nil, nil
	}

	startAt := session.CreatedAt
	if session.PaymentStartedAt != nil {
		startAt = *session.PaymentStartedAt
	}

	timeoutAt := startAt.Add(checkoutPendingPaymentTimeout)
	remaining := time.Until(timeoutAt)
	remainingSeconds := int64(remaining / time.Second)
	if remainingSeconds < 0 {
		remainingSeconds = 0
	}

	return &timeoutAt, &remainingSeconds
}

func parseCheckoutSessionStatuses(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return append([]string(nil), defaultIncompleteCheckoutStatuses...)
	}

	allowed := map[string]struct{}{
		checkout.StatusCreated:         {},
		checkout.StatusPaymentPending:  {},
		checkout.StatusPaymentFailed:   {},
		checkout.StatusPaymentExpired:  {},
		checkout.StatusPaymentCaptured: {},
		checkout.StatusCancelled:       {},
		checkout.StatusMaterialized:    {},
	}

	seen := make(map[string]struct{})
	statuses := make([]string, 0)
	for _, part := range strings.Split(raw, ",") {
		status := strings.TrimSpace(part)
		if status == "" {
			continue
		}
		if _, ok := allowed[status]; !ok {
			continue
		}
		if _, ok := seen[status]; ok {
			continue
		}
		seen[status] = struct{}{}
		statuses = append(statuses, status)
	}

	if len(statuses) == 0 {
		return append([]string(nil), defaultIncompleteCheckoutStatuses...)
	}
	return statuses
}

func canResumeCheckoutPayment(status string) bool {
	return status == checkout.StatusCreated || status == checkout.StatusPaymentPending
}

func canRetryCheckoutPayment(status string) bool {
	return status == checkout.StatusPaymentFailed || status == checkout.StatusPaymentExpired
}

func canCancelCheckout(status string) bool {
	return status == checkout.StatusCreated ||
		status == checkout.StatusPaymentPending ||
		status == checkout.StatusPaymentFailed ||
		status == checkout.StatusPaymentExpired
}

func buildRetailerCheckoutSessionGroups(items []checkout.CheckoutSessionItem) []RetailerCheckoutSessionDetailGroup {
	type groupKey struct {
		wholesellerID int
		branchID      int64
	}

	groupMap := make(map[groupKey]*RetailerCheckoutSessionDetailGroup)
	groupOrder := make([]groupKey, 0)

	for _, item := range items {
		var branchIDValue int64
		if item.WholesellerBranchID != nil {
			branchIDValue = *item.WholesellerBranchID
		}
		key := groupKey{
			wholesellerID: item.WholesellerID,
			branchID:      branchIDValue,
		}

		group, exists := groupMap[key]
		if !exists {
			group = &RetailerCheckoutSessionDetailGroup{
				WholesellerID: item.WholesellerID,
				BranchID:      item.WholesellerBranchID,
				Items:         make([]RetailerCheckoutSessionDetailItem, 0),
			}
			groupMap[key] = group
			groupOrder = append(groupOrder, key)
		}

		group.Items = append(group.Items, RetailerCheckoutSessionDetailItem{
			SelectedID:    item.SelectedItemID,
			ProductID:     item.ProductID,
			ProductName:   derefString(item.ProductNameSnapshot),
			Quantity:      item.Quantity,
			UnitID:        item.UnitID,
			UnitName:      derefString(item.UnitNameSnapshot),
			Price:         item.UnitPrice,
			Discount:      item.DiscountAmount,
			TaxAmount:     item.TaxAmount,
			WholesellerID: item.WholesellerID,
			BranchID:      item.WholesellerBranchID,
		})
		group.TotalOrderAmount += item.LineGoodsAmount
		group.DiscountAmount += item.DiscountAmount
		group.TaxAmount += item.TaxAmount
		group.FinalAmount += item.LineFinalAmount
	}

	result := make([]RetailerCheckoutSessionDetailGroup, 0, len(groupOrder))
	for _, key := range groupOrder {
		result = append(result, *groupMap[key])
	}
	return result
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
