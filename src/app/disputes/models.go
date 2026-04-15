package disputes

import "time"

type IssueTypeFilter struct {
	Module   string
	IsActive *bool
}

type IssueType struct {
	ID                      int64  `json:"id"`
	Code                    string `json:"code"`
	Name                    string `json:"name"`
	Description             string `json:"description,omitempty"`
	Module                  string `json:"module"`
	DefaultPriority         string `json:"default_priority"`
	DefaultSeverity         string `json:"default_severity"`
	DefaultOwnerRole        string `json:"default_owner_role"`
	FirstResponseSLAMinutes int    `json:"first_response_sla_minutes"`
	ResolutionSLAMinutes    int    `json:"resolution_sla_minutes"`
	IsActive                bool   `json:"is_active"`
}

type CreateDisputeRequest struct {
	IssueTypeID        int64  `json:"issue_type_id"`
	Title              string `json:"title"`
	Description        string `json:"description"`
	SourceChannel      string `json:"source_channel"`
	OrderID            *int64 `json:"order_id"`
	JobID              *int64 `json:"job_id"`
	PaymentID          *int64 `json:"payment_id"`
	ShipmentID         *int64 `json:"shipment_id"`
	CounterpartyUserID *int64 `json:"counterparty_user_id"`
	CounterpartyRole   string `json:"counterparty_role"`
}

type CreateDisputeResponse struct {
	CaseID        int64  `json:"case_id"`
	CaseReference string `json:"case_reference"`
	Status        string `json:"status"`
	Message       string `json:"message"`
}

type DisputeListFilter struct {
	UserID   int64
	RoleID   int
	Status   string
	OrderID  *int64
	JobID    *int64
	Page     int
	PageSize int
}

type DisputeListItem struct {
	CaseID        int64      `json:"case_id"`
	CaseReference string     `json:"case_reference"`
	IssueTypeID   int64      `json:"issue_type_id"`
	IssueTypeName string     `json:"issue_type_name"`
	Title         string     `json:"title,omitempty"`
	Status        string     `json:"status"`
	Priority      string     `json:"priority"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	OrderID       *int64     `json:"order_id,omitempty"`
	JobID         *int64     `json:"job_id,omitempty"`
	PaymentID     *int64     `json:"payment_id,omitempty"`
	ShipmentID    *int64     `json:"shipment_id,omitempty"`
	NextStepType  string     `json:"next_step_type,omitempty"`
	NextStepDueAt *time.Time `json:"next_step_due_at,omitempty"`
}

type DisputeCaseDetail struct {
	CaseID                int64      `json:"case_id"`
	CaseReference         string     `json:"case_reference"`
	IssueTypeID           int64      `json:"issue_type_id"`
	IssueTypeName         string     `json:"issue_type_name"`
	Title                 string     `json:"title,omitempty"`
	Description           string     `json:"description"`
	Status                string     `json:"status"`
	Priority              string     `json:"priority"`
	Severity              string     `json:"severity"`
	SourceChannel         string     `json:"source_channel"`
	RaisedByUserID        *int64     `json:"raised_by_user_id,omitempty"`
	RaisedByRole          string     `json:"raised_by_role"`
	CurrentAssigneeUserID *int64     `json:"current_assignee_user_id,omitempty"`
	CurrentAssigneeRole   string     `json:"current_assignee_role"`
	OrderID               *int64     `json:"order_id,omitempty"`
	JobID                 *int64     `json:"job_id,omitempty"`
	PaymentID             *int64     `json:"payment_id,omitempty"`
	ShipmentID            *int64     `json:"shipment_id,omitempty"`
	NextStepType          string     `json:"next_step_type,omitempty"`
	NextStepDueAt         *time.Time `json:"next_step_due_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	ResolvedAt            *time.Time `json:"resolved_at,omitempty"`
	ClosedAt              *time.Time `json:"closed_at,omitempty"`
}

type DisputeAction struct {
	ActionID       int64     `json:"action_id"`
	ActionType     string    `json:"action_type"`
	ActionByUserID *int64    `json:"performed_by_user_id,omitempty"`
	ActionByRole   string    `json:"performed_by_role"`
	FromStatus     string    `json:"status_from,omitempty"`
	ToStatus       string    `json:"status_to,omitempty"`
	ActionNote     string    `json:"note,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type DisputeEvidence struct {
	EvidenceID        int64      `json:"evidence_id"`
	CaseID            int64      `json:"case_id"`
	EvidenceType      string     `json:"evidence_type"`
	FileName          string     `json:"file_name,omitempty"`
	MimeType          string     `json:"mime_type,omitempty"`
	FileURL           string     `json:"file_url,omitempty"`
	Caption           string     `json:"caption,omitempty"`
	CaptureSource     string     `json:"capture_source,omitempty"`
	CapturedLatitude  *float64   `json:"captured_latitude,omitempty"`
	CapturedLongitude *float64   `json:"captured_longitude,omitempty"`
	CapturedAt        *time.Time `json:"captured_at,omitempty"`
	UploadedByUserID  *int64     `json:"uploaded_by_user_id,omitempty"`
	UploadedByRole    string     `json:"uploaded_by_role"`
	CreatedAt         time.Time  `json:"created_at"`
}

type AddDisputeEvidenceRequest struct {
	Caption           string
	CaptureSource     string
	CapturedLatitude  *float64
	CapturedLongitude *float64
	CapturedAt        *time.Time
}

type StoredEvidenceFile struct {
	EvidenceID     int64
	CaseID         int64
	FileStorageKey string
	FileName       string
	MimeType       string
}
