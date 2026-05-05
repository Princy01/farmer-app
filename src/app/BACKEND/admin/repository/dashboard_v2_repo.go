package repository

import (
	"context"
	"fmt"
	"strings"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
	commonsla "farmerapp/internal/common/sla"
)

const largeOrderThreshold = 25000.0

var openDisputeStatuses = []string{
	"new",
	"triaged",
	"awaiting_evidence",
	"under_review",
	"pending_external_action",
	"pending_execution",
}

func (r *AdminRepository) GetControlTowerSummary() (*models.ControlTowerSummary, error) {
	base, err := r.GetDashboardSummary()
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`
		SELECT
			(SELECT COUNT(*) FROM admin_schema.user_table) AS total_users,
			(SELECT COUNT(*) FROM admin_schema.user_table WHERE active_status = 1) AS active_users,
			(SELECT COUNT(*)
			   FROM dispute_schema.dispute_cases dc
			  WHERE dc.status IN (%s)
			) AS open_disputes,
			(SELECT COUNT(*)
			   FROM dispute_schema.dispute_cases dc
			   LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
			  WHERE dc.status IN (%s)
			    AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < NOW()
			) AS overdue_disputes,
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(document_verification_status, 'verified') IN ('pending_review', 'rejected')
			     OR COALESCE(location_verification_status, 'pending_verification') IN ('pending_verification', 'manual_review', 'rejected')
			) AS pending_branch_verification,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(onboarding_verification_status, 'pending_documents') IN ('pending_documents', 'pending_review')
			) AS pending_driver_onboarding,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) = 1
			    AND (
					COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
				 OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
				)
			) AS pending_buyer_kyc,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) IN (2, 3)
			    AND COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
			) AS pending_wholesaler_license,
			(SELECT COUNT(*)
			   FROM business_schema.order_table
			  WHERE COALESCE(final_amount, total_order_amount, 0) > $%d
			) AS large_orders
	`,
		buildStatusPlaceholders(1, len(openDisputeStatuses)),
		buildStatusPlaceholders(1+len(openDisputeStatuses), len(openDisputeStatuses)),
		len(openDisputeStatuses)*2+1,
	)

	args := make([]interface{}, 0, len(openDisputeStatuses)*2+1)
	for _, status := range openDisputeStatuses {
		args = append(args, status)
	}
	for _, status := range openDisputeStatuses {
		args = append(args, status)
	}
	args = append(args, largeOrderThreshold)

	var summary models.ControlTowerSummary
	summary.DashboardSummary = *base
	summary.LargeOrderThreshold = largeOrderThreshold

	if err := db.Pool.QueryRow(context.Background(), query, args...).Scan(
		&summary.TotalUsers,
		&summary.ActiveUsers,
		&summary.OpenDisputes,
		&summary.OverdueDisputes,
		&summary.PendingBranchVerification,
		&summary.PendingDriverOnboarding,
		&summary.PendingBuyerKYC,
		&summary.PendingWholesalerLicense,
		&summary.LargeOrders,
	); err != nil {
		return nil, err
	}

	return &summary, nil
}

