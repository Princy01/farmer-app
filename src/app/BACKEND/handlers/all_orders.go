package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/checkout"
	"farmerapp/internal/common/utils"
	commonverification "farmerapp/internal/common/verification"

	"github.com/gofiber/fiber/v2"
	// "github.com/jackc/pgx/v4"
)

const (
	branchLocationVerificationPending  = "pending_verification"
	branchLocationVerificationVerified = "verified"
)

// ssh -p 6622 -L 5433:localhost:5432 root@195.250.30.42
// Order represents the structure of an order request
// type Item struct {
// 	SelectedID    int64   `json:"selected_id,omitempty"`
// 	ProductID     int64   `json:"product_id"`
// 	ProductName   string  `json:"product_name"`
// 	Quantity      float64 `json:"quantity"`
// 	UnitID        int     `json:"unit_id"`
// 	Price         float64 `json:"price"`
// 	Discount      float64 `json:"discount_amount"`
// 	TaxAmount     float64 `json:"tax_amount"`
// 	WholesellerID int     `json:"wholeseller_id"`
// 	BranchID      int     `json:"branch_id"`
// }

type Item struct {
	SelectedID      int64   `json:"selected_id,omitempty"`
	ProductID       int64   `json:"product_id"`
	ProductName     string  `json:"product_name"`
	Quantity        float64 `json:"quantity"`
	UnitID          int     `json:"unit_id"`
	UnitName        string  `json:"unit_name"`
	Price           float64 `json:"price"`
	Discount        float64 `json:"discount_amount"`
	TaxAmount       float64 `json:"tax_amount"`
	WholesellerID   int     `json:"wholeseller_id"`
	WholesellerName string  `json:"wholeseller_name"`
	BranchID        int64   `json:"branch_id"`
}

type CreateOrderRequest struct {
	DateOfOrder      string  `json:"date_of_order"`
	OrderStatus      int     `json:"order_status"`
	RetailerID       int64   `json:"retailer_id"`
	WholesellerID    int     `json:"wholeseller_id"`
	TotalOrderAmount float64 `json:"total_order_amount"`
	DiscountAmount   float64 `json:"discount_amount"`
	TaxAmount        float64 `json:"tax_amount"`
	FinalAmount      float64 `json:"final_amount"`
	DeliveryAmount   float64 `json:"delivery_amount"`
	DeliveryAddress  string  `json:"delivery_address"`
	Items            []Item  `json:"items"`
}

