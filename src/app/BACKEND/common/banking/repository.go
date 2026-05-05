package banking

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

// PaymentRepository manages payment orders in memory
type PaymentRepository struct {
	orders        map[string]*PaymentOrder // key: order_id
	ordersByPayID map[string]*PaymentOrder // key: payment_id
	userOrders    map[int][]string         // key: user_id, value: []order_id
	history       map[string][]PaymentOrderHistory
	mu            sync.RWMutex
	idCounter     int
}

func NewPaymentRepository() *PaymentRepository {
	return &PaymentRepository{
		orders:        make(map[string]*PaymentOrder),
		ordersByPayID: make(map[string]*PaymentOrder),
		userOrders:    make(map[int][]string),
		history:       make(map[string][]PaymentOrderHistory),
		idCounter:     1,
	}
}

// CreateOrder creates a new payment order
func (r *PaymentRepository) CreateOrder(order *PaymentOrder) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.orders[order.OrderID]; exists {
		return errors.New("order already exists")
	}

	now := time.Now()
	order.ID = r.idCounter
	r.idCounter++
	order.CreatedAt = now
	order.UpdatedAt = now

	r.orders[order.OrderID] = order
	r.userOrders[order.UserID] = append(r.userOrders[order.UserID], order.OrderID)

	return nil
}

// UpdateOrderWithPaymentID updates order when payment is initiated at gateway
func (r *PaymentRepository) UpdateOrderWithPaymentID(orderID, paymentID, checksum string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[orderID]
	if !exists {
		return errors.New("order not found")
	}

	order.PaymentID = &paymentID
	order.GatewayChecksum = &checksum
	order.Status = PaymentStatusInitiated
	order.UpdatedAt = time.Now()

	r.ordersByPayID[paymentID] = order

	return nil
}

// UpdateOrderFromCallback updates order based on gateway callback
func (r *PaymentRepository) UpdateOrderFromCallback(callback *PaymentCallback) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[callback.OrderID]
	if !exists {
		return errors.New("order not found")
	}

	oldStatus := order.Status

	// Determine new status
	newStatus := PaymentStatusFailed
	var paidAt *time.Time
	if callback.Status == "success" {
		newStatus = PaymentStatusSuccess
		now := time.Now()
		paidAt = &now
	}

	// Prepare gateway response
	gatewayResponse := JSONMap{
		"payment_id":     callback.PaymentID,
		"transaction_id": callback.TransactionID,
		"status":         callback.Status,
		"gateway_id":     callback.GatewayID,
		"timestamp":      callback.Timestamp,
		"checksum":       callback.Checksum,
	}

	// Update order
	order.TransactionID = callback.TransactionID
	order.Status = newStatus
	order.GatewayResponse = gatewayResponse
	order.PaidAt = paidAt
	order.UpdatedAt = time.Now()

	// Add history record
	historyEntry := PaymentOrderHistory{
		ID:        len(r.history[callback.OrderID]) + 1,
		OrderID:   callback.OrderID,
		OldStatus: &oldStatus,
		NewStatus: newStatus,
		ChangedAt: time.Now(),
	}
	remarks := fmt.Sprintf("Gateway callback received - Status: %s", callback.Status)
	historyEntry.Remarks = &remarks

	r.history[callback.OrderID] = append(r.history[callback.OrderID], historyEntry)

	return nil
}

// GetOrderByOrderID retrieves order by order ID
func (r *PaymentRepository) GetOrderByOrderID(orderID string) (*PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	order, exists := r.orders[orderID]
	if !exists {
		return nil, errors.New("order not found")
	}

	// Return a copy to prevent external modifications
	orderCopy := *order
	return &orderCopy, nil
}

// GetOrderByPaymentID retrieves order by gateway payment ID
func (r *PaymentRepository) GetOrderByPaymentID(paymentID string) (*PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	order, exists := r.ordersByPayID[paymentID]
	if !exists {
		return nil, errors.New("order not found")
	}

	orderCopy := *order
	return &orderCopy, nil
}

// GetUserOrders retrieves all orders for a user with pagination
func (r *PaymentRepository) GetUserOrders(userID int, limit, offset int) ([]PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orderIDs, exists := r.userOrders[userID]
	if !exists || len(orderIDs) == 0 {
		return []PaymentOrder{}, nil
	}

	// Get all orders for user
	allOrders := make([]PaymentOrder, 0, len(orderIDs))
	for _, orderID := range orderIDs {
		if order, exists := r.orders[orderID]; exists {
			allOrders = append(allOrders, *order)
		}
	}

	// Sort by created_at DESC (newest first)
	for i := 0; i < len(allOrders)-1; i++ {
		for j := i + 1; j < len(allOrders); j++ {
			if allOrders[i].CreatedAt.Before(allOrders[j].CreatedAt) {
				allOrders[i], allOrders[j] = allOrders[j], allOrders[i]
			}
		}
	}

	// Apply pagination
	start := offset
	if start >= len(allOrders) {
		return []PaymentOrder{}, nil
	}

	end := start + limit
	if end > len(allOrders) {
		end = len(allOrders)
	}

	return allOrders[start:end], nil
}

// GetOrderHistory retrieves status change history for an order
func (r *PaymentRepository) GetOrderHistory(orderID string) ([]PaymentOrderHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	history, exists := r.history[orderID]
	if !exists {
		return []PaymentOrderHistory{}, nil
	}

	// Return copy
	historyCopy := make([]PaymentOrderHistory, len(history))
	copy(historyCopy, history)

	return historyCopy, nil
}

// UpdateOrderStatus manually updates order status (for cancellation, etc.)
func (r *PaymentRepository) UpdateOrderStatus(orderID, newStatus, remarks string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[orderID]
	if !exists {
		return errors.New("order not found")
	}

	oldStatus := order.Status
	order.Status = newStatus
	order.UpdatedAt = time.Now()

	// Add history
	historyEntry := PaymentOrderHistory{
		ID:        len(r.history[orderID]) + 1,
		OrderID:   orderID,
		OldStatus: &oldStatus,
		NewStatus: newStatus,
		ChangedAt: time.Now(),
	}
	if remarks != "" {
		historyEntry.Remarks = &remarks
	}

	r.history[orderID] = append(r.history[orderID], historyEntry)

	return nil
}

// GetAllOrders returns all orders (for testing/debugging)
func (r *PaymentRepository) GetAllOrders() []PaymentOrder {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orders := make([]PaymentOrder, 0, len(r.orders))
	for _, order := range r.orders {
		orders = append(orders, *order)
	}

	return orders
}

// ClearAll clears all data (for testing)
func (r *PaymentRepository) ClearAll() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.orders = make(map[string]*PaymentOrder)
	r.ordersByPayID = make(map[string]*PaymentOrder)
	r.userOrders = make(map[int][]string)
	r.history = make(map[string][]PaymentOrderHistory)
	r.idCounter = 1
}