func (r *AdminRepository) GetOpsDashboardSummary(actorUserID int64, actorRoleID int) (*models.OpsDashboardSummary, error) {
	whereClause, args := buildOwnedCaseScope("ops_l1", actorUserID, actorRoleID)
	timerCfg := commonsla.CurrentDisputeTimingConfig()

	disputeQuery := fmt.Sprintf(`
		SELECT
			COUNT(*) FILTER (WHERE dc.status IN (%s)) AS total_open,
			COUNT(*) FILTER (WHERE dc.status = 'awaiting_evidence') AS awaiting_evidence,
			COUNT(*) FILTER (WHERE dc.status = 'under_review') AS under_review,
			COUNT(*) FILTER (WHERE dc.status = 'pending_external_action') AS pending_external_action,
			COUNT(*) FILTER (WHERE dc.status = 'pending_execution') AS pending_execution,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND dc.created_at <= NOW() - INTERVAL '%s'
			) AS overdue,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= date_trunc('day', NOW())
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < date_trunc('day', NOW()) + INTERVAL '1 day'
			) AS due_today,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND dc.created_at <= NOW() - INTERVAL '%s'
				  AND dc.created_at > NOW() - INTERVAL '%s'
			) AS due_soon,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND COALESCE(dt.first_response_breached, FALSE) = TRUE
			) AS first_response_breached,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND COALESCE(dt.resolution_breached, FALSE) = TRUE
			) AS resolution_breached
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
		WHERE %s
	`,
		buildStatusPlaceholders(len(args)+1, len(openDisputeStatuses)),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses), len(openDisputeStatuses)),
		timerCfg.AgeOverdueIntervalLiteral(),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*2, len(openDisputeStatuses)),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*3, len(openDisputeStatuses)),
		timerCfg.AgeDueSoonIntervalLiteral(),
		timerCfg.AgeOverdueIntervalLiteral(),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*4, len(openDisputeStatuses)),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*5, len(openDisputeStatuses)),
		whereClause,
	)

	disputeArgs := append([]interface{}{}, args...)
	for i := 0; i < 6; i++ {
		for _, status := range openDisputeStatuses {
			disputeArgs = append(disputeArgs, status)
		}
	}

	var summary models.OpsDashboardSummary
	if err := db.Pool.QueryRow(context.Background(), disputeQuery, disputeArgs...).Scan(
		&summary.TotalOpen,
		&summary.AwaitingEvidence,
		&summary.UnderReview,
		&summary.PendingExternalAction,
		&summary.PendingExecution,
		&summary.Overdue,
		&summary.DueToday,
		&summary.DueSoon,
		&summary.FirstResponseBreached,
		&summary.ResolutionBreached,
	); err != nil {
		return nil, err
	}

	onboardingQuery := `
		SELECT
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(document_verification_status, 'verified') IN ('pending_review', 'rejected')
			     OR COALESCE(location_verification_status, 'pending_verification') IN ('pending_verification', 'manual_review', 'rejected')
			) AS pending_branch_verification,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(onboarding_verification_status, 'pending_documents') IN ('pending_documents', 'pending_review')
			) AS pending_driver_onboarding,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) = 1
			    AND (
					COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
				 OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
				)
			) AS pending_buyer_kyc,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) IN (2, 3)
			    AND COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
			) AS pending_wholesaler_license
	`
	if err := db.Pool.QueryRow(context.Background(), onboardingQuery).Scan(
		&summary.PendingBranchVerification,
		&summary.PendingDriverOnboarding,
		&summary.PendingBuyerKYC,
		&summary.PendingWholesalerLicense,
	); err != nil {
		return nil, err
	}

	transportQuery := `
		SELECT
			COUNT(DISTINCT tj.job_id) FILTER (WHERE tj.status = 'open') AS ride_not_assigned,
			COUNT(DISTINCT tj.job_id) FILTER (
				WHERE tj.status = 'accepted'
				  AND ta.pickup_confirmed_at IS NULL
			) AS ride_not_taken,
			COUNT(DISTINCT tj.job_id) FILTER (
				WHERE tj.status = 'accepted'
				  AND ta.pickup_confirmed_at IS NULL
				  AND tj.requested_date IS NOT NULL
				  AND tj.requested_date < NOW()
			) AS pickup_delayed,
			COUNT(DISTINCT tj.job_id) FILTER (
				WHERE tj.status IN ('accepted', 'partially_picked', 'picked_up')
				  AND tj.delivery_date < NOW()
			) AS delivery_overdue
		FROM transport_schema.transport_jobs tj
		LEFT JOIN transport_schema.trip_assignments ta
		  ON ta.job_id = tj.job_id
		 AND ta.delivery_status IN ('pending', 'partially_picked', 'picked_up', 'disputed')
	`
	if err := db.Pool.QueryRow(context.Background(), transportQuery).Scan(
		&summary.RideNotAssigned,
		&summary.RideNotTaken,
		&summary.PickupDelayed,
		&summary.DeliveryOverdue,
	); err != nil {
		return nil, err
	}

	return &summary, nil
}