// OrderResponse represents the response structure for order operations
type OrderResponse struct {
	OrderID int64  `json:"order_id,omitempty"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// ProductDetail represents detailed information about a product in an order
type ProductDetail struct {
	OrderItemID  int64   `json:"order_item_id"`
	ProductID    int64   `json:"product_id"`
	ProductName  string  `json:"product_name"`
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Quantity     float64 `json:"quantity"`
	UnitID       int     `json:"unit_id"`
	UnitName     string  `json:"unit_name"`
	MaxPrice     float64 `json:"max_item_price"`

	BranchID      *int    `json:"branch_id,omitempty"`
	BranchName    *string `json:"branch_name,omitempty"`
	BranchAddress *string `json:"branch_address,omitempty"`
	BranchNumber  *string `json:"branch_number,omitempty"`
}

// OrderItemDetail represents detailed information about an order item
type OrderItemDetail struct {
	OrderItemID  int64   `json:"order_item_id"`
	ProductID    int64   `json:"product_id"`
	ProductName  string  `json:"product_name"`
	Quantity     float64 `json:"quantity"`
	UnitID       int     `json:"unit_id"`
	UnitName     string  `json:"unit_name"`
	MaxItemPrice float64 `json:"max_item_price"`
}

type OrderItemDetails struct {
	OrderID            int64           `json:"order_id"`
	RetailerID         int             `json:"retailer_id"`
	RetailerName       string          `json:"retailer_name"`
	RetailerAddress    string          `json:"retailer_address"`
	RetailerMobile     string          `json:"retailer_mobile"`
	ActualDeliveryDate string          `json:"actual_delivery_date"`
	OrderStatusID      int             `json:"order_status_id"`
	OrderStatus        string          `json:"order_status"`
	TotalOrderAmount   float64         `json:"total_order_amount"`
	CreatedAt          string          `json:"created_at"`
	OrderItems         []OrderItemData `json:"order_items"`
}

// OrderDetailResponse represents the detailed response for an order
type OrderDetailResponse struct {
	OrderID            int64      `json:"order_id"`
	DateOfOrder        time.Time  `json:"date_of_order"`
	OrderStatus        int        `json:"order_status"`
	ActualDeliveryDate *time.Time `json:"actual_delivery_date,omitempty"`

	RetailerID      int    `json:"retailer_id"`
	RetailerName    string `json:"retailer_name"`
	RetailerAddress string `json:"retailer_address"`
	RetailerMobile  string `json:"retailer_mobile"`

	TotalOrderAmount float64 `json:"total_order_amount"`
	DiscountAmount   float64 `json:"discount_amount"`
	TaxAmount        float64 `json:"tax_amount"`
	FinalAmount      float64 `json:"final_amount"`

	Products []ProductDetail `json:"products"`
}

type OrderItemData struct {
	OrderItemID  int64   `json:"order_item_id"`
	ProductID    int64   `json:"product_id"`
	ProductName  string  `json:"product_name"`
	Quantity     float64 `json:"quantity"`
	UnitID       int     `json:"unit_id"`
	UnitName     string  `json:"unit_name"`
	MaxItemPrice float64 `json:"max_item_price"`
}

// OrderGroup represents one wholesaler's order with pre-calculated pricing
type OrderGroup struct {
	WholesellerID    int     `json:"wholeseller_id"`
	BranchID         int     `json:"branch_id"`
	Items            []Item  `json:"items"`
	TotalOrderAmount float64 `json:"total_order_amount"`
	DiscountAmount   float64 `json:"discount_amount"`
	TaxAmount        float64 `json:"tax_amount"`
	FinalAmount      float64 `json:"final_amount"`
}

// CreateBatchOrderRequest accepts multiple order groups in one request
type CreateBatchOrderRequest struct {
	DateOfOrder       string       `json:"date_of_order"`
	OrderStatus       int          `json:"order_status"`
	DeliveryAddress   string       `json:"delivery_address"`
	OrderGroups       []OrderGroup `json:"order_groups"`
	DeliveryAmount    float64      `json:"delivery_amount"` // total transport cost, stored separately
	RetailerBranchID  int          `json:"retailer_branch_id"`
	CheckoutSessionID *int64       `json:"checkout_session_id,omitempty"`
}

// CompletedOrderDetail represents a completed order with its items
type CompletedOrderDetail struct {
	OrderID          int64             `json:"order_id"`
	TotalOrderAmount float64           `json:"total_order_amount"`
	OrderItems       []OrderItemDetail `json:"order_items"`
}

// type RetailerOrderResponse struct {
// 	OrderID            int64      `json:"order_id"`
// 	DateOfOrder        time.Time  `json:"date_of_order"`
// 	OrderStatus        int        `json:"order_status"`
// 	ActualDeliveryDate *time.Time `json:"actual_delivery_date,omitempty"`
// 	RetailerID         int64      `json:"retailer_id"`
// 	WholesellerIDs     []int      `json:"wholeseller_ids"`
// 	DeliveryAddress    string     `json:"delivery_address"`
// 	TotalOrderAmount   float64    `json:"total_order_amount"`
// 	DiscountAmount     float64    `json:"discount_amount"`
// 	TaxAmount          float64    `json:"tax_amount"`
// 	FinalAmount        float64    `json:"final_amount"`
// 	Items              []Item     `json:"items"`
// }

type RetailerOrderResponse struct {
	OrderID            int64      `json:"order_id"`
	DateOfOrder        time.Time  `json:"date_of_order"`
	OrderStatus        int        `json:"order_status"`
	OrderStatusName    string     `json:"order_status_name"`
	ActualDeliveryDate *time.Time `json:"actual_delivery_date,omitempty"`
	RetailerID         int64      `json:"retailer_id"`
	WholesellerIDs     []int      `json:"wholeseller_ids"`
	DeliveryAddress    string     `json:"delivery_address"`
	TotalOrderAmount   float64    `json:"total_order_amount"`
	DiscountAmount     float64    `json:"discount_amount"`
	TaxAmount          float64    `json:"tax_amount"`
	FinalAmount        float64    `json:"final_amount"`
	Items              []Item     `json:"items"`
}

type retailerBranchOperationalVerification struct {
	DocumentStatus string
	LocationStatus string
}

type retailerBusinessOperationalVerification struct {
	PANStatus     string
	AadhaarStatus string
}

func getRetailerBusinessOperationalVerification(ctx context.Context, retailerBusinessID int) (*retailerBusinessOperationalVerification, error) {
	var (
		panStatus     sql.NullString
		aadhaarStatus sql.NullString
	)

	err := db.Pool.QueryRow(ctx, `
		SELECT
			COALESCE(pan_verification_status, 'pending_documents'),
			COALESCE(aadhaar_verification_status, 'pending_documents')
		FROM admin_schema.business_table
		WHERE bid = $1
	`, retailerBusinessID).Scan(&panStatus, &aadhaarStatus)
	if err != nil {
		return nil, err
	}

	return &retailerBusinessOperationalVerification{
		PANStatus:     commonverification.NormalizeBusinessVerificationStatus(panStatus.String),
		AadhaarStatus: commonverification.NormalizeBusinessVerificationStatus(aadhaarStatus.String),
	}, nil
}

func getRetailerBranchOperationalVerification(ctx context.Context, retailerBusinessID, branchID int) (*retailerBranchOperationalVerification, bool, error) {
	var (
		count          int
		documentStatus sql.NullString
		locationStatus sql.NullString
	)

	err := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*),
			MAX(document_verification_status),
			MAX(location_verification_status)
		FROM admin_schema.business_branch_table
		WHERE b_branch_id = $1
		  AND bid = $2
	`, branchID, retailerBusinessID).Scan(&count, &documentStatus, &locationStatus)
	if err != nil {
		return nil, false, err
	}
	if count == 0 {
		return nil, false, nil
	}

	result := &retailerBranchOperationalVerification{
		DocumentStatus: commonverification.NormalizeBranchDocumentVerificationStatus(documentStatus.String),
		LocationStatus: branchLocationVerificationPending,
	}
	if locationStatus.Valid && strings.TrimSpace(locationStatus.String) != "" {
		result.LocationStatus = strings.TrimSpace(locationStatus.String)
	}

	return result, true, nil
}

