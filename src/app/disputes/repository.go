package disputes

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"farmerapp/go_backend/db"

	"github.com/jackc/pgx/v4"
)

type RepositoryInterface interface {
	ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error)
	CreateDispute(ctx context.Context, userID int64, raisedByRole string, req CreateDisputeRequest) (*CreateDisputeResponse, error)
	CreateAdminDispute(ctx context.Context, actorUserID int64, actionByRole string, req AdminCreateDisputeRequest) (*CreateDisputeResponse, error)
	ListAdminDisputeUsers(ctx context.Context, filter DisputeUserFilter) ([]DisputeUserOption, error)
	SearchAdminDisputeOrders(ctx context.Context, filter AdminOrderSearchFilter) (*AdminOrderSearchResponse, error)
	GetAdminDisputeOrderContext(ctx context.Context, orderID int64) (*AdminOrderContext, error)
	ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error)
	GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error)
	ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error)
	GetAdminDisputeSummary(ctx context.Context) (*AdminDisputeSummary, error)
	ListAdminDisputeFollowups(ctx context.Context, filter AdminDisputeFollowupFilter) (*AdminDisputeFollowupResponse, error)
	ListAdminDisputes(ctx context.Context, filter AdminDisputeListFilter) ([]AdminDisputeListItem, error)
	GetAdminDisputeWorkbench(ctx context.Context, caseID int64) (*AdminDisputeWorkbench, error)
	GetAdminDisputeStatus(ctx context.Context, caseID int64) (string, error)
	AddAdminDisputeAction(ctx context.Context, caseID int64, userID int64, actionByRole string, req AdminAddDisputeActionRequest) (*AddDisputeActionResponse, error)
	AssignAdminDispute(ctx context.Context, caseID int64, userID int64, actionByRole string, req AssignDisputeRequest) error
	UpsertAdminDisputeResolution(ctx context.Context, caseID int64, userID int64, actionByRole string, req UpsertDisputeResolutionRequest) (*DisputeResolutionSummary, error)
	AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, uploadedByRole string, fileName string, mimeType string, fileStorageKey string, req AddDisputeEvidenceRequest) (*DisputeEvidence, error)
	ReplaceDisputeEvidence(ctx context.Context, caseID int64, evidenceID int64, userID int64, uploadedByRole string, fileName string, mimeType string, fileStorageKey string, req AddDisputeEvidenceRequest) (*ReplacedDisputeEvidence, error)
	ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error)
	GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error)
}

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

type duplicateDisputeLookup struct {
	IssueTypeID    int64
	IssueCode      string
	Title          string
	RaisedByUserID *int64
	RaisedByRole   string
	OrderID        *int64
	JobID          *int64
	PaymentID      *int64
	ShipmentID     *int64
}

func (r *Repository) findOpenDuplicateDispute(ctx context.Context, tx pgx.Tx, lookup duplicateDisputeLookup) (*DuplicateDisputeInfo, error) {
	args := []interface{}{
		lookup.IssueTypeID,
		lookup.RaisedByRole,
	}
	matchClauses := make([]string, 0, 4)
	argPos := 3

	if lookup.OrderID != nil {
		matchClauses = append(matchClauses, fmt.Sprintf("dc.order_id = $%d", argPos))
		args = append(args, *lookup.OrderID)
		argPos++
	}
	if lookup.JobID != nil {
		matchClauses = append(matchClauses, fmt.Sprintf("dc.job_id = $%d", argPos))
		args = append(args, *lookup.JobID)
		argPos++
	}
	if lookup.PaymentID != nil {
		matchClauses = append(matchClauses, fmt.Sprintf("dc.payment_id = $%d", argPos))
		args = append(args, *lookup.PaymentID)
		argPos++
	}
	if lookup.ShipmentID != nil {
		matchClauses = append(matchClauses, fmt.Sprintf("dc.shipment_id = $%d", argPos))
		args = append(args, *lookup.ShipmentID)
		argPos++
	}
	if len(matchClauses) == 0 && lookup.RaisedByUserID != nil {
		matchClauses = append(matchClauses, fmt.Sprintf("dc.raised_by_user_id = $%d", argPos))
		args = append(args, *lookup.RaisedByUserID)
		argPos++
	}
	if len(matchClauses) == 0 {
		return nil, nil
	}

	query := `
		SELECT
			dc.id,
			dc.case_reference,
			dc.status
		FROM dispute_schema.dispute_cases dc
		WHERE dc.issue_type_id = $1
			AND dc.raised_by_role = $2
			AND dc.status NOT IN ('closed', 'cancelled')
			AND (` + strings.Join(matchClauses, " OR ") + `)
	`

	if strings.EqualFold(lookup.IssueCode, "OTHER") {
		args = append(args, strings.TrimSpace(lookup.Title))
		query += `
			AND COALESCE(NULLIF(TRIM(dc.title), ''), '') = COALESCE(NULLIF(TRIM($` + fmt.Sprintf("%d", argPos) + `::text), ''), '')
		`
	}

	query += `
		ORDER BY dc.updated_at DESC, dc.id DESC
		LIMIT 1
	`

	var item DuplicateDisputeInfo
	err := tx.QueryRow(ctx, query, args...).Scan(
		&item.CaseID,
		&item.CaseReference,
		&item.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &item, nil
}

func (r *Repository) ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error) {
	args := make([]interface{}, 0, 3)
	where := make([]string, 0, 3)
	argPos := 1

	query := `
		SELECT
			it.id,
			it.code,
			it.name,
			COALESCE(it.description, '') AS description,
			it.module,
			it.default_priority,
			it.default_severity,
			it.default_owner_role,
			it.first_response_sla_minutes,
			it.resolution_sla_minutes,
			it.is_active
		FROM dispute_schema.issue_types it
	`
	if filter.RoleCode != "" {
		query += `
			INNER JOIN dispute_schema.issue_type_roles itr
				ON itr.issue_type_id = it.id
				AND itr.role_code = $1
		`
		args = append(args, filter.RoleCode)
		argPos++
	}

	if filter.Module != "" {
		where = append(where, fmt.Sprintf("it.module = $%d", argPos))
		args = append(args, filter.Module)
		argPos++
	}

	if filter.IsActive != nil {
		where = append(where, fmt.Sprintf("it.is_active = $%d", argPos))
		args = append(args, *filter.IsActive)
		argPos++
	}
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY it.name ASC"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]IssueType, 0)
	for rows.Next() {
		var item IssueType
		if err := rows.Scan(
			&item.ID,
			&item.Code,
			&item.Name,
			&item.Description,
			&item.Module,
			&item.DefaultPriority,
			&item.DefaultSeverity,
			&item.DefaultOwnerRole,
			&item.FirstResponseSLAMinutes,
			&item.ResolutionSLAMinutes,
			&item.IsActive,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *Repository) CreateDispute(ctx context.Context, userID int64, raisedByRole string, req CreateDisputeRequest) (*CreateDisputeResponse, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var issueType IssueType
	err = tx.QueryRow(ctx, `
		SELECT
			it.id,
			it.code,
			it.name,
			COALESCE(it.description, '') AS description,
			it.module,
			it.default_priority,
			it.default_severity,
			it.default_owner_role,
			it.first_response_sla_minutes,
			it.resolution_sla_minutes,
			it.is_active
		FROM dispute_schema.issue_types it
		INNER JOIN dispute_schema.issue_type_roles itr
			ON itr.issue_type_id = it.id
			AND itr.role_code = $2
		WHERE it.id = $1
			AND it.is_active = TRUE
	`, req.IssueTypeID, raisedByRole).Scan(
		&issueType.ID,
		&issueType.Code,
		&issueType.Name,
		&issueType.Description,
		&issueType.Module,
		&issueType.DefaultPriority,
		&issueType.DefaultSeverity,
		&issueType.DefaultOwnerRole,
		&issueType.FirstResponseSLAMinutes,
		&issueType.ResolutionSLAMinutes,
		&issueType.IsActive,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("issue type is not available for this role")
		}
		return nil, err
	}
	if strings.EqualFold(issueType.Code, "OTHER") && strings.TrimSpace(req.Title) == "" {
		return nil, fmt.Errorf("title is required for OTHER issue type")
	}

	duplicate, err := r.findOpenDuplicateDispute(ctx, tx, duplicateDisputeLookup{
		IssueTypeID:    issueType.ID,
		IssueCode:      issueType.Code,
		Title:          req.Title,
		RaisedByUserID: &userID,
		RaisedByRole:   raisedByRole,
		OrderID:        req.OrderID,
		JobID:          req.JobID,
		PaymentID:      req.PaymentID,
		ShipmentID:     req.ShipmentID,
	})
	if err != nil {
		return nil, err
	}
	if duplicate != nil {
		return nil, &DuplicateDisputeError{ExistingCase: *duplicate}
	}

	var caseID int64
	var createdAt time.Time

	err = tx.QueryRow(ctx, `
		INSERT INTO dispute_schema.dispute_cases (
			case_reference,
			issue_type_id,
			title,
			description,
			status,
			priority,
			severity,
			source_channel,
			issue_classification,
			raised_by_user_id,
			raised_by_role,
			current_assignee_role,
			order_id,
			job_id,
			payment_id,
			shipment_id
		) VALUES (
			'PENDING',
			$1,
			NULLIF($2::text, ''),
			$3::text,
			'new',
			$4::text,
			$5::text,
			$6::text,
			CASE
				WHEN $7::text = 'quality' THEN 'service_quality'
				WHEN $7::text = 'payment' THEN 'financial'
				WHEN $7::text IN ('delivery', 'transport', 'returns') THEN 'operational'
				ELSE 'process'
			END,
			$8,
			$9::text,
			$10::text,
			$11,
			$12,
			$13,
			$14
		)
		RETURNING id, created_at
	`,
		issueType.ID,
		strings.TrimSpace(req.Title),
		strings.TrimSpace(req.Description),
		issueType.DefaultPriority,
		issueType.DefaultSeverity,
		req.SourceChannel,
		issueType.Module,
		userID,
		raisedByRole,
		issueType.DefaultOwnerRole,
		req.OrderID,
		req.JobID,
		req.PaymentID,
		req.ShipmentID,
	).Scan(&caseID, &createdAt)
	if err != nil {
		return nil, err
	}

	caseReference := fmt.Sprintf("DSP-%s-%06d", time.Now().Format("2006"), caseID)

	_, err = tx.Exec(ctx, `
		UPDATE dispute_schema.dispute_cases
		SET case_reference = $2
		WHERE id = $1
	`, caseID, caseReference)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			from_status,
			to_status,
			action_note
		) VALUES ($1, 'case_created', $2, $3, NULL, 'new', 'Case created from app')
	`, caseID, userID, raisedByRole)
	if err != nil {
		return nil, err
	}

	firstResponseDueAt := createdAt.Add(time.Duration(issueType.FirstResponseSLAMinutes) * time.Minute)
	resolutionDueAt := createdAt.Add(time.Duration(issueType.ResolutionSLAMinutes) * time.Minute)

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_timers (
			case_id,
			first_response_sla_minutes,
			resolution_sla_minutes,
			first_response_due_at,
			resolution_due_at
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5
		)
	`, caseID, issueType.FirstResponseSLAMinutes, issueType.ResolutionSLAMinutes, firstResponseDueAt, resolutionDueAt)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &CreateDisputeResponse{
		CaseID:        caseID,
		CaseReference: caseReference,
		Status:        "new",
		Message:       "dispute created successfully",
	}, nil
}

