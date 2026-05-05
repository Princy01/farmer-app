package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch all escrows for admin view
func (r *AdminRepository) ListEscrows() ([]models.Escrow, error) {
	// Call DB function that returns escrow records
	rows, err := db.Pool.Query(context.Background(), `SELECT * FROM admin_schema.list_escrows()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Escrow
	for rows.Next() {
		var e models.Escrow
		if err := rows.Scan(
			&e.EscrowID,
			&e.OrderID,
			&e.InvoiceID,
			&e.TotalAmount,
			&e.HeldAmount,
			&e.Status,
			&e.CreatedAt,
			&e.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

// Change escrow status (hold / released / disputed)
func (r *AdminRepository) UpdateEscrowStatus(escrowID int64, status string) error {
	// Call DB function to update status
	_, err := db.Pool.Exec(
		context.Background(),
		`SELECT admin_schema.update_escrow_status($1,$2)`,
		escrowID, status,
	)
	return err
}

// Get count of escrows grouped by status
func (r *AdminRepository) GetEscrowStatusSummary() ([]models.EscrowStatusReport, error) {
	// Call DB function for status summary
	rows, err := db.Pool.Query(context.Background(), `SELECT * FROM admin_schema.get_escrow_status_summary()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.EscrowStatusReport
	for rows.Next() {
		var r models.EscrowStatusReport
		if err := rows.Scan(&r.Status, &r.Count); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

// Fetch escrows held longer than given days
func (r *AdminRepository) GetEscrowsHeldMoreThan(days int) ([]models.EscrowAgingReport, error) {
	// Call DB function with days
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_escrows_held_more_than($1)`,
		days,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.EscrowAgingReport
	for rows.Next() {
		var r models.EscrowAgingReport
		if err := rows.Scan(
			&r.EscrowID,
			&r.OrderID,
			&r.Amount,
			&r.DaysHeld,
		); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}
