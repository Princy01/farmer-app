package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch branch list with optional business and branch filters
func (r *AdminRepository) GetBranches(businessID *int64, branchID *int) ([]models.BranchListItem, error) {
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_branches($1, $2)`,
		businessID, branchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.BranchListItem
	for rows.Next() {
		var b models.BranchListItem
		if err := rows.Scan(
			&b.BranchID,
			&b.BranchName,
			&b.BusinessID,
			&b.BusinessName,
			&b.BusinessType,
			&b.City,
			&b.State,
			&b.Email,
			&b.MobileNumber,
			&b.IsActive,
			&b.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, b)
	}
	return list, nil // Return all branches
}

// Enable or disable a branch
func (r *AdminRepository) ToggleBranchStatus(branchID int) error {
	_, err := db.Pool.Exec(
		context.Background(),
		`SELECT admin_schema.toggle_branch_status($1)`,
		branchID,
	)
	return err // Return DB error if any
}