func (r *Repository) CreateAdminDispute(ctx context.Context, actorUserID int64, actionByRole string, req AdminCreateDisputeRequest) (*CreateDisputeResponse, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var issueType IssueType
	err = tx.QueryRow(ctx, `
		SELECT
			it.id,
			it.code,
			it.name,
			COALESCE(it.description, '') AS description,
			it.module,
			it.default_priority,
			it.default_severity,
			it.default_owner_role,
			it.first_response_sla_minutes,
			it.resolution_sla_minutes,
			it.is_active
		FROM dispute_schema.issue_types it
		INNER JOIN dispute_schema.issue_type_roles itr
			ON itr.issue_type_id = it.id
			AND itr.role_code = $2
		WHERE it.id = $1
			AND it.is_active = TRUE
	`, req.IssueTypeID, req.ReportedByRole).Scan(
		&issueType.ID,
		&issueType.Code,
		&issueType.Name,
		&issueType.Description,
		&issueType.Module,
		&issueType.DefaultPriority,
		&issueType.DefaultSeverity,
		&issueType.DefaultOwnerRole,
		&issueType.FirstResponseSLAMinutes,
		&issueType.ResolutionSLAMinutes,
		&issueType.IsActive,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("issue type is not available for reported_by_role")
		}
		return nil, err
	}
	if strings.EqualFold(issueType.Code, "OTHER") && strings.TrimSpace(req.Title) == "" {
		return nil, fmt.Errorf("title is required for OTHER issue type")
	}

	duplicate, err := r.findOpenDuplicateDispute(ctx, tx, duplicateDisputeLookup{
		IssueTypeID:    issueType.ID,
		IssueCode:      issueType.Code,
		Title:          req.Title,
		RaisedByUserID: req.ReportedByUserID,
		RaisedByRole:   req.ReportedByRole,
		OrderID:        req.OrderID,
		JobID:          req.JobID,
		PaymentID:      req.PaymentID,
		ShipmentID:     req.ShipmentID,
	})
	if err != nil {
		return nil, err
	}
	if duplicate != nil {
		return nil, &DuplicateDisputeError{ExistingCase: *duplicate}
	}

	var caseID int64
	var createdAt time.Time

	err = tx.QueryRow(ctx, `
		INSERT INTO dispute_schema.dispute_cases (
			case_reference,
			issue_type_id,
			title,
			description,
			status,
			priority,
			severity,
			source_channel,
			issue_classification,
			raised_by_user_id,
			raised_by_role,
			current_assignee_role,
			order_id,
			job_id,
			payment_id,
			shipment_id,
			incident_at
		) VALUES (
			'PENDING',
			$1,
			NULLIF($2::text, ''),
			$3::text,
			'new',
			$4::text,
			$5::text,
			$6::text,
			CASE
				WHEN $7::text = 'quality' THEN 'service_quality'
				WHEN $7::text = 'payment' THEN 'financial'
				WHEN $7::text IN ('delivery', 'transport', 'returns') THEN 'operational'
				ELSE 'process'
			END,
			$8,
			$9::text,
			$10::text,
			$11,
			$12,
			$13,
			$14,
			$15
		)
		RETURNING id, created_at
	`,
		issueType.ID,
		strings.TrimSpace(req.Title),
		strings.TrimSpace(req.Description),
		issueType.DefaultPriority,
		issueType.DefaultSeverity,
		req.SourceChannel,
		issueType.Module,
		req.ReportedByUserID,
		req.ReportedByRole,
		issueType.DefaultOwnerRole,
		req.OrderID,
		req.JobID,
		req.PaymentID,
		req.ShipmentID,
		req.IncidentAt,
	).Scan(&caseID, &createdAt)
	if err != nil {
		return nil, err
	}

	caseReference := fmt.Sprintf("DSP-%s-%06d", time.Now().Format("2006"), caseID)

	_, err = tx.Exec(ctx, `
		UPDATE dispute_schema.dispute_cases
		SET case_reference = $2
		WHERE id = $1
	`, caseID, caseReference)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			from_status,
			to_status,
			action_note
		) VALUES ($1, 'case_created', $2, $3, NULL, 'new', $4)
	`, caseID, actorUserID, actionByRole, fmt.Sprintf("Case created manually from %s", req.SourceChannel))
	if err != nil {
		return nil, err
	}

	firstResponseDueAt := createdAt.Add(time.Duration(issueType.FirstResponseSLAMinutes) * time.Minute)
	resolutionDueAt := createdAt.Add(time.Duration(issueType.ResolutionSLAMinutes) * time.Minute)

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_timers (
			case_id,
			first_response_sla_minutes,
			resolution_sla_minutes,
			first_response_due_at,
			resolution_due_at
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5
		)
	`, caseID, issueType.FirstResponseSLAMinutes, issueType.ResolutionSLAMinutes, firstResponseDueAt, resolutionDueAt)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &CreateDisputeResponse{
		CaseID:        caseID,
		CaseReference: caseReference,
		Status:        "new",
		Message:       "dispute created successfully",
	}, nil
}