// CreateBatchRetailerOrder creates multiple orders (one per wholesaler group) in a single transaction
func CreateBatchRetailerOrder(c *fiber.Ctx) error {
	// ─── Auth ────────────────────────────────────────────────────────────────
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return errorResponse(c, fiber.StatusUnauthorized, "Unauthorized or invalid retailer user ID")
	}
	if retailerUserID == -1 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid retailer user ID")
	}

	var retailerBusinessID int
	// Inline sql fixed
	err = db.Pool.QueryRow(context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID).Scan(&retailerBusinessID)
	if err != nil {
		log.Printf("Error fetching business ID for user %d: %v", retailerUserID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch retailer business ID")
	}

	// ─── Parse & validate request ────────────────────────────────────────────
	var req CreateBatchOrderRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Error parsing body: %v", err)
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
	if err := validateMaterializedOrderStatus(req.OrderStatus); err != nil {
		return errorResponse(c, fiber.StatusBadRequest, "Payment-only statuses must not be used when creating real orders")
	}

	checkoutRepo := checkout.NewRepository()
	if req.CheckoutSessionID != nil {
		session, err := checkoutRepo.GetCheckoutSessionByID(context.Background(), nil, *req.CheckoutSessionID)
		if err != nil {
			log.Printf("Error fetching checkout session %d: %v", *req.CheckoutSessionID, err)
			return errorResponse(c, fiber.StatusBadRequest, "Checkout session not found")
		}
		if session.RetailerID != int64(retailerBusinessID) {
			return errorResponse(c, fiber.StatusForbidden, "Checkout session does not belong to this retailer")
		}

		if session.Status == checkout.StatusMaterialized {
			existingOrders, err := checkoutRepo.ListCheckoutSessionOrders(context.Background(), nil, session.CheckoutSessionID)
			if err != nil {
				log.Printf("Error loading existing checkout session orders for %d: %v", session.CheckoutSessionID, err)
				return errorResponse(c, fiber.StatusInternalServerError, "Failed to load existing orders for checkout session")
			}
			if len(existingOrders) > 0 {
				orderIDs := make([]int64, 0, len(existingOrders))
				for _, existingOrder := range existingOrders {
					orderIDs = append(orderIDs, existingOrder.OrderID)
				}
				responseBody, err := buildCreateOrderResponseBody(orderIDs, req)
				if err != nil {
					log.Printf("Failed to marshal existing checkout-session order response: %v", err)
					return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize orders")
				}
				return c.Status(fiber.StatusOK).Type("json").Send(responseBody)
			}
			return errorResponse(c, fiber.StatusConflict, "Checkout session is already materialized")
		}

		if session.Status != checkout.StatusPaymentCaptured {
			return errorResponse(c, fiber.StatusBadRequest, "Checkout session must have a captured payment before creating real orders")
		}
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

	// Validate each group
	for i, group := range req.OrderGroups {
		if len(group.Items) == 0 {
			return errorResponse(c, fiber.StatusBadRequest,
				fmt.Sprintf("Order group %d has no items", i))
		}
		if group.WholesellerID == 0 {
			return errorResponse(c, fiber.StatusBadRequest,
				fmt.Sprintf("Order group %d missing wholeseller_id", i))
		}
		if group.FinalAmount <= 0 {
			return errorResponse(c, fiber.StatusBadRequest,
				fmt.Sprintf("Order group %d has invalid final amount", i))
		}

		// Validate all items in group belong to same wholesaler (data integrity)
		for _, item := range group.Items {
			if item.WholesellerID != group.WholesellerID {
				return errorResponse(c, fiber.StatusBadRequest,
					fmt.Sprintf("Item wholeseller_id mismatch in group %d", i))
			}
		}
	}

	idempotencyKey, requestHash, err := deriveOrderIdempotencyKey(c, int64(retailerBusinessID), req)
	if err != nil {
		log.Printf("Failed to derive idempotency key: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to prepare order request")
	}

	replay, acquired, err := acquireOrderIdempotency(
		context.Background(),
		orderIdempotencyEndpoint,
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
		log.Printf("Failed to acquire order idempotency row: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to prepare order request")
	}
	if replay != nil {
		return c.Status(replay.HTTPStatus).Type("json").Send(replay.Body)
	}

	idempotencyCompleted := false
	defer func() {
		if acquired && !idempotencyCompleted {
			if err := abandonOrderIdempotency(context.Background(), orderIdempotencyEndpoint, idempotencyKey); err != nil {
				log.Printf("Failed to abandon order idempotency key %s: %v", idempotencyKey, err)
			}
		}
	}()

	// ─── Open transaction ────────────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to start order transaction")
	}

	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(context.Background())
		}
	}()

	// ─── Insert one order per group ──────────────────────────────────────────
	var orderIDs []int64

	for i, group := range req.OrderGroups {
		itemsJSON, err := json.Marshal(group.Items)
		if err != nil {
			log.Printf("Failed to marshal items for group %d: %v", i, err)
			return errorResponse(c, fiber.StatusBadRequest, "Invalid items data")
		}

		var orderID int64
		err = tx.QueryRow(
			ctx,
			`SELECT business_schema.insert_order(
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
			req.DateOfOrder,           // $1  date_of_order
			req.OrderStatus,           // $2  order_status
			int64(retailerBusinessID), // $3  retailer_id
			group.WholesellerID,       // $4  wholeseller_id
			group.TotalOrderAmount,    // $5  total_order_amount
			group.DiscountAmount,      // $6  discount_amount
			group.TaxAmount,           // $7  tax_amount
			req.DeliveryAmount,        // $8  delivery_amount
			group.FinalAmount,         // $9  final_amount (does not include delivery)
			req.DeliveryAddress,       // $10  delivery_address
			string(itemsJSON),         // $11 items (JSON)
			nil,                       // $12 actual_delivery_date
			nil,                       // $13 cancellation_reason
			nil,                       // $14 cancelled_by_user_id
			nil,                       // $15 created_at (use DB default)
			nil,                       // $16 updated_at (use DB default)
			req.RetailerBranchID,      // $17 retailer_branch_id
		).Scan(&orderID)

		if err != nil {
			log.Printf("Failed to insert order for wholesaler %d: %v", group.WholesellerID, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": fmt.Sprintf("Failed to insert order for wholesaler %d: %s", group.WholesellerID, err.Error()),
			})
		}

		orderIDs = append(orderIDs, orderID)
		log.Printf("Created order %d for wholesaler %d (items: %d, final: %.2f)",
			orderID, group.WholesellerID, len(group.Items), group.FinalAmount)

		if req.CheckoutSessionID != nil {
			if _, err := checkoutRepo.AddCheckoutSessionOrder(ctx, tx, checkout.CreateCheckoutSessionOrderParams{
				CheckoutSessionID: *req.CheckoutSessionID,
				OrderID:           orderID,
				WholesellerID:     group.WholesellerID,
			}); err != nil {
				log.Printf("Failed to link checkout session %d to order %d: %v", *req.CheckoutSessionID, orderID, err)
				return errorResponse(c, fiber.StatusInternalServerError, "Failed to link checkout session to created orders")
			}
		}
	}

	if req.CheckoutSessionID != nil {
		if _, err := checkoutRepo.MarkCheckoutSessionMaterialized(ctx, tx, *req.CheckoutSessionID, time.Now()); err != nil {
			log.Printf("Failed to mark checkout session %d as materialized: %v", *req.CheckoutSessionID, err)
			return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize checkout session")
		}
	}

	// ─── Commit transaction ──────────────────────────────────────────────────
	if err := tx.Commit(ctx); err != nil {
		log.Printf("Failed to commit order transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize orders")
	}
	committed = true

	responseBody, err := buildCreateOrderResponseBody(orderIDs, req)
	if err != nil {
		log.Printf("Failed to marshal idempotent order response: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize orders")
	}

	if err := completeOrderIdempotency(context.Background(), orderIdempotencyEndpoint, idempotencyKey, fiber.StatusOK, responseBody); err != nil {
		log.Printf("Failed to complete order idempotency key %s: %v", idempotencyKey, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize orders")
	}
	idempotencyCompleted = true

	return c.Status(fiber.StatusOK).Type("json").Send(responseBody)
}

func buildCreateOrderResponseBody(orderIDs []int64, req CreateBatchOrderRequest) ([]byte, error) {
	var ordersTotal float64
	for _, group := range req.OrderGroups {
		ordersTotal += group.FinalAmount
	}
	grandTotal := ordersTotal + req.DeliveryAmount

	responsePayload := fiber.Map{
		"status":        "success",
		"message":       "Orders created successfully",
		"order_ids":     orderIDs,
		"orders_total":  ordersTotal,
		"delivery_cost": req.DeliveryAmount,
		"grand_total":   grandTotal,
	}

	return json.Marshal(responsePayload)
}

func CreateRetailerOrder(c *fiber.Ctx) error {
	// ─── Auth ────────────────────────────────────────────────────────────────
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return errorResponse(c, fiber.StatusUnauthorized, "Unauthorized or invalid retailer user ID")
	}
	if retailerUserID == -1 {
		return errorResponse(c, fiber.StatusBadRequest, "Invalid retailer user ID")
	}

	var retailerBusinessID int
	// Inline sql fixed
	err = db.Pool.QueryRow(context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID).Scan(&retailerBusinessID)
	if err != nil {
		log.Printf("Error fetching business ID for user %d: %v", retailerUserID, err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to fetch retailer business ID")
	}

	// ─── Parse & validate request ────────────────────────────────────────────
	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Error parsing body: %v", err)
		return errorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.Items) == 0 {
		return errorResponse(c, fiber.StatusBadRequest, "No items are selected")
	}
	if req.DeliveryAddress == "" {
		return errorResponse(c, fiber.StatusBadRequest, "Delivery address is required")
	}
	if err := validateMaterializedOrderStatus(req.OrderStatus); err != nil {
		return errorResponse(c, fiber.StatusBadRequest, "Payment-only statuses must not be used when creating real orders")
	}

	// ─── Group items by wholesaler ───────────────────────────────────────────
	wholesalerGroups := make(map[int][]Item)
	for _, item := range req.Items {
		if item.WholesellerID == 0 {
			return errorResponse(c, fiber.StatusBadRequest, "Each item must have a wholeseller_id")
		}
		wholesalerGroups[item.WholesellerID] = append(wholesalerGroups[item.WholesellerID], item)
	}

	// ─── Split delivery cost evenly across wholesaler groups ─────────────────
	groupCount := len(wholesalerGroups)
	deliveryPerGroup := req.DeliveryAmount / float64(groupCount)

	// ─── Open a transaction so all-or-nothing ────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to start order transaction")
	}
	// Ensure rollback on any early return
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(context.Background())
		}
	}()

	// ─── Insert one order per wholesaler ─────────────────────────────────────
	var orderIDs []int64

	for wholesalerID, items := range wholesalerGroups {
		// Compute per-group totals
		var totalAmount, discountAmount, taxAmount, finalAmount float64
		for _, item := range items {
			lineTotal := item.Quantity * item.Price
			totalAmount += lineTotal
			discountAmount += item.Discount
			taxAmount += item.TaxAmount
			finalAmount += lineTotal - item.Discount + item.TaxAmount
		}
		finalAmount += deliveryPerGroup // add this group's share of delivery

		if finalAmount <= 0 {
			log.Printf("Skipping wholesaler %d: finalAmount <= 0", wholesalerID)
			continue
		}

		itemsJSON, err := json.Marshal(items)
		if err != nil {
			log.Printf("Failed to marshal items for wholesaler %d: %v", wholesalerID, err)
			return errorResponse(c, fiber.StatusBadRequest, "Invalid items data")
		}

		var orderID int64
		err = tx.QueryRow(
			ctx,
			`SELECT business_schema.insert_order(
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
			req.DateOfOrder,           // $1
			req.OrderStatus,           // $2
			int64(retailerBusinessID), // $3  retailer business id
			wholesalerID,              // $4  wholesaler business id
			totalAmount,               // $5
			discountAmount,            // $6
			taxAmount,                 // $7
			finalAmount,               // $8
			req.DeliveryAddress,       // $9
			string(itemsJSON),         // $10 items JSON
			nil,                       // $11 actual_delivery_date  (NULL)
			nil,                       // $12 cancellation_reason   (NULL)
			nil,                       // $13 cancelled_by_user_id  (NULL)
			nil,                       // $14 created_at            (NULL → use DB default)
			nil,                       // $15 updated_at            (NULL → use DB default)
		).Scan(&orderID)

		if err != nil {
			log.Printf("Failed to insert order for wholesaler %d: %v", wholesalerID, err)
			// tx will be rolled back by the deferred function
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": fmt.Sprintf("Failed to insert order for wholesaler %d: %s", wholesalerID, err.Error()),
			})
		}

		orderIDs = append(orderIDs, orderID)
		log.Printf("Created order %d for wholesaler %d (items: %d, final: %.2f)",
			orderID, wholesalerID, len(items), finalAmount)
	}

	// ─── Commit ──────────────────────────────────────────────────────────────
	if err := tx.Commit(ctx); err != nil {
		log.Printf("Failed to commit order transaction: %v", err)
		return errorResponse(c, fiber.StatusInternalServerError, "Failed to finalize orders")
	}
	committed = true

	return c.JSON(fiber.Map{
		"message":   "Orders created successfully",
		"order_ids": orderIDs,
	})
}

