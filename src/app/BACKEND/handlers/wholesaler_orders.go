package handlers

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/common/utils"

	"github.com/gofiber/fiber/v2"
)

type WholesalerOrderSummary struct {
	OrderID            int64      `json:"order_id"`
	DateOfOrder        time.Time  `json:"date_of_order"`
	OrderStatusID      *int32     `json:"order_status_id,omitempty"`
	OrderStatus        *string    `json:"order_status,omitempty"`
	RetailerID         int32      `json:"retailer_id"`
	RetailerName       string     `json:"retailer_name"`
	TotalItems         int64      `json:"total_items"`
	TotalQuantity      float64    `json:"total_quantity"`
	TotalOrderAmount   float64    `json:"total_order_amount"`
	FinalAmount        float64    `json:"final_amount"`
	DeliveryAddress    string     `json:"delivery_address"`
	ActualDeliveryDate *time.Time `json:"actual_delivery_date,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type WholesalerOrderItem struct {
	OrderItemID      int64   `json:"order_item_id"`
	ProductID        int64   `json:"product_id"`
	ProductName      string  `json:"product_name"`
	CategoryID       int     `json:"category_id"`
	CategoryName     string  `json:"category_name"`
	Quantity         float64 `json:"quantity"`
	UnitID           int     `json:"unit_id"`
	WholesellerPrice float64 `json:"wholeseller_price"`
	MaxItemPrice     float64 `json:"max_item_price"`
	DiscountAmount   float64 `json:"discount_amount"`
	TaxAmount        float64 `json:"tax_amount"`
	AgreedQuantity   float64 `json:"agreed_quantity"`
	ImagePath        *string `json:"image_path,omitempty"`
}

type WholesalerOrderDetails struct {
	OrderID            int64                 `json:"order_id"`
	DateOfOrder        time.Time             `json:"date_of_order"`
	OrderStatusID      *int32                `json:"order_status_id,omitempty"`
	OrderStatus        *string               `json:"order_status,omitempty"`
	RetailerID         int32                 `json:"retailer_id"`
	RetailerName       string                `json:"retailer_name"`
	TotalOrderAmount   float64               `json:"total_order_amount"`
	FinalAmount        float64               `json:"final_amount"`
	DeliveryAddress    string                `json:"delivery_address"`
	ActualDeliveryDate *time.Time            `json:"actual_delivery_date,omitempty"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          time.Time             `json:"updated_at"`
	Items              []WholesalerOrderItem `json:"items"`
}

type OrderHistoryRow struct {
	HistoryID          int64     `json:"history_id"`
	OrderStatusID      int32     `json:"order_status_id"`
	OrderStatus        string    `json:"order_status"`
	Command            string    `json:"command"`
	At                 time.Time `json:"at"`
	UserID             int32     `json:"user_id"`
	CancellationReason *string   `json:"cancellation_reason,omitempty"`
}

type OrderStatus struct {
	OrderStatusID int    `json:"order_status_id"`
	OrderStatus   string `json:"order_status"`
}

// GET /GetWholesalerOrders?status=1,2,3
func GetWholesalerOrdersHandler(c *fiber.Ctx) error {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil || userID == -1 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": "Unauthorized",
		})
	}

	var statusIDs []int
	if raw := c.Query("status"); raw != "" {
		parts := strings.Split(raw, ",")
		for _, p := range parts {
			id, err := strconv.Atoi(strings.TrimSpace(p))
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"status":  "error",
					"message": "Invalid status parameter",
				})
			}
			statusIDs = append(statusIDs, id)
		}
	}

	query := `SELECT * FROM business_schema.get_wholesaler_orders($1, $2);`

	rows, err := db.Pool.Query(context.Background(), query, userID, statusIDs)
	if err != nil {
		log.Println("Failed to fetch wholesaler orders:", err)
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch orders",
		})
	}
	defer rows.Close()

	var orders []WholesalerOrderSummary

	for rows.Next() {
		var o WholesalerOrderSummary
		var orderStatusID *int32
		var orderStatus *string
		err := rows.Scan(
			&o.OrderID,
			&o.DateOfOrder,
			&orderStatusID,
			&orderStatus,
			&o.RetailerID,
			&o.RetailerName,
			&o.TotalItems,
			&o.TotalQuantity,
			&o.TotalOrderAmount,
			&o.FinalAmount,
			&o.DeliveryAddress,
			&o.ActualDeliveryDate,
			&o.CreatedAt,
			&o.UpdatedAt,
		)
		if err != nil {
			log.Println("Scan error:", err)
			return c.Status(500).JSON(fiber.Map{
				"status":  "error",
				"message": "Failed to parse orders",
			})
		}
		o.OrderStatusID = orderStatusID
		o.OrderStatus = orderStatus
		orders = append(orders, o)
	}

	if orders == nil {
		orders = []WholesalerOrderSummary{}
	}

	return c.JSON(orders)
}