func (r *Repository) SearchAdminDisputeOrders(ctx context.Context, filter AdminOrderSearchFilter) (*AdminOrderSearchResponse, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	args := make([]interface{}, 0, 8)
	where := make([]string, 0, 4)
	argPos := 1

	appendFilter := func(clause string, value interface{}) {
		where = append(where, fmt.Sprintf(clause, argPos))
		args = append(args, value)
		argPos++
	}

	if filter.OrderID != nil {
		appendFilter("o.order_id = $%d", *filter.OrderID)
	}
	if filter.Phone != "" {
		appendFilter("COALESCE(rb.mobile_number, '') ILIKE '%%' || $%d || '%%'", filter.Phone)
	}
	if filter.DateFrom != nil {
		appendFilter("o.date_of_order::date >= $%d::date", filter.DateFrom.Format("2006-01-02"))
	}
	if filter.DateTo != nil {
		appendFilter("o.date_of_order::date <= $%d::date", filter.DateTo.Format("2006-01-02"))
	}

	query := `
		SELECT
			o.order_id,
			o.date_of_order,
			o.order_status,
			COALESCE(os.order_status, '') AS order_status_text,
			o.retailer_id,
			COALESCE(rb.b_owner_name, '') AS retailer_name,
			COALESCE(rb.mobile_number, '') AS retailer_contact_mobile,
			COALESCE(o.delivery_address, '') AS delivery_address,
			COALESCE(o.total_order_amount, 0)::float8 AS total_order_amount,
			o.final_amount::float8,
			o.actual_delivery_date::timestamptz,
			NULL::timestamptz AS desired_delivery_date,
			NULL::timestamptz AS delivery_deadline
		FROM business_schema.order_table o
		LEFT JOIN admin_schema.order_status_table os ON os.order_status_id = o.order_status
		LEFT JOIN admin_schema.business_table rb ON rb.bid = o.retailer_id
	`
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPos := argPos
	offsetPos := argPos + 1

	query += `
		ORDER BY o.date_of_order DESC, o.order_id DESC
		LIMIT $` + fmt.Sprint(limitPos) + ` OFFSET $` + fmt.Sprint(offsetPos)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminOrderSearchItem, 0)
	for rows.Next() {
		var item AdminOrderSearchItem
		if err := rows.Scan(
			&item.OrderID,
			&item.DateOfOrder,
			&item.OrderStatusID,
			&item.OrderStatusText,
			&item.RetailerID,
			&item.RetailerName,
			&item.RetailerContactMobile,
			&item.DeliveryAddress,
			&item.TotalOrderAmount,
			&item.FinalAmount,
			&item.ActualDeliveryDate,
			&item.DesiredDeliveryDate,
			&item.DeliveryDeadline,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &AdminOrderSearchResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (r *Repository) GetAdminDisputeOrderContext(ctx context.Context, orderID int64) (*AdminOrderContext, error) {
	var order AdminOrderSearchItem
	err := db.Pool.QueryRow(ctx, `
		SELECT
			o.order_id,
			o.date_of_order,
			o.order_status,
			COALESCE(os.order_status, '') AS order_status_text,
			o.retailer_id,
			COALESCE(rb.b_owner_name, '') AS retailer_name,
			COALESCE(rb.mobile_number, '') AS retailer_contact_mobile,
			COALESCE(o.delivery_address, '') AS delivery_address,
			COALESCE(o.total_order_amount, 0)::float8 AS total_order_amount,
			o.final_amount::float8,
			o.actual_delivery_date::timestamptz,
			NULL::timestamptz AS desired_delivery_date,
			NULL::timestamptz AS delivery_deadline
		FROM business_schema.order_table o
		LEFT JOIN admin_schema.order_status_table os ON os.order_status_id = o.order_status
		LEFT JOIN admin_schema.business_table rb ON rb.bid = o.retailer_id
		WHERE o.order_id = $1
	`, orderID).Scan(
		&order.OrderID,
		&order.DateOfOrder,
		&order.OrderStatusID,
		&order.OrderStatusText,
		&order.RetailerID,
		&order.RetailerName,
		&order.RetailerContactMobile,
		&order.DeliveryAddress,
		&order.TotalOrderAmount,
		&order.FinalAmount,
		&order.ActualDeliveryDate,
		&order.DesiredDeliveryDate,
		&order.DeliveryDeadline,
	)
	if err != nil {
		return nil, err
	}

	rows, err := db.Pool.Query(ctx, `
		SELECT DISTINCT job_id
		FROM transport_schema.job_orders
		WHERE order_id = $1
		ORDER BY job_id DESC
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	jobIDs := make([]int64, 0)
	for rows.Next() {
		var jobID int64
		if err := rows.Scan(&jobID); err != nil {
			return nil, err
		}
		jobIDs = append(jobIDs, jobID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	resp := &AdminOrderContext{
		Order:        &order,
		LinkedJobIDs: jobIDs,
	}
	if len(jobIDs) == 1 {
		resp.SuggestedJobID = &jobIDs[0]
	}
	return resp, nil
}

func (r *Repository) ListAdminDisputeUsers(ctx context.Context, filter DisputeUserFilter) ([]DisputeUserOption, error) {
	roleID, err := mapCaseRoleToUserRoleID(filter.Role)
	if err != nil {
		return nil, err
	}

	args := []interface{}{roleID}
	where := []string{"role_id = $1", "active_status = 1"}
	argPos := 2

	if filter.Q != "" {
		where = append(where, fmt.Sprintf("(name ILIKE '%%' || $%[1]d || '%%' OR COALESCE(email,'') ILIKE '%%' || $%[1]d || '%%' OR COALESCE(mobile_num,'') ILIKE '%%' || $%[1]d || '%%')", argPos))
		args = append(args, filter.Q)
		argPos++
	}

	query := `
		SELECT user_id, name, COALESCE(email, '') AS email, COALESCE(mobile_num, '') AS mobile_num, role_id
		FROM admin_schema.user_table
		WHERE ` + strings.Join(where, " AND ") + `
		ORDER BY name ASC, user_id ASC
	`

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DisputeUserOption, 0)
	for rows.Next() {
		var item DisputeUserOption
		var email string
		var mobile string
		if err := rows.Scan(&item.UserID, &item.Name, &email, &mobile, &item.RoleID); err != nil {
			return nil, err
		}
		item.RoleCode = filter.Role
		if email != "" {
			item.Email = &email
		}
		if mobile != "" {
			item.MobileNum = &mobile
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *Repository) ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	args := []interface{}{filter.UserID}
	where := []string{"raised_by_user_id = $1"}
	argPos := 2

	if filter.Status != "" {
		where = append(where, fmt.Sprintf("dc.status = $%d", argPos))
		args = append(args, filter.Status)
		argPos++
	}
	if filter.OrderID != nil {
		where = append(where, fmt.Sprintf("dc.order_id = $%d", argPos))
		args = append(args, *filter.OrderID)
		argPos++
	}
	if filter.JobID != nil {
		where = append(where, fmt.Sprintf("dc.job_id = $%d", argPos))
		args = append(args, *filter.JobID)
		argPos++
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPos := argPos
	offsetPos := argPos + 1

	query := `
		SELECT
			dc.id,
			dc.case_reference,
			dc.issue_type_id,
			it.name,
			COALESCE(dc.title, '') AS title,
			dc.status,
			dc.priority,
			dc.created_at,
			dc.updated_at,
			dc.order_id,
			dc.job_id,
			dc.payment_id,
			dc.shipment_id,
			COALESCE(dc.next_step_type, '') AS next_step_type,
			dc.next_step_due_at
		FROM dispute_schema.dispute_cases dc
		INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		WHERE ` + strings.Join(where, " AND ") + `
		ORDER BY dc.created_at DESC
		LIMIT $` + fmt.Sprint(limitPos) + ` OFFSET $` + fmt.Sprint(offsetPos)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DisputeListItem, 0)
	for rows.Next() {
		var item DisputeListItem
		if err := rows.Scan(
			&item.CaseID,
			&item.CaseReference,
			&item.IssueTypeID,
			&item.IssueTypeName,
			&item.Title,
			&item.Status,
			&item.Priority,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.OrderID,
			&item.JobID,
			&item.PaymentID,
			&item.ShipmentID,
			&item.NextStepType,
			&item.NextStepDueAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *Repository) GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error) {
	row := db.Pool.QueryRow(ctx, `
		SELECT
			dc.id,
			dc.case_reference,
			dc.issue_type_id,
			it.name,
			COALESCE(dc.title, '') AS title,
			dc.description,
			dc.status,
			dc.priority,
			dc.severity,
			dc.source_channel,
			dc.raised_by_user_id,
			dc.raised_by_role,
			dc.current_assignee_user_id,
			dc.current_assignee_role,
			dc.order_id,
			dc.job_id,
			dc.payment_id,
			dc.shipment_id,
			COALESCE(dc.next_step_type, '') AS next_step_type,
			dc.next_step_due_at,
			dc.created_at,
			dc.updated_at,
			dc.resolved_at,
			dc.closed_at
		FROM dispute_schema.dispute_cases dc
		INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		WHERE dc.id = $1
		  AND dc.raised_by_user_id = $2
	`, caseID, userID)

	var item DisputeCaseDetail
	if err := row.Scan(
		&item.CaseID,
		&item.CaseReference,
		&item.IssueTypeID,
		&item.IssueTypeName,
		&item.Title,
		&item.Description,
		&item.Status,
		&item.Priority,
		&item.Severity,
		&item.SourceChannel,
		&item.RaisedByUserID,
		&item.RaisedByRole,
		&item.CurrentAssigneeUserID,
		&item.CurrentAssigneeRole,
		&item.OrderID,
		&item.JobID,
		&item.PaymentID,
		&item.ShipmentID,
		&item.NextStepType,
		&item.NextStepDueAt,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.ResolvedAt,
		&item.ClosedAt,
	); err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *Repository) GetAdminDisputeSummary(ctx context.Context) (*AdminDisputeSummary, error) {
	row := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
			) AS total_open,
			COUNT(*) FILTER (WHERE dc.status = 'awaiting_evidence') AS awaiting_evidence,
			COUNT(*) FILTER (WHERE dc.status = 'under_review') AS under_review,
			COUNT(*) FILTER (WHERE dc.status = 'pending_external_action') AS pending_external_action,
			COUNT(*) FILTER (WHERE dc.status = 'pending_execution') AS pending_execution,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < NOW()
			) AS overdue,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= date_trunc('day', NOW())
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < date_trunc('day', NOW()) + INTERVAL '1 day'
			) AS due_today,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= NOW()
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) <= NOW() + INTERVAL '24 hours'
			) AS due_soon,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dt.first_response_breached, FALSE) = TRUE
			) AS first_response_breached,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dt.resolution_breached, FALSE) = TRUE
			) AS resolution_breached
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
	`)

	var summary AdminDisputeSummary
	if err := row.Scan(
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

	return &summary, nil
}

func (r *Repository) ListAdminDisputeFollowups(ctx context.Context, filter AdminDisputeFollowupFilter) (*AdminDisputeFollowupResponse, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	bucketRow := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= date_trunc('day', NOW())
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < date_trunc('day', NOW()) + INTERVAL '1 day'
			) AS due_today,
			COUNT(*) FILTER (
				WHERE dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')
				  AND COALESCE(dc.next_step_due_at, dt.resolution_due_at) < NOW()
			) AS overdue,
			COUNT(*) FILTER (WHERE dc.status = 'awaiting_evidence') AS awaiting_evidence,
			COUNT(*) FILTER (WHERE dc.status = 'pending_external_action') AS pending_external_action,
			COUNT(*) FILTER (WHERE dc.status = 'pending_execution') AS pending_execution
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
	`)

	var buckets AdminDisputeFollowupBuckets
	if err := bucketRow.Scan(
		&buckets.DueToday,
		&buckets.Overdue,
		&buckets.AwaitingEvidence,
		&buckets.PendingExternalAction,
		&buckets.PendingExecution,
	); err != nil {
		return nil, err
	}

	args := make([]interface{}, 0, 8)
	where := []string{"dc.status IN ('new', 'triaged', 'awaiting_evidence', 'under_review', 'pending_external_action', 'pending_execution')"}
	argPos := 1

	appendFilter := func(clause string, value interface{}) {
		where = append(where, fmt.Sprintf(clause, argPos))
		args = append(args, value)
		argPos++
	}

	switch filter.Bucket {
	case "", "due_today":
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= date_trunc('day', NOW())")
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) < date_trunc('day', NOW()) + INTERVAL '1 day'")
	case "overdue":
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) < NOW()")
	case "awaiting_evidence":
		where = append(where, "dc.status = 'awaiting_evidence'")
	case "pending_external_action":
		where = append(where, "dc.status = 'pending_external_action'")
	case "pending_execution":
		where = append(where, "dc.status = 'pending_execution'")
	default:
		return nil, fmt.Errorf("unsupported follow-up bucket")
	}

	if filter.AssignedUserID != nil {
		appendFilter("dc.current_assignee_user_id = $%d", *filter.AssignedUserID)
	}
	if filter.AssignedRole != "" {
		appendFilter("dc.current_assignee_role = $%d", filter.AssignedRole)
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPos := argPos
	offsetPos := argPos + 1

	query := `
		SELECT
			dc.id,
			dc.case_reference,
			dc.issue_type_id,
			it.name,
			COALESCE(dc.title, '') AS title,
			dc.status,
			dc.priority,
			dc.severity,
			dc.source_channel,
			dc.created_at,
			dc.updated_at,
			dc.order_id,
			dc.job_id,
			dc.payment_id,
			dc.shipment_id,
			dc.current_assignee_user_id,
			dc.current_assignee_role,
			COALESCE(dc.next_step_type, '') AS next_step_type,
			COALESCE(dc.next_step_due_at, dt.resolution_due_at) AS next_step_due_at,
			COALESCE(dt.first_response_breached, FALSE) AS first_response_breached,
			COALESCE(dt.resolution_breached, FALSE) AS resolution_breached
		FROM dispute_schema.dispute_cases dc
		INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
		WHERE ` + strings.Join(where, " AND ") + `
		ORDER BY COALESCE(dc.next_step_due_at, dt.resolution_due_at) ASC NULLS LAST, dc.created_at DESC
		LIMIT $` + fmt.Sprint(limitPos) + ` OFFSET $` + fmt.Sprint(offsetPos)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminDisputeListItem, 0)
	for rows.Next() {
		var item AdminDisputeListItem
		if err := rows.Scan(
			&item.CaseID,
			&item.CaseReference,
			&item.IssueTypeID,
			&item.IssueTypeName,
			&item.Title,
			&item.Status,
			&item.Priority,
			&item.Severity,
			&item.SourceChannel,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.OrderID,
			&item.JobID,
			&item.PaymentID,
			&item.ShipmentID,
			&item.CurrentAssigneeUserID,
			&item.CurrentAssigneeRole,
			&item.NextStepType,
			&item.NextStepDueAt,
			&item.FirstResponseBreached,
			&item.ResolutionBreached,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &AdminDisputeFollowupResponse{
		Buckets:  buckets,
		Items:    items,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (r *Repository) ListAdminDisputes(ctx context.Context, filter AdminDisputeListFilter) ([]AdminDisputeListItem, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	args := make([]interface{}, 0, 16)
	where := make([]string, 0, 12)
	argPos := 1

	appendFilter := func(clause string, value interface{}) {
		where = append(where, fmt.Sprintf(clause, argPos))
		args = append(args, value)
		argPos++
	}

	if filter.Status != "" {
		appendFilter("dc.status = $%d", filter.Status)
	}
	if filter.Priority != "" {
		appendFilter("dc.priority = $%d", filter.Priority)
	}
	if filter.Severity != "" {
		appendFilter("dc.severity = $%d", filter.Severity)
	}
	if filter.IssueTypeID != nil {
		appendFilter("dc.issue_type_id = $%d", *filter.IssueTypeID)
	}
	if filter.SourceChannel != "" {
		appendFilter("dc.source_channel = $%d", filter.SourceChannel)
	}
	if filter.AssignedUserID != nil {
		appendFilter("dc.current_assignee_user_id = $%d", *filter.AssignedUserID)
	}
	if filter.AssignedRole != "" {
		appendFilter("dc.current_assignee_role = $%d", filter.AssignedRole)
	}
	if filter.OrderID != nil {
		appendFilter("dc.order_id = $%d", *filter.OrderID)
	}
	if filter.JobID != nil {
		appendFilter("dc.job_id = $%d", *filter.JobID)
	}
	if filter.PaymentID != nil {
		appendFilter("dc.payment_id = $%d", *filter.PaymentID)
	}
	if filter.ShipmentID != nil {
		appendFilter("dc.shipment_id = $%d", *filter.ShipmentID)
	}
	if filter.DueState == "overdue" {
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) < NOW()")
	} else if filter.DueState == "due_soon" {
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) >= NOW()")
		where = append(where, "COALESCE(dc.next_step_due_at, dt.resolution_due_at) <= NOW() + INTERVAL '2 hours'")
	}

	query := `
		SELECT
			dc.id,
			dc.case_reference,
			dc.issue_type_id,
			it.name,
			COALESCE(dc.title, '') AS title,
			dc.status,
			dc.priority,
			dc.severity,
			dc.source_channel,
			dc.created_at,
			dc.updated_at,
			dc.order_id,
			dc.job_id,
			dc.payment_id,
			dc.shipment_id,
			dc.current_assignee_user_id,
			dc.current_assignee_role,
			COALESCE(dc.next_step_type, '') AS next_step_type,
			dc.next_step_due_at,
			dt.first_response_breached,
			dt.resolution_breached
		FROM dispute_schema.dispute_cases dc
		INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		LEFT JOIN dispute_schema.dispute_timers dt ON dt.case_id = dc.id
	`
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPos := argPos
	offsetPos := argPos + 1
	query += `
		ORDER BY COALESCE(dc.next_step_due_at, dt.resolution_due_at) ASC NULLS LAST, dc.created_at DESC
		LIMIT $` + fmt.Sprint(limitPos) + ` OFFSET $` + fmt.Sprint(offsetPos)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdminDisputeListItem, 0)
	for rows.Next() {
		var item AdminDisputeListItem
		if err := rows.Scan(
			&item.CaseID,
			&item.CaseReference,
			&item.IssueTypeID,
			&item.IssueTypeName,
			&item.Title,
			&item.Status,
			&item.Priority,
			&item.Severity,
			&item.SourceChannel,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.OrderID,
			&item.JobID,
			&item.PaymentID,
			&item.ShipmentID,
			&item.CurrentAssigneeUserID,
			&item.CurrentAssigneeRole,
			&item.NextStepType,
			&item.NextStepDueAt,
			&item.FirstResponseBreached,
			&item.ResolutionBreached,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *Repository) GetAdminDisputeWorkbench(ctx context.Context, caseID int64) (*AdminDisputeWorkbench, error) {
	caseRow := db.Pool.QueryRow(ctx, `
		SELECT
			dc.id,
			dc.case_reference,
			dc.issue_type_id,
			it.name,
			COALESCE(dc.title, '') AS title,
			dc.description,
			dc.status,
			dc.priority,
			dc.severity,
			dc.source_channel,
			dc.raised_by_user_id,
			dc.raised_by_role,
			dc.current_assignee_user_id,
			dc.current_assignee_role,
			dc.order_id,
			dc.job_id,
			dc.payment_id,
			dc.shipment_id,
			COALESCE(dc.next_step_type, '') AS next_step_type,
			dc.next_step_due_at,
			dc.created_at,
			dc.updated_at,
			dc.resolved_at,
			dc.closed_at
		FROM dispute_schema.dispute_cases dc
		INNER JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		WHERE dc.id = $1
	`, caseID)

	var detail DisputeCaseDetail
	if err := caseRow.Scan(
		&detail.CaseID,
		&detail.CaseReference,
		&detail.IssueTypeID,
		&detail.IssueTypeName,
		&detail.Title,
		&detail.Description,
		&detail.Status,
		&detail.Priority,
		&detail.Severity,
		&detail.SourceChannel,
		&detail.RaisedByUserID,
		&detail.RaisedByRole,
		&detail.CurrentAssigneeUserID,
		&detail.CurrentAssigneeRole,
		&detail.OrderID,
		&detail.JobID,
		&detail.PaymentID,
		&detail.ShipmentID,
		&detail.NextStepType,
		&detail.NextStepDueAt,
		&detail.CreatedAt,
		&detail.UpdatedAt,
		&detail.ResolvedAt,
		&detail.ClosedAt,
	); err != nil {
		return nil, err
	}

	var timer *DisputeTimerSnapshot
	timerRow := db.Pool.QueryRow(ctx, `
		SELECT
			first_response_sla_minutes,
			resolution_sla_minutes,
			first_response_due_at,
			resolution_due_at,
			paused_at,
			COALESCE(pause_reason, '') AS pause_reason,
			total_pause_minutes,
			first_response_breached,
			resolution_breached,
			escalation_level,
			last_escalated_at,
			last_evaluated_at
		FROM dispute_schema.dispute_timers
		WHERE case_id = $1
	`, caseID)
	var timerItem DisputeTimerSnapshot
	if err := timerRow.Scan(
		&timerItem.FirstResponseSLAMinutes,
		&timerItem.ResolutionSLAMinutes,
		&timerItem.FirstResponseDueAt,
		&timerItem.ResolutionDueAt,
		&timerItem.PausedAt,
		&timerItem.PauseReason,
		&timerItem.TotalPauseMinutes,
		&timerItem.FirstResponseBreached,
		&timerItem.ResolutionBreached,
		&timerItem.EscalationLevel,
		&timerItem.LastEscalatedAt,
		&timerItem.LastEvaluatedAt,
	); err == nil {
		timer = &timerItem
	}

	var resolution *DisputeResolutionSummary
	resolutionRow := db.Pool.QueryRow(ctx, `
		SELECT
			id,
			case_id,
			outcome_code,
			decision_summary,
			COALESCE(liable_party_role, '') AS liable_party_role,
			liable_party_id,
			disputed_amount::float8,
			approved_amount::float8,
			refund_amount::float8,
			penalty_amount::float8,
			compensation_amount::float8,
			COALESCE(ops_action_instructions, '') AS ops_action_instructions,
			COALESCE(finance_action_instructions, '') AS finance_action_instructions,
			COALESCE(customer_communication_instructions, '') AS customer_communication_instructions,
			decided_by_user_id,
			decided_at,
			executed_at
		FROM dispute_schema.dispute_resolution
		WHERE case_id = $1
	`, caseID)
	var resolutionItem DisputeResolutionSummary
	if err := resolutionRow.Scan(
		&resolutionItem.ResolutionID,
		&resolutionItem.CaseID,
		&resolutionItem.OutcomeCode,
		&resolutionItem.DecisionSummary,
		&resolutionItem.LiablePartyRole,
		&resolutionItem.LiablePartyID,
		&resolutionItem.DisputedAmount,
		&resolutionItem.ApprovedAmount,
		&resolutionItem.RefundAmount,
		&resolutionItem.PenaltyAmount,
		&resolutionItem.CompensationAmount,
		&resolutionItem.OpsActionInstructions,
		&resolutionItem.FinanceActionInstructions,
		&resolutionItem.CustomerCommunicationInstructions,
		&resolutionItem.DecidedByUserID,
		&resolutionItem.DecidedAt,
		&resolutionItem.ExecutedAt,
	); err == nil {
		resolution = &resolutionItem
	}

	actionRows, err := db.Pool.Query(ctx, `
		SELECT
			id,
			action_type,
			action_by_user_id,
			action_by_role,
			COALESCE(from_status, '') AS from_status,
			COALESCE(to_status, '') AS to_status,
			COALESCE(action_note, '') AS action_note,
			created_at
		FROM dispute_schema.dispute_actions
		WHERE case_id = $1
		ORDER BY created_at DESC
		LIMIT 20
	`, caseID)
	if err != nil {
		return nil, err
	}
	defer actionRows.Close()

	actions := make([]DisputeAction, 0)
	for actionRows.Next() {
		var item DisputeAction
		if err := actionRows.Scan(
			&item.ActionID,
			&item.ActionType,
			&item.ActionByUserID,
			&item.ActionByRole,
			&item.FromStatus,
			&item.ToStatus,
			&item.ActionNote,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		actions = append(actions, item)
	}
	if err := actionRows.Err(); err != nil {
		return nil, err
	}

	evidenceRows, err := db.Pool.Query(ctx, `
		SELECT
			id,
			case_id,
			evidence_type,
			COALESCE(file_name, '') AS file_name,
			COALESCE(mime_type, '') AS mime_type,
			COALESCE(caption, '') AS caption,
			COALESCE(capture_source, '') AS capture_source,
			captured_latitude,
			captured_longitude,
			captured_at,
			uploaded_by_user_id,
			uploaded_by_role,
			created_at
		FROM dispute_schema.dispute_evidence
		WHERE case_id = $1
		ORDER BY created_at DESC
		LIMIT 10
	`, caseID)
	if err != nil {
		return nil, err
	}
	defer evidenceRows.Close()

	evidenceItems := make([]DisputeEvidence, 0)
	for evidenceRows.Next() {
		var item DisputeEvidence
		if err := evidenceRows.Scan(
			&item.EvidenceID,
			&item.CaseID,
			&item.EvidenceType,
			&item.FileName,
			&item.MimeType,
			&item.Caption,
			&item.CaptureSource,
			&item.CapturedLatitude,
			&item.CapturedLongitude,
			&item.CapturedAt,
			&item.UploadedByUserID,
			&item.UploadedByRole,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		item.FileURL = fmt.Sprintf("/disputes/%d/evidence/%d/file", item.CaseID, item.EvidenceID)
		evidenceItems = append(evidenceItems, item)
	}
	if err := evidenceRows.Err(); err != nil {
		return nil, err
	}

	return &AdminDisputeWorkbench{
		Case:           &detail,
		LatestActions:  actions,
		LatestEvidence: evidenceItems,
		Timer:          timer,
		Resolution:     resolution,
	}, nil
}

func (r *Repository) GetAdminDisputeStatus(ctx context.Context, caseID int64) (string, error) {
	var status string
	err := db.Pool.QueryRow(ctx, `
		SELECT status
		FROM dispute_schema.dispute_cases
		WHERE id = $1
	`, caseID).Scan(&status)
	return status, err
}

func (r *Repository) AddAdminDisputeAction(ctx context.Context, caseID int64, userID int64, actionByRole string, req AdminAddDisputeActionRequest) (*AddDisputeActionResponse, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var currentStatus string
	var firstResponseAt *time.Time
	err = tx.QueryRow(ctx, `
		SELECT status, first_response_at
		FROM dispute_schema.dispute_cases
		WHERE id = $1
		FOR UPDATE
	`, caseID).Scan(&currentStatus, &firstResponseAt)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	applyNextStep := req.NextStepType != "" || req.NextStepDueAt != nil || req.NextStepRole != "" || req.NextStepUserID != nil
	nextStepType := req.NextStepType
	nextStepRole := req.NextStepRole
	nextStepDueAt := req.NextStepDueAt
	nextStepUserID := req.NextStepUserID

	if req.StatusTo == "resolved" || req.StatusTo == "closed" || req.StatusTo == "cancelled" {
		applyNextStep = true
		nextStepType = ""
		nextStepRole = ""
		nextStepDueAt = nil
		nextStepUserID = nil
	}

	_, err = tx.Exec(ctx, `
		UPDATE dispute_schema.dispute_cases
		SET
			status = CASE WHEN $2 <> '' THEN $2 ELSE status END,
			next_step_type = CASE WHEN $3 THEN NULLIF($4, '') ELSE next_step_type END,
			next_step_due_at = CASE WHEN $3 THEN $5 ELSE next_step_due_at END,
			next_step_role = CASE WHEN $3 THEN NULLIF($6, '') ELSE next_step_role END,
			next_step_user_id = CASE WHEN $3 THEN $7 ELSE next_step_user_id END,
			first_response_at = CASE WHEN first_response_at IS NULL THEN $8 ELSE first_response_at END,
			resolved_at = CASE WHEN $2 = 'resolved' AND resolved_at IS NULL THEN $8 ELSE resolved_at END,
			closed_at = CASE WHEN $2 = 'closed' AND closed_at IS NULL THEN $8 ELSE closed_at END,
			cancelled_at = CASE WHEN $2 = 'cancelled' AND cancelled_at IS NULL THEN $8 ELSE cancelled_at END,
			cancel_reason = CASE WHEN $2 = 'cancelled' THEN NULLIF($9, '') ELSE cancel_reason END
		WHERE id = $1
	`, caseID, req.StatusTo, applyNextStep, nextStepType, nextStepDueAt, nextStepRole, nextStepUserID, now, req.Note)
	if err != nil {
		return nil, err
	}

	var actionID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			from_status,
			to_status,
			action_note
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			NULLIF($6, ''),
			NULLIF($7, '')
		)
		RETURNING id
	`, caseID, req.ActionType, userID, actionByRole, currentStatus, req.StatusTo, req.Note).Scan(&actionID)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &AddDisputeActionResponse{
		ActionID: actionID,
		Message:  "action logged successfully",
	}, nil
}

func (r *Repository) AssignAdminDispute(ctx context.Context, caseID int64, userID int64, actionByRole string, req AssignDisputeRequest) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var existingAssigneeUserID *int64
	var existingAssigneeRole string
	err = tx.QueryRow(ctx, `
		SELECT current_assignee_user_id, current_assignee_role
		FROM dispute_schema.dispute_cases
		WHERE id = $1
		FOR UPDATE
	`, caseID).Scan(&existingAssigneeUserID, &existingAssigneeRole)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE dispute_schema.dispute_cases
		SET
			current_assignee_user_id = $2,
			current_assignee_role = $3
		WHERE id = $1
	`, caseID, req.CurrentAssigneeUserID, req.CurrentAssigneeRole)
	if err != nil {
		return err
	}

	actionType := "assigned"
	if existingAssigneeUserID != nil {
		actionType = "reassigned"
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			action_note
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5
		)
	`, caseID, actionType, userID, actionByRole, fmt.Sprintf("Assigned case to %s", req.CurrentAssigneeRole))
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) UpsertAdminDisputeResolution(ctx context.Context, caseID int64, userID int64, actionByRole string, req UpsertDisputeResolutionRequest) (*DisputeResolutionSummary, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var currentStatus string
	err = tx.QueryRow(ctx, `
		SELECT status
		FROM dispute_schema.dispute_cases
		WHERE id = $1
		FOR UPDATE
	`, caseID).Scan(&currentStatus)
	if err != nil {
		return nil, err
	}

	var item DisputeResolutionSummary
	err = tx.QueryRow(ctx, `
		INSERT INTO dispute_schema.dispute_resolution (
			case_id,
			outcome_code,
			decision_summary,
			liable_party_role,
			liable_party_id,
			disputed_amount,
			approved_amount,
			refund_amount,
			penalty_amount,
			compensation_amount,
			ops_action_instructions,
			finance_action_instructions,
			customer_communication_instructions,
			decided_by_user_id,
			executed_at
		) VALUES (
			$1,
			$2::text,
			$3::text,
			NULLIF($4::text, ''),
			$5::bigint,
			$6::numeric,
			COALESCE($7::numeric, 0),
			COALESCE($8::numeric, 0),
			COALESCE($9::numeric, 0),
			COALESCE($10::numeric, 0),
			NULLIF($11::text, ''),
			NULLIF($12::text, ''),
			NULLIF($13::text, ''),
			$14::bigint,
			$15::timestamptz
		)
		ON CONFLICT (case_id) DO UPDATE SET
			outcome_code = EXCLUDED.outcome_code,
			decision_summary = EXCLUDED.decision_summary,
			liable_party_role = EXCLUDED.liable_party_role,
			liable_party_id = EXCLUDED.liable_party_id,
			disputed_amount = EXCLUDED.disputed_amount,
			approved_amount = EXCLUDED.approved_amount,
			refund_amount = EXCLUDED.refund_amount,
			penalty_amount = EXCLUDED.penalty_amount,
			compensation_amount = EXCLUDED.compensation_amount,
			ops_action_instructions = EXCLUDED.ops_action_instructions,
			finance_action_instructions = EXCLUDED.finance_action_instructions,
			customer_communication_instructions = EXCLUDED.customer_communication_instructions,
			decided_by_user_id = EXCLUDED.decided_by_user_id,
			decided_at = NOW(),
			executed_at = EXCLUDED.executed_at
		RETURNING
			id,
			case_id,
			outcome_code,
			decision_summary,
			COALESCE(liable_party_role, '') AS liable_party_role,
			liable_party_id,
			disputed_amount::float8,
			approved_amount::float8,
			refund_amount::float8,
			penalty_amount::float8,
			compensation_amount::float8,
			COALESCE(ops_action_instructions, '') AS ops_action_instructions,
			COALESCE(finance_action_instructions, '') AS finance_action_instructions,
			COALESCE(customer_communication_instructions, '') AS customer_communication_instructions,
			decided_by_user_id,
			decided_at,
			executed_at
	`,
		caseID,
		req.OutcomeCode,
		req.DecisionSummary,
		req.LiablePartyRole,
		req.LiablePartyID,
		req.DisputedAmount,
		req.ApprovedAmount,
		req.RefundAmount,
		req.PenaltyAmount,
		req.CompensationAmount,
		req.OpsActionInstructions,
		req.FinanceActionInstructions,
		req.CustomerCommunicationInstructions,
		userID,
		req.ExecutedAt,
	).Scan(
		&item.ResolutionID,
		&item.CaseID,
		&item.OutcomeCode,
		&item.DecisionSummary,
		&item.LiablePartyRole,
		&item.LiablePartyID,
		&item.DisputedAmount,
		&item.ApprovedAmount,
		&item.RefundAmount,
		&item.PenaltyAmount,
		&item.CompensationAmount,
		&item.OpsActionInstructions,
		&item.FinanceActionInstructions,
		&item.CustomerCommunicationInstructions,
		&item.DecidedByUserID,
		&item.DecidedAt,
		&item.ExecutedAt,
	)
	if err != nil {
		return nil, err
	}

	actionType := "note_added"
	note := "Resolution saved"

	if req.StatusTo != "" {
		now := time.Now().UTC()
		_, err = tx.Exec(ctx, `
			UPDATE dispute_schema.dispute_cases
			SET
				status = $2::text,
				resolved_at = CASE WHEN $2::text = 'resolved' AND resolved_at IS NULL THEN $3::timestamptz ELSE resolved_at END,
				closed_at = CASE WHEN $2::text = 'closed' AND closed_at IS NULL THEN $3::timestamptz ELSE closed_at END,
				cancelled_at = CASE WHEN $2::text = 'cancelled' AND cancelled_at IS NULL THEN $3::timestamptz ELSE cancelled_at END,
				cancel_reason = CASE WHEN $2::text = 'cancelled' THEN 'Cancelled during resolution' ELSE cancel_reason END
			WHERE id = $1
		`, caseID, req.StatusTo, now)
		if err != nil {
			return nil, err
		}

		switch req.StatusTo {
		case "pending_execution":
			actionType = "settlement_requested"
			note = "Resolution saved and case moved to pending execution"
		case "resolved":
			actionType = "resolved"
			note = "Resolution saved and case resolved"
		case "closed":
			actionType = "closed"
			note = "Resolution saved and case closed"
		case "cancelled":
			actionType = "cancelled"
			note = "Resolution saved and case cancelled"
		default:
			actionType = "note_added"
			note = "Resolution saved"
		}
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			from_status,
			to_status,
			action_note
		) VALUES (
			$1,
			$2::text,
			$3::bigint,
			$4::text,
			$5::text,
			NULLIF($6::text, ''),
			$7::text
		)
	`, caseID, actionType, userID, actionByRole, currentStatus, req.StatusTo, note)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *Repository) ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT
			da.id,
			da.action_type,
			da.action_by_user_id,
			da.action_by_role,
			COALESCE(da.from_status, '') AS from_status,
			COALESCE(da.to_status, '') AS to_status,
			COALESCE(da.action_note, '') AS action_note,
			da.created_at
		FROM dispute_schema.dispute_actions da
		INNER JOIN dispute_schema.dispute_cases dc ON dc.id = da.case_id
		WHERE da.case_id = $1
		  AND dc.raised_by_user_id = $2
		ORDER BY da.created_at ASC
	`, caseID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DisputeAction, 0)
	for rows.Next() {
		var item DisputeAction
		if err := rows.Scan(
			&item.ActionID,
			&item.ActionType,
			&item.ActionByUserID,
			&item.ActionByRole,
			&item.FromStatus,
			&item.ToStatus,
			&item.ActionNote,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, uploadedByRole string, fileName string, mimeType string, fileStorageKey string, req AddDisputeEvidenceRequest) (*DisputeEvidence, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var exists bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM dispute_schema.dispute_cases
			WHERE id = $1
			  AND raised_by_user_id = $2
		)
	`, caseID, userID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, pgx.ErrNoRows
	}

	var existingCount int
	err = tx.QueryRow(ctx, `
		SELECT COUNT(1)
		FROM dispute_schema.dispute_evidence
		WHERE case_id = $1
	`, caseID).Scan(&existingCount)
	if err != nil {
		return nil, err
	}
	if existingCount >= maxDisputeImagesPerCase {
		return nil, fmt.Errorf("maximum %d images allowed per dispute", maxDisputeImagesPerCase)
	}

	var item DisputeEvidence
	err = tx.QueryRow(ctx, `
		INSERT INTO dispute_schema.dispute_evidence (
			case_id,
			uploaded_by_user_id,
			uploaded_by_role,
			evidence_type,
			file_name,
			mime_type,
			file_storage_key,
			caption,
			capture_source,
			captured_latitude,
			captured_longitude,
			captured_at,
			is_primary
		) VALUES (
			$1,
			$2,
			$3,
			'photo',
			$4,
			$5,
			$6,
			NULLIF($7::text, ''),
			$8,
			$9,
			$10,
			$11,
			$12
		)
		RETURNING
			id,
			case_id,
			evidence_type,
			COALESCE(file_name, ''),
			COALESCE(mime_type, ''),
			COALESCE(caption, ''),
			COALESCE(capture_source, ''),
			captured_latitude,
			captured_longitude,
			captured_at,
			uploaded_by_user_id,
			uploaded_by_role,
			created_at
	`, caseID, userID, uploadedByRole, fileName, mimeType, fileStorageKey, req.Caption, req.CaptureSource, req.CapturedLatitude, req.CapturedLongitude, req.CapturedAt, existingCount == 0).Scan(
		&item.EvidenceID,
		&item.CaseID,
		&item.EvidenceType,
		&item.FileName,
		&item.MimeType,
		&item.Caption,
		&item.CaptureSource,
		&item.CapturedLatitude,
		&item.CapturedLongitude,
		&item.CapturedAt,
		&item.UploadedByUserID,
		&item.UploadedByRole,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			action_note
		) VALUES (
			$1,
			'evidence_received',
			$2,
			$3,
			$4
		)
	`, caseID, userID, uploadedByRole, "Evidence uploaded")
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	item.FileURL = fmt.Sprintf("/disputes/%d/evidence/%d/file", item.CaseID, item.EvidenceID)
	return &item, nil
}