// CreateRetailerOrderHandler handles the creation of a new retailer order
// func CreateRetailerOrder(c *fiber.Ctx) error {
// 	var req CreateOrderRequest
// 	if err := c.BodyParser(&req); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(OrderResponse{
// 			Status:  "error",
// 			Message: "Invalid request body: " + err.Error(),
// 		})create_retai
// 	}

// 	// Validate required fields

// 	if len(req.Items) == 0 {
// 		return c.Status(fiber.StatusBadRequest).JSON(OrderResponse{
// 			Status:  "error",
// 			Message: "At least one product is required",
// 		})
// 	}

// 	/*
// 		if len(req.ProductIDs) != len(req.Quantities) ||
// 			len(req.ProductIDs) != len(req.UnitIDs) ||
// 			len(req.ProductIDs) != len(req.MaxItemPrices) {
// 			return c.Status(fiber.StatusBadRequest).JSON(OrderResponse{
// 				Status:  "error",
// 				Message: "Product IDs, quantities, unit IDs, and max prices arrays must have the same length",
// 			})
// 		} */

// 	var orderID int64
// 	var status, message string

// 	query := `
// 		SELECT order_id, status, message FROM business_schema.create_retailer_order(
// 			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
// 		)`

// 	err := db.Pool.QueryRow(context.Background(), query,
// 		req.RetailerID,
// 		req.RetailerContact,
// 		req.Pincode,
// 		req.Address,
// 		req.MaxPriceLimit,
// 		req.DesiredDeliveryDate,
// 		req.DeliveryDeadline,
// 		req.Items,
// 		req.WholesellerID,
// 	/*req.ProductIDs,
// 	req.Quantities,
// 	req.UnitIDs,
// 	req.MaxItemPrices,
// 	req.WholesellerIDs,*/
// 	).Scan(&orderID, &status, &message)