func (r *AdminRepository) GetFinanceDashboardSummary(actorUserID int64, actorRoleID int) (*models.FinanceDashboardSummary, error) {
	base, err := r.GetDashboardSummary()
	if err != nil {
		return nil, err
	}

	whereClause, args := buildOwnedCaseScope("finance", actorUserID, actorRoleID)
	timerCfg := commonsla.CurrentDisputeTimingConfig()

	query := fmt.Sprintf(`
		SELECT
			COUNT(*) FILTER (WHERE dc.status IN (%s)) AS total_open,
			COUNT(*) FILTER (WHERE dc.status = 'pending_execution') AS pending_execution,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND dc.created_at <= NOW() - INTERVAL '%s'
			) AS overdue,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= date_trunc('day', NOW())
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < date_trunc('day', NOW()) + INTERVAL '1 day'
			) AS due_today,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND dc.created_at <= NOW() - INTERVAL '%s'
				  AND dc.created_at > NOW() - INTERVAL '%s'
			) AS due_soon,
			COUNT(*) FILTER (
				WHERE dc.status IN (%s)
				  AND COALESCE(o.final_amount, o.total_order_amount, 0) > $%d
			) AS high_value_cases
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
		LEFT JOIN business_schema.order_table o ON o.order_id = dc.order_id
		WHERE %s
	`,
		buildStatusPlaceholders(len(args)+1, len(openDisputeStatuses)),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses), len(openDisputeStatuses)),
		timerCfg.AgeOverdueIntervalLiteral(),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*2, len(openDisputeStatuses)),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*3, len(openDisputeStatuses)),
		timerCfg.AgeDueSoonIntervalLiteral(),
		timerCfg.AgeOverdueIntervalLiteral(),
		buildStatusPlaceholders(len(args)+1+len(openDisputeStatuses)*4, len(openDisputeStatuses)),
		len(args)+1+len(openDisputeStatuses)*5,
		whereClause,
	)

	queryArgs := append([]interface{}{}, args...)
	for i := 0; i < 5; i++ {
		for _, status := range openDisputeStatuses {
			queryArgs = append(queryArgs, status)
		}
	}
	queryArgs = append(queryArgs, largeOrderThreshold)

	var summary models.FinanceDashboardSummary
	summary.TotalRevenue = base.TotalRevenue
	summary.MonthlyRevenue = base.MonthlyRevenue
	summary.LargeOrderThreshold = largeOrderThreshold

	if err := db.Pool.QueryRow(context.Background(), query, queryArgs...).Scan(
		&summary.TotalOpen,
		&summary.PendingExecution,
		&summary.Overdue,
		&summary.DueToday,
		&summary.DueSoon,
		&summary.HighValueCases,
	); err != nil {
		return nil, err
	}

	if err := db.Pool.QueryRow(context.Background(), `
		SELECT COUNT(*)
		FROM business_schema.order_table
		WHERE COALESCE(final_amount, total_order_amount, 0) > $1
	`, largeOrderThreshold).Scan(&summary.LargeOrders); err != nil {
		return nil, err
	}

	paymentSummary, err := r.GetPaymentWatchSummary()
	if err != nil {
		return nil, err
	}
	summary.PaymentFailures = paymentSummary.FailedOrders

	return &summary, nil
}

func buildOwnedCaseScope(targetRole string, actorUserID int64, actorRoleID int) (string, []interface{}) {
	where := []string{"dc.current_assignee_role = $1"}
	args := []interface{}{targetRole}

	if actorRoleID != 1 {
		where = append(where, "(dc.current_assignee_user_id IS NULL OR dc.current_assignee_user_id = $2)")
		args = append(args, actorUserID)
	}

	return strings.Join(where, " AND "), args
}

func buildStatusPlaceholders(startPos, count int) string {
	parts := make([]string, 0, count)
	for i := 0; i < count; i++ {
		parts = append(parts, fmt.Sprintf("$%d", startPos+i))
	}
	return strings.Join(parts, ", ")
}
