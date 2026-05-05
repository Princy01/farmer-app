package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Create a new dispute entry
func (r *AdminRepository) CreateDispute(d *models.Dispute) (int64, error) {
	var id int64
	// Call DB function to insert dispute and return ID
	err := db.Pool.QueryRow(
		context.Background(),
		`SELECT admin_schema.create_dispute($1,$2,$3,$4,$5,$6,$7)`,
		d.OrderID,
		d.BusinessID,
		d.BranchID,
		d.RaisedByUserID,
		d.RaisedByRole,
		d.DisputeType,
		d.Description,
	).Scan(&id)
	return id, err
}

// Fetch disputes filtered by status
func (r *AdminRepository) ListDisputes(status *string) ([]models.Dispute, error) {
	rows, err := db.Pool.Query(
		context.Background(),
		// Call DB function with optional status filter
		`SELECT * FROM admin_schema.list_disputes($1)`,
		status,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Dispute
	for rows.Next() {
		var d models.Dispute
		if err := rows.Scan(
			&d.DisputeID,
			&d.OrderID,
			&d.BusinessID,
			&d.BranchID,
			&d.RaisedByUserID,
			&d.RaisedByRole,
			&d.DisputeType,
			&d.Description,
			&d.Status,
			&d.Priority,
			&d.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, d)
	}
	return list, nil
}

// Add an action or update to a dispute
func (r *AdminRepository) AddDisputeAction(
	disputeID int64,
	userID int,
	roleID int,
	action string,
	status string,
	remarks string,
) error {
	// Call DB function to log dispute action
	_, err := db.Pool.Exec(
		context.Background(),
		`SELECT admin_schema.add_dispute_action($1,$2,$3,$4,$5,$6)`,
		disputeID,
		userID,
		roleID,
		action,
		status,
		remarks,
	)
	return err
}
