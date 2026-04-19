package disputes

import "time"

type IssueTypeFilter struct {
	Module   string
	IsActive *bool
	RoleCode string
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

type AdminCreateDisputeRequest struct {
	IssueTypeID      int64      `json:"issue_type_id"`
	Title            string     `json:"title"`
	Description      string     `json:"description"`
	SourceChannel    string     `json:"source_channel"`
	OrderID          *int64     `json:"order_id"`
	JobID            *int64     `json:"job_id"`
	PaymentID        *int64     `json:"payment_id"`
	ShipmentID       *int64     `json:"shipment_id"`
	ReportedByRole   string     `json:"reported_by_role"`
	ReportedByUserID *int64     `json:"reported_by_user_id"`
	IncidentAt       *time.Time `json:"incident_at"`
}

type DisputeRoleOption struct {
	Code  string `json:"code"`
	Label string `json:"label"`
}

type DisputeUserOption struct {
	UserID    int64   `json:"user_id"`
	Name      string  `json:"name"`
	Email     *string `json:"email,omitempty"`
	MobileNum *string `json:"mobile_num,omitempty"`
	RoleID    int     `json:"role_id"`
	RoleCode  string  `json:"role_code"`
}

type AdminDisputeOptionsResponse struct {
	ReporterRoles  []DisputeRoleOption `json:"reporter_roles"`
	AssigneeRoles  []DisputeRoleOption `json:"assignee_roles"`
	SourceChannels []DisputeRoleOption `json:"source_channels"`
}

type DisputeUserFilter struct {
	Role string
	Q    string
}

type AdminOrderSearchFilter struct {
	Phone    string
	OrderID  *int64
	DateFrom *time.Time
	DateTo   *time.Time
	Page     int
	PageSize int
}

type AdminOrderSearchItem struct {
	OrderID               int64      `json:"order_id"`
	DateOfOrder           *time.Time `json:"date_of_order,omitempty"`
	OrderStatusID         *int64     `json:"order_status_id,omitempty"`
	OrderStatusText       string     `json:"order_status_text,omitempty"`
	RetailerID            *int64     `json:"retailer_id,omitempty"`
	RetailerName          string     `json:"retailer_name,omitempty"`
	RetailerContactMobile string     `json:"retailer_contact_mobile,omitempty"`
	DeliveryAddress       string     `json:"delivery_address,omitempty"`
	TotalOrderAmount      float64    `json:"total_order_amount"`
	FinalAmount           *float64   `json:"final_amount,omitempty"`
	ActualDeliveryDate    *time.Time `json:"actual_delivery_date,omitempty"`
	DesiredDeliveryDate   *time.Time `json:"desired_delivery_date,omitempty"`
	DeliveryDeadline      *time.Time `json:"delivery_deadline,omitempty"`
}

type AdminOrderSearchResponse struct {
	Items    []AdminOrderSearchItem `json:"items"`
	Page     int                    `json:"page"`
	PageSize int                    `json:"page_size"`
}

type AdminOrderContext struct {
	Order          *AdminOrderSearchItem `json:"order"`
	LinkedJobIDs   []int64               `json:"linked_job_ids"`
	SuggestedJobID *int64                `json:"suggested_job_id,omitempty"`
}

type CreateDisputeResponse struct {
	CaseID        int64  `json:"case_id"`
	CaseReference string `json:"case_reference"`
	Status        string `json:"status"`
	Message       string `json:"message"`
}

type DuplicateDisputeInfo struct {
	CaseID        int64  `json:"case_id"`
	CaseReference string `json:"case_reference"`
	Status        string `json:"status"`
}

type DuplicateDisputeError struct {
	ExistingCase DuplicateDisputeInfo
}

func (e *DuplicateDisputeError) Error() string {
	return "an open dispute already exists for this issue"
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

type AdminDisputeListFilter struct {
	Status         string
	Priority       string
	Severity       string
	IssueTypeID    *int64
	SourceChannel  string
	AssignedUserID *int64
	AssignedRole   string
	DueState       string
	OrderID        *int64
	JobID          *int64
	PaymentID      *int64
	ShipmentID     *int64
	Page           int
	PageSize       int
}

type AdminDisputeFollowupFilter struct {
	Bucket         string
	AssignedUserID *int64
	AssignedRole   string
	Page           int
	PageSize       int
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

type AdminDisputeListItem struct {
	CaseID                int64      `json:"case_id"`
	CaseReference         string     `json:"case_reference"`
	IssueTypeID           int64      `json:"issue_type_id"`
	IssueTypeName         string     `json:"issue_type_name"`
	Title                 string     `json:"title,omitempty"`
	Status                string     `json:"status"`
	Priority              string     `json:"priority"`
	Severity              string     `json:"severity"`
	SourceChannel         string     `json:"source_channel"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	OrderID               *int64     `json:"order_id,omitempty"`
	JobID                 *int64     `json:"job_id,omitempty"`
	PaymentID             *int64     `json:"payment_id,omitempty"`
	ShipmentID            *int64     `json:"shipment_id,omitempty"`
	CurrentAssigneeUserID *int64     `json:"current_assignee_user_id,omitempty"`
	CurrentAssigneeRole   string     `json:"current_assignee_role"`
	NextStepType          string     `json:"next_step_type,omitempty"`
	NextStepDueAt         *time.Time `json:"next_step_due_at,omitempty"`
	FirstResponseBreached bool       `json:"first_response_breached"`
	ResolutionBreached    bool       `json:"resolution_breached"`
}

type AdminDisputeSummary struct {
	TotalOpen             int64 `json:"total_open"`
	AwaitingEvidence      int64 `json:"awaiting_evidence"`
	UnderReview           int64 `json:"under_review"`
	PendingExternalAction int64 `json:"pending_external_action"`
	PendingExecution      int64 `json:"pending_execution"`
	Overdue               int64 `json:"overdue"`
	DueToday              int64 `json:"due_today"`
	DueSoon               int64 `json:"due_soon"`
	FirstResponseBreached int64 `json:"first_response_breached"`
	ResolutionBreached    int64 `json:"resolution_breached"`
}

type AdminDisputeFollowupBuckets struct {
	DueToday              int64 `json:"due_today"`
	Overdue               int64 `json:"overdue"`
	AwaitingEvidence      int64 `json:"awaiting_evidence"`
	PendingExternalAction int64 `json:"pending_external_action"`
	PendingExecution      int64 `json:"pending_execution"`
}

type AdminDisputeFollowupResponse struct {
	Buckets  AdminDisputeFollowupBuckets `json:"buckets"`
	Items    []AdminDisputeListItem      `json:"items"`
	Page     int                         `json:"page"`
	PageSize int                         `json:"page_size"`
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

type DisputeTimerSnapshot struct {
	FirstResponseSLAMinutes int        `json:"first_response_sla_minutes"`
	ResolutionSLAMinutes    int        `json:"resolution_sla_minutes"`
	FirstResponseDueAt      *time.Time `json:"first_response_due_at,omitempty"`
	ResolutionDueAt         *time.Time `json:"resolution_due_at,omitempty"`
	PausedAt                *time.Time `json:"paused_at,omitempty"`
	PauseReason             string     `json:"pause_reason,omitempty"`
	TotalPauseMinutes       int        `json:"total_pause_minutes"`
	FirstResponseBreached   bool       `json:"first_response_breached"`
	ResolutionBreached      bool       `json:"resolution_breached"`
	EscalationLevel         int        `json:"escalation_level"`
	LastEscalatedAt         *time.Time `json:"last_escalated_at,omitempty"`
	LastEvaluatedAt         *time.Time `json:"last_evaluated_at,omitempty"`
}

type DisputeResolutionSummary struct {
	ResolutionID                      int64      `json:"resolution_id"`
	CaseID                            int64      `json:"case_id"`
	OutcomeCode                       string     `json:"outcome_code"`
	DecisionSummary                   string     `json:"decision_summary"`
	LiablePartyRole                   string     `json:"liable_party_role,omitempty"`
	LiablePartyID                     *int64     `json:"liable_party_id,omitempty"`
	DisputedAmount                    *float64   `json:"disputed_amount,omitempty"`
	ApprovedAmount                    float64    `json:"approved_amount"`
	RefundAmount                      float64    `json:"refund_amount"`
	PenaltyAmount                     float64    `json:"penalty_amount"`
	CompensationAmount                float64    `json:"compensation_amount"`
	OpsActionInstructions             string     `json:"ops_action_instructions,omitempty"`
	FinanceActionInstructions         string     `json:"finance_action_instructions,omitempty"`
	CustomerCommunicationInstructions string     `json:"customer_communication_instructions,omitempty"`
	DecidedByUserID                   int64      `json:"decided_by_user_id"`
	DecidedAt                         time.Time  `json:"decided_at"`
	ExecutedAt                        *time.Time `json:"executed_at,omitempty"`
}

type AdminDisputeWorkbench struct {
	Case           *DisputeCaseDetail        `json:"case"`
	LatestActions  []DisputeAction           `json:"latest_actions"`
	LatestEvidence []DisputeEvidence         `json:"latest_evidence"`
	Timer          *DisputeTimerSnapshot     `json:"timer,omitempty"`
	Resolution     *DisputeResolutionSummary `json:"resolution,omitempty"`
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

type AdminAddDisputeActionRequest struct {
	ActionType     string     `json:"action_type"`
	Note           string     `json:"note"`
	StatusTo       string     `json:"status_to"`
	NextStepType   string     `json:"next_step_type"`
	NextStepDueAt  *time.Time `json:"next_step_due_at"`
	NextStepRole   string     `json:"next_step_role"`
	NextStepUserID *int64     `json:"next_step_user_id"`
}

type UpsertDisputeResolutionRequest struct {
	OutcomeCode                       string     `json:"outcome_code"`
	DecisionSummary                   string     `json:"decision_summary"`
	LiablePartyRole                   string     `json:"liable_party_role"`
	LiablePartyID                     *int64     `json:"liable_party_id"`
	DisputedAmount                    *float64   `json:"disputed_amount"`
	ApprovedAmount                    *float64   `json:"approved_amount"`
	RefundAmount                      *float64   `json:"refund_amount"`
	PenaltyAmount                     *float64   `json:"penalty_amount"`
	CompensationAmount                *float64   `json:"compensation_amount"`
	OpsActionInstructions             string     `json:"ops_action_instructions"`
	FinanceActionInstructions         string     `json:"finance_action_instructions"`
	CustomerCommunicationInstructions string     `json:"customer_communication_instructions"`
	ExecutedAt                        *time.Time `json:"executed_at"`
	StatusTo                          string     `json:"status_to"`
}

type AddDisputeActionResponse struct {
	ActionID int64  `json:"action_id"`
	Message  string `json:"message"`
}

type AssignDisputeRequest struct {
	CurrentAssigneeUserID *int64 `json:"current_assignee_user_id"`
	CurrentAssigneeRole   string `json:"current_assignee_role"`
}

type StoredEvidenceFile struct {
	EvidenceID     int64
	CaseID         int64
	FileStorageKey string
	FileName       string
	MimeType       string
}

type ReplacedDisputeEvidence struct {
	Item               *DisputeEvidence
	PreviousStorageKey string
}
