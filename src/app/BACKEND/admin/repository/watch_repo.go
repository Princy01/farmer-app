package repository

import (
	"context"
	"fmt"
	"strings"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"

	"github.com/lib/pq"
)

func (r *AdminRepository) GetOnboardingWatchSummary() (*models.OnboardingWatchSummary, error) {
	query := `
		SELECT
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(location_verification_status, 'pending_verification') = 'pending_verification'
			) AS pending_branch_verification,
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(document_verification_status, 'pending_review') = 'pending_review'
			) AS pending_branch_documents,
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(document_verification_status, 'pending_review') = 'rejected'
			) AS rejected_branch_documents,
			(SELECT COUNT(*)
			   FROM admin_schema.business_branch_table
			  WHERE COALESCE(location_verification_status, 'pending_verification') = 'manual_review'
			) AS manual_review_branches,
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
			  WHERE COALESCE(b.b_type_id, 0) = 1
			    AND (
					COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'rejected'
				 OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'rejected'
				)
			) AS rejected_buyer_kyc,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) IN (2, 3)
			    AND COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review')
			) AS pending_wholesaler_license,
			(SELECT COUNT(*)
			   FROM admin_schema.business_table b
			  WHERE COALESCE(b.b_type_id, 0) IN (2, 3)
			    AND COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'rejected'
			) AS rejected_wholesaler_license,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(document_verification_status, 'pending_documents') IN ('pending_documents', 'pending_review')
			) AS pending_driver_documents,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(physical_verification_status, 'pending_documents') = 'pending_review'
			) AS pending_driver_physical_verification,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(onboarding_verification_status, 'pending_documents') = 'pending_review'
			) AS pending_driver_review,
			(SELECT COUNT(*)
			   FROM transport_schema.driver_info
			  WHERE COALESCE(onboarding_verification_status, 'pending_documents') = 'rejected'
			) AS rejected_drivers
	`

	var summary models.OnboardingWatchSummary
	if err := db.Pool.QueryRow(context.Background(), query).Scan(
		&summary.PendingBranchVerification,
		&summary.PendingBranchDocuments,
		&summary.RejectedBranchDocuments,
		&summary.ManualReviewBranches,
		&summary.PendingBuyerKYC,
		&summary.RejectedBuyerKYC,
		&summary.PendingWholesalerLicense,
		&summary.RejectedWholesalerLicense,
		&summary.PendingDriverDocuments,
		&summary.PendingDriverPhysicalVerification,
		&summary.PendingDriverReview,
		&summary.RejectedDrivers,
	); err != nil {
		return nil, err
	}

	summary.TotalPending = summary.PendingBranchVerification +
		summary.PendingBranchDocuments +
		summary.ManualReviewBranches +
		summary.PendingBuyerKYC +
		summary.PendingWholesalerLicense +
		summary.PendingDriverDocuments +
		summary.PendingDriverPhysicalVerification +
		summary.PendingDriverReview

	return &summary, nil
}