// 	if err != nil {
// 		log.Printf("Order creation failed: %v", err)
// 		return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
// 			Status:  "error",
// 			Message: "Database operation failed: " + err.Error(),
// 		})
// 	}

// 	return c.Status(fiber.StatusCreated).JSON(OrderResponse{
// 		OrderID: orderID,
// 		Status:  status,
// 		Message: message,
// 	})
// }

// GetOrderDetailsHandler retrieves detailed information about a specific order
func GetOrderDetailsHandler(c *fiber.Ctx) error {
	// 1. Get user_id from JWT
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(OrderResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
	}

	// 2. Parse order_id
	orderIDStr := c.Params("id")
	if orderIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(OrderResponse{
			Status:  "error",
			Message: "Order ID is required",
		})
	}

	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(OrderResponse{
			Status:  "error",
			Message: "Invalid order ID",
		})
	}

	// 3. Call DB function
	query := `SELECT * FROM business_schema.get_order_details_for_wholeseller($1, $2);`

	rows, err := db.Pool.Query(context.Background(), query, userID, orderID)
	if err != nil {
		log.Printf("DB error: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(OrderResponse{
			Status:  "error",
			Message: "Failed to fetch order details",
		})
	}
	defer rows.Close()

	var response *OrderDetailResponse
	var products []ProductDetail

	for rows.Next() {
		var (
			orderID     int64
			orderItemID int64
			productID   int64
			orderStatus *int
			retailerID  int
			categoryID  int
			unitID      int

			dateOfOrder        time.Time
			actualDeliveryDate *time.Time

			totalOrderAmount *float64
			discountAmount   *float64
			taxAmount        *float64
			finalAmount      *float64
			quantity         *float64
			maxItemPrice     *float64

			retailerName    string
			retailerAddress string
			retailerMobile  string
			productName     string
			categoryName    string
			unitName        string

			branchID      *int
			branchName    *string
			branchAddress *string
			branchNumber  *string
		)

		err := rows.Scan(
			&orderID,
			&dateOfOrder,
			&orderStatus,
			&actualDeliveryDate,
			&retailerID,
			&totalOrderAmount,
			&discountAmount,
			&taxAmount,
			&finalAmount,
			&retailerName,
			&retailerAddress,
			&retailerMobile,
			&orderItemID,
			&productID,
			&productName,
			&categoryID,
			&categoryName,
			&quantity,
			&unitID,
			&unitName,
			&maxItemPrice,
			&branchID,
			&branchName,
			&branchAddress,
			&branchNumber,
		)

		if err != nil {
			log.Printf("Scan error: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(OrderResponse{
				Status:  "error",
				Message: "Failed to parse order details",
			})
		}

		// Initialize response once
		if response == nil {
			response = &OrderDetailResponse{
				OrderID:            orderID,
				DateOfOrder:        dateOfOrder,
				OrderStatus:        derefInt(orderStatus),
				ActualDeliveryDate: actualDeliveryDate,
				RetailerID:         retailerID,
				RetailerName:       retailerName,
				RetailerAddress:    retailerAddress,
				RetailerMobile:     retailerMobile,
				TotalOrderAmount:   derefFloat(totalOrderAmount),
				DiscountAmount:     derefFloat(discountAmount),
				TaxAmount:          derefFloat(taxAmount),
				FinalAmount:        derefFloat(finalAmount),
			}
		}

		products = append(products, ProductDetail{
			OrderItemID:   orderItemID,
			ProductID:     productID,
			ProductName:   productName,
			CategoryID:    categoryID,
			CategoryName:  categoryName,
			Quantity:      derefFloat(quantity),
			UnitID:        unitID,
			UnitName:      unitName,
			MaxPrice:      derefFloat(maxItemPrice),
			BranchID:      branchID,
			BranchName:    branchName,
			BranchAddress: branchAddress,
			BranchNumber:  branchNumber,
		})
	}

	if response == nil {
		return c.Status(http.StatusNotFound).JSON(OrderResponse{
			Status:  "error",
			Message: "Order not found or access denied",
		})
	}

	response.Products = products
	return c.JSON(response)
}

