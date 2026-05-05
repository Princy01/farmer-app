package models

import "time"

type PaymentError struct {
	ErrorID      int64     `json:"error_id"`
	OrderID      int64     `json:"order_id"`
	PaymentID    *string   `json:"payment_id"`
	Gateway      *string   `json:"gateway"`
	ErrorCode    *string   `json:"error_code"`
	ErrorMessage *string   `json:"error_message"`
	CreatedAt    time.Time `json:"created_at"`
}
