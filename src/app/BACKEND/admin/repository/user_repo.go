package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch all users for admin panel
func (r *AdminRepository) GetAllUsers() ([]models.UserListItem, error) {
	// Call DB function that returns all users
	rows, err := db.Pool.Query(context.Background(), `SELECT * FROM admin_schema.get_all_users_admin()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.UserListItem
	for rows.Next() {
		var u models.UserListItem
		if err := rows.Scan(
			&u.UserID,
			&u.Name,
			&u.Email,
			&u.MobileNum,
			&u.RoleID,
			&u.IsActive,
		); err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, nil
}

// Enable or disable a user account
func (r *AdminRepository) ToggleUserStatus(userID int) error {
	// Call DB function to flip user active status
	_, err := db.Pool.Exec(
		context.Background(),
		`SELECT admin_schema.toggle_user_status($1)`,
		userID,
	)
	return err
}