// GetAllCompletedOrderItemHandler retrieves all completed order items
func GetAllCompletedOrderItemHandler(c *fiber.Ctx) error {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": "Unauthorized",
		})
	}

	query := `SELECT * FROM business_schema.get_completed_order_details($1);`
	rows, err := db.Pool.Query(context.Background(), query, userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}
	defer rows.Close()

	orderMap := make(map[int64]*OrderItemDetails)

	for rows.Next() {
		var (
			orderID            int64
			retailerID         int
			retailerName       string
			retailerAddress    string
			retailerMobile     string
			actualDeliveryDate *time.Time
			orderStatusID      int
			orderStatus        string
			totalAmount        float64
			createdAt          time.Time

			item OrderItemData
		)

		if err := rows.Scan(
			&orderID,
			&retailerID,
			&retailerName,
			&retailerAddress,
			&retailerMobile,
			&actualDeliveryDate,
			&orderStatusID,
			&orderStatus,
			&totalAmount,
			&createdAt,
			&item.OrderItemID,
			&item.ProductID,
			&item.ProductName,
			&item.Quantity,
			&item.UnitID,
			&item.UnitName,
			&item.MaxItemPrice,
		); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": err.Error(),
			})
		}

		if existing, ok := orderMap[orderID]; ok {
			existing.OrderItems = append(existing.OrderItems, item)
		} else {
			orderMap[orderID] = &OrderItemDetails{
				OrderID:            orderID,
				RetailerID:         retailerID,
				RetailerName:       retailerName,
				RetailerAddress:    retailerAddress,
				RetailerMobile:     retailerMobile,
				ActualDeliveryDate: formatDate(actualDeliveryDate),
				OrderStatusID:      orderStatusID,
				OrderStatus:        orderStatus,
				TotalOrderAmount:   totalAmount,
				CreatedAt:          createdAt.Format(time.RFC3339),
				OrderItems:         []OrderItemData{item},
			}
		}
	}

	var response []OrderItemDetails
	for _, v := range orderMap {
		response = append(response, *v)
	}

	return c.JSON(response)
}