func (r *AdminRepository) ListOnboardingWatchItems(page, pageSize int, watchType, status string) (*models.OnboardingWatchListResponse, error) {
	offset := (page - 1) * pageSize
	itemsCTE := `
		WITH items AS (
			SELECT
				'branch_document'::text AS watch_type,
				bb.b_branch_id::bigint AS entity_id,
				COALESCE(bb.b_shop_name, '') AS display_name,
				'Branch Documents'::text AS secondary_label,
				COALESCE(bb.b_number, '') AS contact_number,
				COALESCE(mc.city_name, '') AS city_name,
				COALESCE(ms.state_name, '') AS state_name,
				COALESCE(bb.document_verification_status, 'pending_review') AS status,
				''::text AS capture_source,
				bb.created_at,
				bb.updated_at
			FROM admin_schema.business_branch_table bb
			LEFT JOIN admin_schema.master_city mc ON mc.id = bb.b_city_id
			LEFT JOIN admin_schema.master_states ms ON ms.id = bb.b_state
			WHERE COALESCE(bb.document_verification_status, 'pending_review') IN ('pending_review', 'rejected')

			UNION ALL

			SELECT
				'branch_location'::text AS watch_type,
				bb.b_branch_id::bigint AS entity_id,
				COALESCE(bb.b_shop_name, '') AS display_name,
				'Branch Location'::text AS secondary_label,
				COALESCE(bb.b_number, '') AS contact_number,
				COALESCE(mc.city_name, '') AS city_name,
				COALESCE(ms.state_name, '') AS state_name,
				COALESCE(bb.location_verification_status, 'pending_verification') AS status,
				COALESCE(bb.location_capture_source, '') AS capture_source,
				bb.created_at,
				bb.updated_at
			FROM admin_schema.business_branch_table bb
			LEFT JOIN admin_schema.master_city mc ON mc.id = bb.b_city_id
			LEFT JOIN admin_schema.master_states ms ON ms.id = bb.b_state
			WHERE COALESCE(bb.location_verification_status, 'pending_verification') IN ('pending_verification', 'manual_review', 'rejected')

			UNION ALL

			SELECT
				'driver_document'::text AS watch_type,
				di.id::bigint AS entity_id,
				TRIM(CONCAT_WS(' ', COALESCE(di.first_name, ''), COALESCE(di.last_name, ''))) AS display_name,
				'Driver Documents'::text AS secondary_label,
				COALESCE(di.contact_num, '') AS contact_number,
				COALESCE(di.address_town, '') AS city_name,
				COALESCE(di.address_state, '') AS state_name,
				COALESCE(di.document_verification_status, 'pending_documents') AS status,
				''::text AS capture_source,
				NULL::timestamptz AS created_at,
				NULL::timestamptz AS updated_at
			FROM transport_schema.driver_info di
			WHERE COALESCE(di.document_verification_status, 'pending_documents') IN ('pending_documents', 'pending_review', 'rejected')

			UNION ALL

			SELECT
				'driver_physical'::text AS watch_type,
				di.id::bigint AS entity_id,
				TRIM(CONCAT_WS(' ', COALESCE(di.first_name, ''), COALESCE(di.last_name, ''))) AS display_name,
				'Driver Physical'::text AS secondary_label,
				COALESCE(di.contact_num, '') AS contact_number,
				COALESCE(di.address_town, '') AS city_name,
				COALESCE(di.address_state, '') AS state_name,
				COALESCE(di.physical_verification_status, 'pending_documents') AS status,
				''::text AS capture_source,
				NULL::timestamptz AS created_at,
				NULL::timestamptz AS updated_at
			FROM transport_schema.driver_info di
			WHERE COALESCE(di.physical_verification_status, 'pending_documents') IN ('pending_review', 'rejected')

			UNION ALL

			SELECT
				'buyer_kyc'::text AS watch_type,
				b.bid::bigint AS entity_id,
				COALESCE(b.b_owner_name, '') AS display_name,
				'Buyer KYC'::text AS secondary_label,
				COALESCE(b.mobile_number, '') AS contact_number,
				COALESCE(mc.city_name, '') AS city_name,
				COALESCE(ms.state_name, '') AS state_name,
				CASE
					WHEN COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'rejected'
					  OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'rejected'
					THEN 'rejected'
					WHEN COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'pending_review'
					  OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) = 'pending_review'
					THEN 'pending_review'
					ELSE 'pending_documents'
				END AS status,
				''::text AS capture_source,
				b.created_at,
				b.updated_at
			FROM admin_schema.business_table b
			LEFT JOIN admin_schema.master_city mc ON mc.id = b.city_id
			LEFT JOIN admin_schema.master_states ms ON ms.id = b.state_id
			WHERE COALESCE(b.b_type_id, 0) = 1
			  AND (
					COALESCE(NULLIF(b.pan_verification_status, ''), CASE WHEN COALESCE(b.pan_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review', 'rejected')
				 OR COALESCE(NULLIF(b.aadhaar_verification_status, ''), CASE WHEN COALESCE(b.aadhaar_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review', 'rejected')
			  )

			UNION ALL

			SELECT
				'wholesaler_license'::text AS watch_type,
				b.bid::bigint AS entity_id,
				COALESCE(b.b_owner_name, '') AS display_name,
				'Wholesaler License'::text AS secondary_label,
				COALESCE(b.mobile_number, '') AS contact_number,
				COALESCE(mc.city_name, '') AS city_name,
				COALESCE(ms.state_name, '') AS state_name,
				COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) AS status,
				''::text AS capture_source,
				b.created_at,
				b.updated_at
			FROM admin_schema.business_table b
			LEFT JOIN admin_schema.master_city mc ON mc.id = b.city_id
			LEFT JOIN admin_schema.master_states ms ON ms.id = b.state_id
			WHERE COALESCE(b.b_type_id, 0) IN (2, 3)
			  AND COALESCE(NULLIF(b.government_license_verification_status, ''), CASE WHEN COALESCE(b.government_license_number, '') = '' THEN 'pending_documents' ELSE 'pending_review' END) IN ('pending_documents', 'pending_review', 'rejected')
		)
	`

	whereParts := []string{"1=1"}
	args := make([]interface{}, 0, 4)
	argPos := 1

	if watchType != "" {
		watchTypes := expandOnboardingWatchTypes(watchType)
		whereParts = append(whereParts, fmt.Sprintf("watch_type = ANY($%d)", argPos))
		args = append(args, pq.Array(watchTypes))
		argPos++
	}
	if status != "" {
		whereParts = append(whereParts, fmt.Sprintf("status = $%d", argPos))
		args = append(args, status)
		argPos++
	}

	whereSQL := strings.Join(whereParts, " AND ")

	countQuery := itemsCTE + `
		SELECT COUNT(*)
		FROM items
		WHERE ` + whereSQL

	var totalCount int64
	if err := db.Pool.QueryRow(context.Background(), countQuery, args...).Scan(&totalCount); err != nil {
		return nil, err
	}

	listQuery := itemsCTE + fmt.Sprintf(`
		SELECT
			watch_type,
			entity_id,
			display_name,
			secondary_label,
			contact_number,
			city_name,
			state_name,
			status,
			capture_source,
			created_at,
			updated_at
		FROM items
		WHERE %s
		ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST, entity_id DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argPos, argPos+1)

	listArgs := append([]interface{}{}, args...)
	listArgs = append(listArgs, pageSize, offset)

	rows, err := db.Pool.Query(context.Background(), listQuery, listArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.OnboardingWatchItem, 0, pageSize)
	for rows.Next() {
		var item models.OnboardingWatchItem
		if err := rows.Scan(
			&item.WatchType,
			&item.EntityID,
			&item.DisplayName,
			&item.SecondaryLabel,
			&item.ContactNumber,
			&item.CityName,
			&item.StateName,
			&item.Status,
			&item.CaptureSource,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.OnboardingWatchListResponse{
		PagingMeta: models.PagingMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
		},
		Items: items,
	}, nil
}

func expandOnboardingWatchTypes(watchType string) []string {
	switch strings.TrimSpace(strings.ToLower(watchType)) {
	case "":
		return nil
	case "driver_onboarding":
		return []string{"driver_document", "driver_physical"}
	case "branch_verification":
		return []string{"branch_document", "branch_location"}
	case "business_verification":
		return []string{"buyer_kyc", "wholesaler_license"}
	default:
		return []string{strings.TrimSpace(strings.ToLower(watchType))}
	}
}

func (r *AdminRepository) GetTransportWatchSummary() (*models.TransportWatchSummary, error) {
	query := `
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

	var summary models.TransportWatchSummary
	if err := db.Pool.QueryRow(context.Background(), query).Scan(
		&summary.RideNotAssigned,
		&summary.RideNotTaken,
		&summary.PickupDelayed,
		&summary.DeliveryOverdue,
	); err != nil {
		return nil, err
	}

	summary.TotalExceptions = summary.RideNotAssigned + summary.RideNotTaken + summary.PickupDelayed + summary.DeliveryOverdue
	return &summary, nil
}

func (r *AdminRepository) ListTransportWatchItems(page, pageSize int, watchType string) (*models.TransportWatchListResponse, error) {
	offset := (page - 1) * pageSize
	baseCTE := `
		WITH jobs AS (
			SELECT
				tj.job_id::bigint AS job_id,
				ARRAY_REMOVE(ARRAY_AGG(DISTINCT jo.order_id), NULL)::bigint[] AS order_ids,
				tj.status AS job_status,
				COALESCE(MAX(ta.delivery_status), '') AS delivery_status,
				MAX(ta.driver_id)::bigint AS driver_id,
				tj.requested_date,
				tj.delivery_date,
				MAX(ta.accepted_at) AS accepted_at,
				MAX(ta.pickup_confirmed_at) AS pickup_confirmed_at,
				COALESCE(tj.base_price, 0)::float8 AS base_price
			FROM transport_schema.transport_jobs tj
			LEFT JOIN transport_schema.job_orders jo ON jo.job_id = tj.job_id
			LEFT JOIN transport_schema.trip_assignments ta
			  ON ta.job_id = tj.job_id
			 AND ta.delivery_status IN ('pending', 'partially_picked', 'picked_up', 'disputed')
			GROUP BY tj.job_id, tj.status, tj.requested_date, tj.delivery_date, tj.base_price
		),
		items AS (
			SELECT
				'ride_not_assigned'::text AS watch_type,
				job_id,
				order_ids,
				job_status,
				delivery_status,
				driver_id,
				requested_date,
				delivery_date,
				accepted_at,
				pickup_confirmed_at,
				base_price
			FROM jobs
			WHERE job_status = 'open'

			UNION ALL

			SELECT
				'ride_not_taken'::text,
				job_id,
				order_ids,
				job_status,
				delivery_status,
				driver_id,
				requested_date,
				delivery_date,
				accepted_at,
				pickup_confirmed_at,
				base_price
			FROM jobs
			WHERE job_status = 'accepted'
			  AND pickup_confirmed_at IS NULL

			UNION ALL

			SELECT
				'pickup_delayed'::text,
				job_id,
				order_ids,
				job_status,
				delivery_status,
				driver_id,
				requested_date,
				delivery_date,
				accepted_at,
				pickup_confirmed_at,
				base_price
			FROM jobs
			WHERE job_status = 'accepted'
			  AND pickup_confirmed_at IS NULL
			  AND requested_date IS NOT NULL
			  AND requested_date < NOW()

			UNION ALL

			SELECT
				'delivery_overdue'::text,
				job_id,
				order_ids,
				job_status,
				delivery_status,
				driver_id,
				requested_date,
				delivery_date,
				accepted_at,
				pickup_confirmed_at,
				base_price
			FROM jobs
			WHERE job_status IN ('accepted', 'partially_picked', 'picked_up')
			  AND delivery_date < NOW()
		)
	`

	whereParts := []string{"1=1"}
	args := make([]interface{}, 0, 3)
	argPos := 1
	if watchType != "" {
		whereParts = append(whereParts, fmt.Sprintf("watch_type = $%d", argPos))
		args = append(args, watchType)
		argPos++
	}
	whereSQL := strings.Join(whereParts, " AND ")

	countQuery := baseCTE + `
		SELECT COUNT(*)
		FROM items
		WHERE ` + whereSQL

	var totalCount int64
	if err := db.Pool.QueryRow(context.Background(), countQuery, args...).Scan(&totalCount); err != nil {
		return nil, err
	}

	listQuery := baseCTE + fmt.Sprintf(`
		SELECT
			watch_type,
			job_id,
			order_ids,
			job_status,
			delivery_status,
			driver_id,
			requested_date,
			delivery_date,
			accepted_at,
			pickup_confirmed_at,
			base_price
		FROM items
		WHERE %s
		ORDER BY COALESCE(requested_date, delivery_date) ASC NULLS LAST, job_id DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argPos, argPos+1)

	listArgs := append([]interface{}{}, args...)
	listArgs = append(listArgs, pageSize, offset)

	rows, err := db.Pool.Query(context.Background(), listQuery, listArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.TransportWatchItem, 0, pageSize)
	for rows.Next() {
		var item models.TransportWatchItem
		var orderIDs []int64
		if err := rows.Scan(
			&item.WatchType,
			&item.JobID,
			pq.Array(&orderIDs),
			&item.JobStatus,
			&item.DeliveryStatus,
			&item.DriverID,
			&item.RequestedDate,
			&item.ExpectedDeliveryAt,
			&item.AcceptedAt,
			&item.PickupConfirmedAt,
			&item.BasePrice,
		); err != nil {
			return nil, err
		}
		item.OrderIDs = orderIDs
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.TransportWatchListResponse{
		PagingMeta: models.PagingMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
		},
		Items: items,
	}, nil
}

func (r *AdminRepository) GetPaymentWatchSummary() (*models.PaymentWatchSummary, error) {
	query := `
		WITH payment_errors AS (
			SELECT
				o.order_id,
				MAX(pe.created_at) AS latest_error_at,
				COUNT(*) AS error_count
			FROM business_schema.order_table o
			JOIN LATERAL admin_schema.get_payment_errors(o.order_id) pe ON TRUE
			GROUP BY o.order_id
		)
		SELECT
			COALESCE(COUNT(*), 0) AS failed_orders,
			COALESCE(SUM(error_count), 0) AS failure_events,
			COALESCE(COUNT(*) FILTER (WHERE latest_error_at >= NOW() - INTERVAL '24 hours'), 0) AS recent_failures_24_hours,
			(
				SELECT COUNT(*)
				FROM dispute_schema.dispute_cases dc
				INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
				WHERE it.module = 'payment'
				  AND dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
			) AS open_payment_disputes,
			(
				SELECT COUNT(*)
				FROM dispute_schema.dispute_cases dc
				INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
				WHERE it.module = 'payment'
				  AND dc.status = 'pending_execution'
			) AS pending_execution
		FROM payment_errors
	`

	var summary models.PaymentWatchSummary
	if err := db.Pool.QueryRow(context.Background(), query).Scan(
		&summary.FailedOrders,
		&summary.FailureEvents,
		&summary.RecentFailures24Hours,
		&summary.OpenPaymentDisputes,
		&summary.PendingExecution,
	); err != nil {
		return nil, err
	}
	return &summary, nil
}

func (r *AdminRepository) ListPaymentWatchItems(page, pageSize int) (*models.PaymentWatchListResponse, error) {
	offset := (page - 1) * pageSize
	baseCTE := `
		WITH payment_errors AS (
			SELECT
				o.order_id::bigint AS order_id,
				o.retailer_id::bigint AS retailer_id,
				COALESCE(o.final_amount, o.total_order_amount, 0)::float8 AS order_amount,
				MAX(pe.created_at) AS latest_error_at,
				COUNT(*) AS error_count,
				(ARRAY_AGG(pe.error_code ORDER BY pe.created_at DESC))[1] AS latest_error_code,
				(ARRAY_AGG(pe.error_message ORDER BY pe.created_at DESC))[1] AS latest_error_message,
				(ARRAY_AGG(pe.gateway ORDER BY pe.created_at DESC))[1] AS gateway,
				(ARRAY_AGG(pe.payment_id ORDER BY pe.created_at DESC))[1] AS payment_id
			FROM business_schema.order_table o
			JOIN LATERAL admin_schema.get_payment_errors(o.order_id) pe ON TRUE
			GROUP BY o.order_id, o.retailer_id, COALESCE(o.final_amount, o.total_order_amount, 0)
		)
	`

	var totalCount int64
	if err := db.Pool.QueryRow(context.Background(), baseCTE+` SELECT COUNT(*) FROM payment_errors `).Scan(&totalCount); err != nil {
		return nil, err
	}

	listQuery := baseCTE + `
		SELECT
			order_id,
			retailer_id,
			order_amount,
			payment_id,
			gateway,
			latest_error_code,
			latest_error_message,
			latest_error_at,
			error_count
		FROM payment_errors
		ORDER BY latest_error_at DESC, order_id DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := db.Pool.Query(context.Background(), listQuery, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.PaymentWatchItem, 0, pageSize)
	for rows.Next() {
		var item models.PaymentWatchItem
		if err := rows.Scan(
			&item.OrderID,
			&item.RetailerID,
			&item.OrderAmount,
			&item.PaymentID,
			&item.Gateway,
			&item.LatestErrorCode,
			&item.LatestErrorMessage,
			&item.LatestErrorAt,
			&item.ErrorCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.PaymentWatchListResponse{
		PagingMeta: models.PagingMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
		},
		Items: items,
	}, nil
}
