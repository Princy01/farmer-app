package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch payment failure details for an order
func (r *AdminRepository) GetPaymentErrors(orderID int64) ([]models.PaymentError, error) {
	// Call DB function with order ID
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_payment_errors($1)`,
		orderID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.PaymentError
	for rows.Next() {
		var e models.PaymentError
		if err := rows.Scan(
			&e.ErrorID,
			&e.OrderID,
			&e.PaymentID,
			&e.Gateway,
			&e.ErrorCode,
			&e.ErrorMessage,
			&e.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}