func (r *Repository) ReplaceDisputeEvidence(ctx context.Context, caseID int64, evidenceID int64, userID int64, uploadedByRole string, fileName string, mimeType string, fileStorageKey string, req AddDisputeEvidenceRequest) (*ReplacedDisputeEvidence, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	var previousStorageKey string
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(de.file_storage_key, '')
		FROM dispute_schema.dispute_evidence de
		INNER JOIN dispute_schema.dispute_cases dc ON dc.id = de.case_id
		WHERE de.id = $1
		  AND de.case_id = $2
		  AND dc.raised_by_user_id = $3
		FOR UPDATE
	`, evidenceID, caseID, userID).Scan(&previousStorageKey)
	if err != nil {
		return nil, err
	}

	var item DisputeEvidence
	err = tx.QueryRow(ctx, `
		UPDATE dispute_schema.dispute_evidence
		SET
			uploaded_by_user_id = $3,
			uploaded_by_role = $4,
			evidence_type = 'photo',
			file_name = $5,
			mime_type = $6,
			file_storage_key = $7,
			caption = NULLIF($8::text, ''),
			capture_source = $9,
			captured_latitude = $10,
			captured_longitude = $11,
			captured_at = $12,
			verified_by_user_id = NULL,
			verified_at = NULL
		WHERE id = $1
		  AND case_id = $2
		RETURNING
			id,
			case_id,
			evidence_type,
			COALESCE(file_name, ''),
			COALESCE(mime_type, ''),
			COALESCE(caption, ''),
			COALESCE(capture_source, ''),
			captured_latitude,
			captured_longitude,
			captured_at,
			uploaded_by_user_id,
			uploaded_by_role,
			created_at
	`, evidenceID, caseID, userID, uploadedByRole, fileName, mimeType, fileStorageKey, req.Caption, req.CaptureSource, req.CapturedLatitude, req.CapturedLongitude, req.CapturedAt).Scan(
		&item.EvidenceID,
		&item.CaseID,
		&item.EvidenceType,
		&item.FileName,
		&item.MimeType,
		&item.Caption,
		&item.CaptureSource,
		&item.CapturedLatitude,
		&item.CapturedLongitude,
		&item.CapturedAt,
		&item.UploadedByUserID,
		&item.UploadedByRole,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO dispute_schema.dispute_actions (
			case_id,
			action_type,
			action_by_user_id,
			action_by_role,
			action_note
		) VALUES (
			$1,
			'evidence_received',
			$2,
			$3,
			$4
		)
	`, caseID, userID, uploadedByRole, "Evidence reuploaded")
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	item.FileURL = fmt.Sprintf("/disputes/%d/evidence/%d/file", item.CaseID, item.EvidenceID)
	return &ReplacedDisputeEvidence{
		Item:               &item,
		PreviousStorageKey: previousStorageKey,
	}, nil
}

