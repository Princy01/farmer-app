package disputes

import (
	"context"
	"fmt"
	"strings"
	"time"

	"farmerapp/go_backend/db"

	"github.com/jackc/pgx/v4"
)

type RepositoryInterface interface {
	ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error)
	CreateDispute(ctx context.Context, userID int64, raisedByRole string, req CreateDisputeRequest) (*CreateDisputeResponse, error)
	ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error)
	GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error)
	ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error)
	AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, uploadedByRole string, fileName string, mimeType string, fileStorageKey string, req AddDisputeEvidenceRequest) (*DisputeEvidence, error)
	ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error)
	GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error)
}

type Repository struct{}

func NewRepository() *Repository {
	return &Repository{}
}

func (r *Repository) ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error) {
	args := make([]interface{}, 0, 2)
	where := make([]string, 0, 2)
	argPos := 1

	if filter.Module != "" {
		where = append(where, fmt.Sprintf("module = $%d", argPos))
		args = append(args, filter.Module)
		argPos++
	}

	if filter.IsActive != nil {
		where = append(where, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *filter.IsActive)
		argPos++
	}

	query := `
		SELECT
			id,
			code,
			name,
			COALESCE(description, '') AS description,
			module,
			default_priority,
			default_severity,
			default_owner_role,
			first_response_sla_minutes,
			resolution_sla_minutes,
			is_active
		FROM dispute_schema.issue_types
	`
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY name ASC"

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
			id,
			code,
			name,
			COALESCE(description, '') AS description,
			module,
			default_priority,
			default_severity,
			default_owner_role,
			first_response_sla_minutes,
			resolution_sla_minutes,
			is_active
		FROM dispute_schema.issue_types
		WHERE id = $1 AND is_active = TRUE
	`, req.IssueTypeID).Scan(
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
		return nil, err
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

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	item.FileURL = fmt.Sprintf("/disputes/%d/evidence/%d/file", item.CaseID, item.EvidenceID)
	return &item, nil
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
