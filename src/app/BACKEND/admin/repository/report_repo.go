package repository

import (
	"context"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
)

// Fetch daily order count between two dates
func (r *AdminRepository) GetDailyTransactions(from, to string) ([]models.TransactionReport, error) {
	// Call DB function for daily transactions
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_daily_transactions($1, $2)`,
		from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.TransactionReport
	for rows.Next() {
		var rec models.TransactionReport
		if err := rows.Scan(&rec.Date, &rec.OrderCount); err != nil {
			return nil, err
		}
		result = append(result, rec)
	}
	return result, nil
}

// Fetch daily revenue between two dates
func (r *AdminRepository) GetDailyRevenue(from, to string) ([]models.RevenueReport, error) {
	// Call DB function for revenue report
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_daily_revenue($1, $2)`,
		from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.RevenueReport
	for rows.Next() {
		var rec models.RevenueReport
		if err := rows.Scan(&rec.Date, &rec.Revenue); err != nil {
			return nil, err
		}
		result = append(result, rec)
	}
	return result, nil
}

// Fetch daily dispute count between two dates
func (r *AdminRepository) GetDailyDisputes(from, to string) ([]models.DisputeReport, error) {
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_daily_disputes($1, $2)`,
		from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.DisputeReport
	for rows.Next() {
		var rec models.DisputeReport
		if err := rows.Scan(&rec.Date, &rec.DisputeCount); err != nil {
			return nil, err
		}
		result = append(result, rec)
	}
	return result, nil
}

// Fetch orders stuck beyond given days
func (r *AdminRepository) GetStuckOrders(days int) ([]models.StuckOrderReport, error) {
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_stuck_orders($1)`,
		days,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.StuckOrderReport
	for rows.Next() {
		var rec models.StuckOrderReport
		if err := rows.Scan(
			&rec.OrderID,
			&rec.OrderStatus,
			&rec.DaysStuck,
			&rec.RetailerID,
		); err != nil {
			return nil, err
		}
		result = append(result, rec)
	}
	return result, nil
}

// Fetch businesses with highest dispute count
func (r *AdminRepository) GetTopDisputedBusinesses(from, to string) ([]models.TopDisputedBusiness, error) {

	result := make([]models.TopDisputedBusiness, 0)
	// Call DB function for top disputed businesses
	rows, err := db.Pool.Query(
		context.Background(),
		`SELECT * FROM admin_schema.get_top_disputed_businesses($1::date, $2::date)`,
		from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rec models.TopDisputedBusiness
		if err := rows.Scan(&rec.BusinessID, &rec.DisputeCount); err != nil {
			return nil, err
		}
		result = append(result, rec)
	}

	return result, nil
}