// GET /wholesaler/orders/:id
func GetWholesalerOrderDetailsHandler(c *fiber.Ctx) error {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil || userID == -1 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": "Unauthorized",
		})
	}

	orderID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid order ID",
		})
	}

	query := `SELECT * FROM business_schema.get_wholesaler_order_details($1, $2);`

	var (
		resp      WholesalerOrderDetails
		itemsJSON []byte
		orderStatusID *int32
		orderStatus *string
	)

	err = db.Pool.QueryRow(context.Background(), query, userID, orderID).Scan(
		&resp.OrderID,
		&resp.DateOfOrder,
		&orderStatusID,
		&orderStatus,
		&resp.RetailerID,
		&resp.RetailerName,
		&resp.TotalOrderAmount,
		&resp.FinalAmount,
		&resp.DeliveryAddress,
		&resp.ActualDeliveryDate,
		&resp.CreatedAt,
		&resp.UpdatedAt,
		&itemsJSON,
	)
	if err != nil {
		log.Println("Failed to fetch order details:", err)
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "Order not found or access denied",
		})
	}
	resp.OrderStatusID = orderStatusID
	resp.OrderStatus = orderStatus

	if err := json.Unmarshal(itemsJSON, &resp.Items); err != nil {
		log.Println("Failed to unmarshal items:", err)
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to parse order items",
		})
	}

	return c.JSON(resp)
}

// GET /wholesaler/orders/:id/history
func GetWholesalerOrderHistoryHandler(c *fiber.Ctx) error {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil || userID == -1 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": "Unauthorized",
		})
	}

	orderID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid order ID",
		})
	}

	query := `SELECT * FROM business_schema.get_order_history($1, $2);`

	rows, err := db.Pool.Query(context.Background(), query, userID, orderID)
	if err != nil {
		log.Println("Failed to fetch order history:", err)
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch order history",
		})
	}
	defer rows.Close()

	var history []OrderHistoryRow

	for rows.Next() {
		var h OrderHistoryRow
		err := rows.Scan(
			&h.HistoryID,
			&h.OrderStatusID,
			&h.OrderStatus,
			&h.Command,
			&h.At,
			&h.UserID,
			&h.CancellationReason,
		)
		if err != nil {
			log.Println("History scan error:", err)
			return c.Status(500).JSON(fiber.Map{
				"status":  "error",
				"message": "Failed to parse history",
			})
		}
		history = append(history, h)
	}

	if history == nil {
		history = []OrderHistoryRow{}
	}

	return c.JSON(history)
}

// GET /wholesaler/order-statuses
func GetOrderStatusesHandler(c *fiber.Ctx) error {
	rows, err := db.Pool.Query(context.Background(),
		`SELECT * FROM admin_schema.get_order_statuses();`)
	if err != nil {
		log.Println("Failed to fetch statuses:", err)
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch order statuses",
		})
	}
	defer rows.Close()

	var statuses []OrderStatus

	for rows.Next() {
		var s OrderStatus
		if err := rows.Scan(&s.OrderStatusID, &s.OrderStatus); err != nil {
			log.Println("Status scan error:", err)
			return c.Status(500).JSON(fiber.Map{
				"status":  "error",
				"message": "Failed to parse statuses",
			})
		}
		statuses = append(statuses, s)
	}

	if statuses == nil {
		statuses = []OrderStatus{}
	}

	return c.JSON(statuses)
}
