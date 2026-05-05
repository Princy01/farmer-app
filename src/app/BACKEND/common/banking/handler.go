package banking

import (
	"farmerapp/internal/common/utils"
	"log"

	"github.com/gofiber/fiber/v2"
)

type PaymentHandler struct {
	service *PaymentService
}

func NewPaymentHandler(service *PaymentService) *PaymentHandler {
	return &PaymentHandler{
		service: service,
	}
}

// InitiatePayment creates order and initiates payment
func (h *PaymentHandler) InitiatePayment(c *fiber.Ctx) error {
	// Get user ID from context (set by your auth middleware)
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	var req CreatePaymentOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	req.UserID = userID

	response, err := h.service.InitiatePayment(req)
	if err != nil {
		log.Printf("Payment initiation failed: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Payment initiated successfully",
		"data":    response,
	})
}

// HandleCallback processes payment callback from gateway
func (h *PaymentHandler) HandleCallback(c *fiber.Ctx) error {
	rawBody := append([]byte(nil), c.Body()...)
	var callback PaymentCallback
	if err := c.BodyParser(&callback); err != nil {
		log.Printf("Invalid callback payload: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid callback format",
		})
	}
	callback.RawBody = rawBody

	paymentID := ""
	if callback.PaymentID != nil {
		paymentID = *callback.PaymentID
	}
	log.Printf("Received payment callback: OrderID=%s, Status=%s, PaymentID=%s",
		callback.OrderID, callback.Status, paymentID)

	if err := h.service.HandleCallback(&callback); err != nil {
		log.Printf("Callback processing failed: %v", err)
		// Still return 200 to gateway to avoid retries
		return c.JSON(fiber.Map{
			"status":  "ACKNOWLEDGED",
			"message": "Callback received but processing failed",
			"error":   err.Error(),
		})
	}

	// Success response
	return c.JSON(fiber.Map{
		"status":  "SUCCESS",
		"message": "Callback processed successfully",
		"data": fiber.Map{
			"order_id":   callback.OrderID,
			"payment_id": callback.PaymentID,
		},
	})
}

// HandleReturn handles user redirect from gateway after payment
func (h *PaymentHandler) HandleReturn(c *fiber.Ctx) error {
	// Get payment details from query params
	paymentID := c.Query("payment_id")
	orderID := c.Query("order_id")
	status := c.Query("status")

	if orderID == "" {
		// Redirect to error page
		return c.Redirect("/payment/error?message=Invalid+payment+details", fiber.StatusSeeOther)
	}

	log.Printf("User returned from gateway: OrderID=%s, Status=%s, PaymentID=%s",
		orderID, status, paymentID)

	// Get order details
	orderStatus, err := h.service.GetOrderStatus(orderID)
	if err != nil {
		return c.Redirect("/payment/error?message=Order+not+found", fiber.StatusSeeOther)
	}

	// Redirect to appropriate page based on status
	switch orderStatus.Status {
	case PaymentStatusSuccess:
		return c.Redirect("/payment/success?order_id="+orderID, fiber.StatusSeeOther)
	case PaymentStatusFailed:
		return c.Redirect("/payment/failed?order_id="+orderID, fiber.StatusSeeOther)
	case PaymentStatusPending, PaymentStatusInitiated, PaymentStatusProcessing:
		return c.Redirect("/payment/processing?order_id="+orderID, fiber.StatusSeeOther)
	default:
		return c.Redirect("/payment/error?message=Unknown+status", fiber.StatusSeeOther)
	}
}

// GetPaymentStatus retrieves payment status
func (h *PaymentHandler) GetPaymentStatus(c *fiber.Ctx) error {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	orderID := c.Params("order_id")

	status, err := h.service.GetOrderStatus(orderID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Order not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    status,
	})
}

// GetUserOrders retrieves all orders for the authenticated user
func (h *PaymentHandler) GetUserOrders(c *fiber.Ctx) error {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	// Get pagination params
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	orders, err := h.service.GetUserOrders(userID, page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve orders",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"orders":    orders,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// CancelOrder cancels a pending order
func (h *PaymentHandler) CancelOrder(c *fiber.Ctx) error {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	orderID := c.Params("order_id")

	if err := h.service.CancelOrder(orderID, userID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Order cancelled successfully",
	})
}

// SyncPaymentStatus manually syncs payment status from gateway
func (h *PaymentHandler) SyncPaymentStatus(c *fiber.Ctx) error {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	orderID := c.Params("order_id")

	if err := h.service.SyncPaymentStatus(orderID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	// Get updated status
	status, _ := h.service.GetOrderStatus(orderID)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Status synced successfully",
		"data":    status,
	})
}

// Helper functions

func getUserIDFromContext(c *fiber.Ctx) int {
	user_id, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return 0
	}
	return user_id
}
