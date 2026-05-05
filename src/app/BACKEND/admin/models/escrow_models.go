package models

import "time"

type Escrow struct {
	EscrowID    int64     `json:"escrow_id"`
	OrderID     int64     `json:"order_id"`
	InvoiceID   *int64    `json:"invoice_id"`
	TotalAmount string    `json:"total_amount"`
	HeldAmount  string    `json:"held_amount"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type EscrowStatusReport struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type EscrowAgingReport struct {
	EscrowID int64  `json:"escrow_id"`
	OrderID  int64  `json:"order_id"`
	Amount   string `json:"amount"`
	DaysHeld int64  `json:"days_held"`
}