func (r *Repository) ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT
			de.id,
			de.case_id,
			de.evidence_type,
			COALESCE(de.file_name, '') AS file_name,
			COALESCE(de.mime_type, '') AS mime_type,
			COALESCE(de.caption, '') AS caption,
			COALESCE(de.capture_source, '') AS capture_source,
			de.captured_latitude,
			de.captured_longitude,
			de.captured_at,
			de.uploaded_by_user_id,
			de.uploaded_by_role,
			de.created_at
		FROM dispute_schema.dispute_evidence de
		INNER JOIN dispute_schema.dispute_cases dc ON dc.id = de.case_id
		WHERE de.case_id = $1
		  AND dc.raised_by_user_id = $2
		ORDER BY de.created_at DESC
	`, caseID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DisputeEvidence, 0)
	for rows.Next() {
		var item DisputeEvidence
		if err := rows.Scan(
			&item.EvidenceID,
			&item.CaseID,
			&item.EvidenceType,
			&item.FileName,
			&item.MimeType,
			&item.Caption,
			&item.CaptureSource,
			&item.CapturedLatitude,
			&item.CapturedLongitude,
			&item.CapturedAt,
			&item.UploadedByUserID,
			&item.UploadedByRole,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		item.FileURL = fmt.Sprintf("/disputes/%d/evidence/%d/file", item.CaseID, item.EvidenceID)
		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *Repository) GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error) {
	row := db.Pool.QueryRow(ctx, `
		SELECT
			de.id,
			de.case_id,
			COALESCE(de.file_storage_key, '') AS file_storage_key,
			COALESCE(de.file_name, '') AS file_name,
			COALESCE(de.mime_type, '') AS mime_type
		FROM dispute_schema.dispute_evidence de
		INNER JOIN dispute_schema.dispute_cases dc ON dc.id = de.case_id
		WHERE de.id = $1
		  AND de.case_id = $2
		  AND dc.raised_by_user_id = $3
	`, evidenceID, caseID, userID)

	var item StoredEvidenceFile
	if err := row.Scan(
		&item.EvidenceID,
		&item.CaseID,
		&item.FileStorageKey,
		&item.FileName,
		&item.MimeType,
	); err != nil {
		return nil, err
	}

	return &item, nil
}

var _ RepositoryInterface = (*Repository)(nil)
var _ pgx.Tx

func mapCaseRoleToUserRoleID(role string) (int, error) {
	switch role {
	case "admin":
		return 1, nil
	case "wholesaler":
		return 2, nil
	case "retailer":
		return 3, nil
	case "driver":
		return 4, nil
	case "customer":
		return 5, nil
	case "ops_l1":
		return 6, nil
	case "ops_l2":
		return 7, nil
	case "finance":
		return 8, nil
	default:
		return 0, fmt.Errorf("unsupported role")
	}
}
