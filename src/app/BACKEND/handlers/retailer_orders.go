package handlers

import (
	"context"
	"database/sql"
	"farmerapp/go_backend/db"
	"farmerapp/internal/checkout"
	"farmerapp/internal/common/utils"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type RetailerOrderHistory struct {
	OrderID            int64      `json:"order_id"`
	DateOfOrder        time.Time  `json:"date_of_order"`
	OrderStatus        *int       `json:"order_status"`
	OrderStatusName    *string    `json:"order_status_name"`
	DeliveryAddress    string     `json:"delivery_address"`
	TotalOrderAmount   float64    `json:"total_order_amount"`
	DiscountAmount     float64    `json:"discount_amount"`
	TaxAmount          float64    `json:"tax_amount"`
	FinalAmount        float64    `json:"final_amount"`
	ActualDeliveryDate *time.Time `json:"actual_delivery_date,omitempty"`
}

type RetailerOrderHistoryResponse struct {
	CurrentOrders    []RetailerOrderHistory           `json:"current_orders"`
	OrderHistory     []RetailerOrderHistory           `json:"order_history"`
	CheckoutSessions []RetailerCheckoutSessionSummary `json:"checkout_sessions"`
}

func GetRetailerOrderHistory(c *fiber.Ctx) error {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil || userID == -1 {
		return c.Status(fiber.StatusUnauthorized).JSON(OrderResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
	}

	// Fetch retailer business ID
	var retailerBusinessID int64
	err = db.Pool.QueryRow(
		context.Background(),
		`SELECT bid FROM admin_schema.business_table WHERE user_id = $1`,
		userID,
	).Scan(&retailerBusinessID)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(OrderResponse{
			Status:  "error",
			Message: "Retailer business not found",
		})
	}
	if err != nil {
		log.Printf("DB error fetching business for user %d: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
			Status:  "error",
			Message: "Internal server error",
		})
	}

	// Query orders
	query := `
        SELECT
			o.order_id,
			o.date_of_order,
			o.order_status,
			s.order_status AS order_status_name,
			o.delivery_address,
			o.total_order_amount,
			o.discount_amount,
			o.tax_amount,
			o.final_amount,
			o.actual_delivery_date
		FROM business_schema.order_table o
		LEFT JOIN admin_schema.order_status_table s
			ON o.order_status = s.order_status_id
		WHERE o.retailer_id = $1
		ORDER BY o.order_status NULLS FIRST, o.date_of_order DESC;
    `

	// The actual query is (PRINTING IT BY REPLACING $1 WITH retailerBusinessID):
	fmt.Println("Order History Query:", query, "With retailerBusinessID =", retailerBusinessID)
	rows, err := db.Pool.Query(context.Background(), query, retailerBusinessID)
	if err != nil {
		log.Printf("Order history query failed for retailer %d: %v", retailerBusinessID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
			Status:  "error",
			Message: "Failed to fetch orders",
		})
	}
	defer rows.Close()

	var currentOrders []RetailerOrderHistory
	var orderHistory []RetailerOrderHistory

	for rows.Next() {
		var o RetailerOrderHistory
		var status sql.NullInt32
		var statusName sql.NullString

		err := rows.Scan(
			&o.OrderID,
			&o.DateOfOrder,
			&status,
			&statusName, // NEW
			&o.DeliveryAddress,
			&o.TotalOrderAmount,
			&o.DiscountAmount,
			&o.TaxAmount,
			&o.FinalAmount,
			&o.ActualDeliveryDate,
		)
		if err != nil {
			log.Printf("Scan failed: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
				Status:  "error",
				Message: "Data processing error",
			})
		}

		if status.Valid {
			v := int(status.Int32)
			o.OrderStatus = &v
		}

		if statusName.Valid {
			name := statusName.String
			o.OrderStatusName = &name
		}

		// Current orders should reflect only real, materialized order states.
		// Payment-incomplete states now belong to checkout sessions, not order_table rows.
		if status.Valid && isRetailerCurrentOrderStatus(status.Int32) {
			currentOrders = append(currentOrders, o)
		} else {
			orderHistory = append(orderHistory, o)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("Row iteration error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
			Status:  "error",
			Message: "Data processing error",
		})
	}

	checkoutSessions, err := listRetailerIncompleteCheckoutSessions(context.Background(), retailerBusinessID)
	if err != nil {
		log.Printf("Checkout session query failed for retailer %d: %v", retailerBusinessID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(OrderResponse{
			Status:  "error",
			Message: "Failed to fetch checkout sessions",
		})
	}

	return c.JSON(RetailerOrderHistoryResponse{
		CurrentOrders:    currentOrders,
		OrderHistory:     orderHistory,
		CheckoutSessions: checkoutSessions,
	})
}

func listRetailerIncompleteCheckoutSessions(ctx context.Context, retailerBusinessID int64) ([]RetailerCheckoutSessionSummary, error) {
	repository := checkout.NewRepository()
	if _, err := repository.ExpireStaleCheckoutSessions(
		ctx,
		nil,
		time.Now().Add(-checkoutPendingPaymentTimeout),
	); err != nil {
		log.Printf("Failed to expire stale checkout sessions for retailer %d: %v", retailerBusinessID, err)
	}

	sessions, err := repository.ListRetailerCheckoutSessionsByStatus(
		ctx,
		nil,
		retailerBusinessID,
		defaultIncompleteCheckoutStatuses,
		20,
	)
	if err != nil {
		return nil, err
	}

	summaries := make([]RetailerCheckoutSessionSummary, 0, len(sessions))
	for _, session := range sessions {
		summaries = append(summaries, buildRetailerCheckoutSessionSummary(session))
	}

	return summaries, nil
}