// Helper function to get wholeseller IDs for an order
func getWholesellerIDs(orderID int64) ([]int, error) {
	var wholesellerIDs []int
	query := `
		SELECT wholeseller_id
		FROM business_schema.order_wholeseller_mapping
		WHERE order_id = $1 AND status = 1`

	rows, err := db.Pool.Query(context.Background(), query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		wholesellerIDs = append(wholesellerIDs, id)
	}

	return wholesellerIDs, rows.Err()
}

// Helper function to get products for an order
func getOrderProducts(orderID int64) ([]ProductDetail, error) {
	var products []ProductDetail
	// Inline sql fixed
	rows, err := db.Pool.Query(context.Background(),
		`SELECT * FROM business_schema.get_order_products($1)`,
		orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var p ProductDetail
		if err := rows.Scan(
			&p.ProductID, &p.ProductName, &p.CategoryID, &p.CategoryName,
			&p.Quantity, &p.UnitID, &p.UnitName, &p.MaxPrice,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, rows.Err()
}

// Helper function to safely dereference float pointers
func derefFloat(val *float64) float64 {
	if val != nil {
		return *val
	}
	return 0.0
}

func derefInt(val *int) int {
	if val != nil {
		return *val
	}
	return 0
}

// GetRetailerOrderDetailsHandler returns confirmed order details for the retailer who placed it
func GetRetailerOrderDetailsHandler(c *fiber.Ctx) error {
	retailerUserID, err := utils.GetUserIDFromContext(c)
	if err != nil || retailerUserID == -1 {
		return c.Status(fiber.StatusUnauthorized).JSON(OrderResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
	}

	var retailerBusinessID int64
	err = db.Pool.QueryRow(
		context.Background(),
		`SELECT admin_schema.get_business_id_by_user($1)`,
		retailerUserID,
	).Scan(&retailerBusinessID)
	if err != nil {
		return c.Status(500).JSON(OrderResponse{
			Status:  "error",
			Message: "Retailer business not found",
		})
	}

	orderID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(OrderResponse{
			Status:  "error",
			Message: "Invalid order ID",
		})
	}

	var (
		resp      RetailerOrderResponse
		itemsJSON []byte
	)

	err = db.Pool.QueryRow(
		context.Background(),
		`SELECT * FROM business_schema.get_retailer_order_details($1,$2)`,
		orderID,
		retailerBusinessID,
	).Scan(
		&resp.OrderID,
		&resp.DateOfOrder,
		&resp.OrderStatus,
		&resp.OrderStatusName,
		&resp.ActualDeliveryDate,
		&resp.RetailerID,
		&resp.WholesellerIDs,
		&resp.DeliveryAddress,
		&resp.TotalOrderAmount,
		&resp.DiscountAmount,
		&resp.TaxAmount,
		&resp.FinalAmount,
		&itemsJSON,
	)

	if err != nil {
		log.Println("Query failed:", err)
		return c.Status(404).JSON(OrderResponse{
			Status:  "error",
			Message: "Order not found or access denied",
		})
	}

	if err := json.Unmarshal(itemsJSON, &resp.Items); err != nil {
		log.Println("JSON unmarshal failed:", err)
		return c.Status(500).JSON(OrderResponse{
			Status:  "error",
			Message: "Failed to parse order items",
		})
	}

	return c.JSON(resp)
}
func formatDate(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}
