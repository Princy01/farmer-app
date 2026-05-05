package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch full business list for admin view
func (r *AdminRepository) GetAllBusinesses() ([]models.BusinessListItem, error) {
	rows, err := db.Pool.Query(context.Background(),
		`SELECT * FROM admin_schema.get_all_businesses_detailed()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.BusinessListItem
	for rows.Next() {
		var b models.BusinessListItem
		if err := rows.Scan(
			&b.BusinessID,
			&b.RegistrationNumber,
			&b.OwnerName,
			&b.BusinessType,
			&b.BusinessCategory,
			&b.Email,
			&b.MobileNumber,
			&b.State,
			&b.City,
			&b.Address,
			&b.IsActive,
			&b.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, b)
	}
	return list, nil
}

// Enable or disable a business account
func (r *AdminRepository) ToggleBusinessStatus(businessID int64) error {
	_, err := db.Pool.Exec(
		context.Background(),
		`SELECT admin_schema.toggle_business_status($1)`,
		businessID,
	)
	return err
}
