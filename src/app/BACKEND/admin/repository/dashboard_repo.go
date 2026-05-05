package repository

import (
	"context"
	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Repository for admin-related DB calls
type AdminRepository struct{}

// Fetch overall admin dashboard numbers
func (r *AdminRepository) GetDashboardSummary() (*models.DashboardSummary, error) {
	row := db.Pool.QueryRow(
		context.Background(),
		`SELECT * FROM admin_schema.get_dashboard_summary()`,
	)

	var d models.DashboardSummary
	err := row.Scan(
		&d.TotalBusinesses,
		&d.TotalBranches,
		&d.ActiveBranches,
		&d.TotalOrders,
		&d.PendingOrders,
		&d.TotalTransportJobs,
		&d.OpenTransportJobs,
		&d.TotalRevenue,
		&d.MonthlyRevenue,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}
