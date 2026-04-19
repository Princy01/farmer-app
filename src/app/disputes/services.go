package disputes

import (
	"context"
	"errors"
	"mime/multipart"
	"strings"
)

type ServiceInterface interface {
	ListIssueTypes(ctx context.Context, roleID int, filter IssueTypeFilter) ([]IssueType, error)
	CreateDispute(ctx context.Context, userID int64, roleID int, req CreateDisputeRequest) (*CreateDisputeResponse, error)
	CreateAdminDispute(ctx context.Context, actorUserID int64, actorRoleID int, req AdminCreateDisputeRequest) (*CreateDisputeResponse, error)
	GetAdminDisputeOptions(ctx context.Context) (*AdminDisputeOptionsResponse, error)
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
	AddAdminDisputeAction(ctx context.Context, caseID int64, userID int64, roleID int, req AdminAddDisputeActionRequest) (*AddDisputeActionResponse, error)
	AssignAdminDispute(ctx context.Context, caseID int64, userID int64, roleID int, req AssignDisputeRequest) error
	UpsertAdminDisputeResolution(ctx context.Context, caseID int64, userID int64, roleID int, req UpsertDisputeResolutionRequest) (*DisputeResolutionSummary, error)
	AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int, fileHeader *multipart.FileHeader, req AddDisputeEvidenceRequest) (*DisputeEvidence, error)
	ReplaceDisputeEvidence(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int, fileHeader *multipart.FileHeader, req AddDisputeEvidenceRequest) (*DisputeEvidence, error)
	ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error)
	GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error)
}

type Service struct {
	repository RepositoryInterface
}

func NewService(repository RepositoryInterface) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListIssueTypes(ctx context.Context, roleID int, filter IssueTypeFilter) ([]IssueType, error) {
	filter.Module = strings.TrimSpace(filter.Module)
	filter.RoleCode = strings.TrimSpace(filter.RoleCode)

	roleCode, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}

	switch roleCode {
	case "admin", "ops_l1", "ops_l2", "finance", "system":
		if filter.RoleCode != "" && !isAllowedCaseRole(filter.RoleCode) {
			return nil, errors.New("unsupported role")
		}
	default:
		filter.RoleCode = roleCode
	}

	return s.repository.ListIssueTypes(ctx, filter)
}

func (s *Service) CreateDispute(ctx context.Context, userID int64, roleID int, req CreateDisputeRequest) (*CreateDisputeResponse, error) {
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.SourceChannel = strings.TrimSpace(req.SourceChannel)

	if req.IssueTypeID <= 0 {
		return nil, errors.New("issue_type_id is required")
	}
	if req.Description == "" {
		return nil, errors.New("description is required")
	}
	if req.SourceChannel == "" {
		req.SourceChannel = "app"
	}
	if req.SourceChannel != "app" {
		return nil, errors.New("source_channel must be app")
	}
	if req.OrderID == nil && req.JobID == nil && req.PaymentID == nil && req.ShipmentID == nil {
		return nil, errors.New("at least one linked context is required")
	}

	roleName, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}

	return s.repository.CreateDispute(ctx, userID, roleName, req)
}

func (s *Service) CreateAdminDispute(ctx context.Context, actorUserID int64, actorRoleID int, req AdminCreateDisputeRequest) (*CreateDisputeResponse, error) {
	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.SourceChannel = strings.TrimSpace(req.SourceChannel)
	req.ReportedByRole = strings.TrimSpace(req.ReportedByRole)

	if req.IssueTypeID <= 0 {
		return nil, errors.New("issue_type_id is required")
	}
	if req.Description == "" {
		return nil, errors.New("description is required")
	}
	if req.SourceChannel == "" {
		req.SourceChannel = "admin_panel"
	}
	switch req.SourceChannel {
	case "admin_panel", "call_center", "whatsapp", "email", "api", "system":
	default:
		return nil, errors.New("unsupported source_channel")
	}
	if req.ReportedByRole == "" {
		return nil, errors.New("reported_by_role is required")
	}
	if !isAllowedCaseRole(req.ReportedByRole) {
		return nil, errors.New("unsupported reported_by_role")
	}

	actionByRole, err := mapRoleIDToCaseRole(actorRoleID)
	if err != nil {
		return nil, err
	}

	return s.repository.CreateAdminDispute(ctx, actorUserID, actionByRole, req)
}

func (s *Service) GetAdminDisputeOptions(ctx context.Context) (*AdminDisputeOptionsResponse, error) {
	return &AdminDisputeOptionsResponse{
		ReporterRoles: []DisputeRoleOption{
			{Code: "retailer", Label: "Retailer"},
			{Code: "wholesaler", Label: "Wholesaler"},
			{Code: "driver", Label: "Driver"},
			{Code: "customer", Label: "Customer"},
		},
		AssigneeRoles: []DisputeRoleOption{
			{Code: "admin", Label: "Admin"},
			{Code: "ops_l1", Label: "Ops L1"},
			{Code: "ops_l2", Label: "Ops L2"},
			{Code: "finance", Label: "Finance"},
		},
		SourceChannels: []DisputeRoleOption{
			{Code: "admin_panel", Label: "Admin Panel"},
			{Code: "call_center", Label: "Call Center"},
			{Code: "whatsapp", Label: "WhatsApp"},
			{Code: "email", Label: "Email"},
			{Code: "api", Label: "API"},
			{Code: "system", Label: "System"},
		},
	}, nil
}

func (s *Service) ListAdminDisputeUsers(ctx context.Context, filter DisputeUserFilter) ([]DisputeUserOption, error) {
	filter.Role = strings.TrimSpace(filter.Role)
	filter.Q = strings.TrimSpace(filter.Q)
	if filter.Role == "" {
		return nil, errors.New("role is required")
	}
	if !isAllowedCaseRole(filter.Role) {
		return nil, errors.New("unsupported role")
	}
	return s.repository.ListAdminDisputeUsers(ctx, filter)
}

func (s *Service) SearchAdminDisputeOrders(ctx context.Context, filter AdminOrderSearchFilter) (*AdminOrderSearchResponse, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	filter.Phone = strings.TrimSpace(filter.Phone)
	if filter.Phone == "" && filter.OrderID == nil {
		return nil, errors.New("phone or order_id is required")
	}
	return s.repository.SearchAdminDisputeOrders(ctx, filter)
}

func (s *Service) GetAdminDisputeOrderContext(ctx context.Context, orderID int64) (*AdminOrderContext, error) {
	if orderID <= 0 {
		return nil, errors.New("order_id is required")
	}
	return s.repository.GetAdminDisputeOrderContext(ctx, orderID)
}

func (s *Service) ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	return s.repository.ListDisputes(ctx, filter)
}

func (s *Service) GetAdminDisputeSummary(ctx context.Context) (*AdminDisputeSummary, error) {
	return s.repository.GetAdminDisputeSummary(ctx)
}

func (s *Service) ListAdminDisputeFollowups(ctx context.Context, filter AdminDisputeFollowupFilter) (*AdminDisputeFollowupResponse, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	filter.Bucket = strings.TrimSpace(filter.Bucket)
	filter.AssignedRole = strings.TrimSpace(filter.AssignedRole)
	return s.repository.ListAdminDisputeFollowups(ctx, filter)
}

func (s *Service) ListAdminDisputes(ctx context.Context, filter AdminDisputeListFilter) ([]AdminDisputeListItem, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	filter.Status = strings.TrimSpace(filter.Status)
	filter.Priority = strings.TrimSpace(filter.Priority)
	filter.Severity = strings.TrimSpace(filter.Severity)
	filter.SourceChannel = strings.TrimSpace(filter.SourceChannel)
	filter.AssignedRole = strings.TrimSpace(filter.AssignedRole)
	filter.DueState = strings.TrimSpace(filter.DueState)
	return s.repository.ListAdminDisputes(ctx, filter)
}

func (s *Service) GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.GetDisputeByID(ctx, caseID, userID, roleID)
}

func (s *Service) GetAdminDisputeWorkbench(ctx context.Context, caseID int64) (*AdminDisputeWorkbench, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.GetAdminDisputeWorkbench(ctx, caseID)
}

func (s *Service) ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.ListDisputeActions(ctx, caseID, userID, roleID)
}

func (s *Service) AddAdminDisputeAction(ctx context.Context, caseID int64, userID int64, roleID int, req AdminAddDisputeActionRequest) (*AddDisputeActionResponse, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}

	req.ActionType = strings.TrimSpace(req.ActionType)
	req.Note = strings.TrimSpace(req.Note)
	req.StatusTo = strings.TrimSpace(req.StatusTo)
	req.NextStepType = strings.TrimSpace(req.NextStepType)
	req.NextStepRole = strings.TrimSpace(req.NextStepRole)

	if req.ActionType == "" {
		return nil, errors.New("action_type is required")
	}
	if !isAllowedAdminActionType(req.ActionType) {
		return nil, errors.New("unsupported action_type")
	}

	if req.StatusTo == "" {
		switch req.ActionType {
		case "resolved", "closed", "cancelled":
			req.StatusTo = req.ActionType
		}
	}

	currentStatus, err := s.repository.GetAdminDisputeStatus(ctx, caseID)
	if err != nil {
		return nil, err
	}
	if isTerminalStatus(currentStatus) && req.StatusTo != "" {
		return nil, errors.New("terminal cases cannot transition further")
	}
	if req.StatusTo != "" && !isValidStatusTransition(currentStatus, req.StatusTo) {
		return nil, errors.New("invalid status transition")
	}

	hasNextStepPayload := req.NextStepType != "" || req.NextStepDueAt != nil || req.NextStepRole != "" || req.NextStepUserID != nil
	if hasNextStepPayload {
		if req.NextStepType == "" {
			return nil, errors.New("next_step_type is required when next step fields are sent")
		}
		if !isAllowedNextStepType(req.NextStepType) {
			return nil, errors.New("unsupported next_step_type")
		}
		if req.NextStepUserID != nil && req.NextStepRole == "" {
			return nil, errors.New("next_step_role is required when next_step_user_id is sent")
		}
		if req.NextStepRole != "" && !isAllowedCaseRole(req.NextStepRole) {
			return nil, errors.New("unsupported next_step_role")
		}
	}

	actionByRole, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}
	return s.repository.AddAdminDisputeAction(ctx, caseID, userID, actionByRole, req)
}

func (s *Service) AssignAdminDispute(ctx context.Context, caseID int64, userID int64, roleID int, req AssignDisputeRequest) error {
	if caseID <= 0 {
		return errors.New("invalid case id")
	}

	req.CurrentAssigneeRole = strings.TrimSpace(req.CurrentAssigneeRole)
	if req.CurrentAssigneeRole == "" {
		return errors.New("current_assignee_role is required")
	}
	if !isAllowedAdminAssigneeRole(req.CurrentAssigneeRole) {
		return errors.New("unsupported current_assignee_role")
	}

	actionByRole, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return err
	}
	return s.repository.AssignAdminDispute(ctx, caseID, userID, actionByRole, req)
}

func (s *Service) UpsertAdminDisputeResolution(ctx context.Context, caseID int64, userID int64, roleID int, req UpsertDisputeResolutionRequest) (*DisputeResolutionSummary, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}

	req.OutcomeCode = strings.TrimSpace(req.OutcomeCode)
	req.DecisionSummary = strings.TrimSpace(req.DecisionSummary)
	req.LiablePartyRole = strings.TrimSpace(req.LiablePartyRole)
	req.OpsActionInstructions = strings.TrimSpace(req.OpsActionInstructions)
	req.FinanceActionInstructions = strings.TrimSpace(req.FinanceActionInstructions)
	req.CustomerCommunicationInstructions = strings.TrimSpace(req.CustomerCommunicationInstructions)
	req.StatusTo = strings.TrimSpace(req.StatusTo)

	if req.OutcomeCode == "" {
		return nil, errors.New("outcome_code is required")
	}
	if req.DecisionSummary == "" {
		return nil, errors.New("decision_summary is required")
	}
	if req.LiablePartyRole != "" && !isAllowedCaseRole(req.LiablePartyRole) {
		return nil, errors.New("unsupported liable_party_role")
	}

	checkNonNegative := func(value *float64, field string) error {
		if value != nil && *value < 0 {
			return errors.New(field + " must be zero or greater")
		}
		return nil
	}
	if err := checkNonNegative(req.DisputedAmount, "disputed_amount"); err != nil {
		return nil, err
	}
	if err := checkNonNegative(req.ApprovedAmount, "approved_amount"); err != nil {
		return nil, err
	}
	if err := checkNonNegative(req.RefundAmount, "refund_amount"); err != nil {
		return nil, err
	}
	if err := checkNonNegative(req.PenaltyAmount, "penalty_amount"); err != nil {
		return nil, err
	}
	if err := checkNonNegative(req.CompensationAmount, "compensation_amount"); err != nil {
		return nil, err
	}

	if req.StatusTo != "" {
		currentStatus, err := s.repository.GetAdminDisputeStatus(ctx, caseID)
		if err != nil {
			return nil, err
		}
		if isTerminalStatus(currentStatus) {
			return nil, errors.New("terminal cases cannot transition further")
		}
		if !isValidStatusTransition(currentStatus, req.StatusTo) {
			return nil, errors.New("invalid status transition")
		}
	}

	actionByRole, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}
	return s.repository.UpsertAdminDisputeResolution(ctx, caseID, userID, actionByRole, req)
}

func (s *Service) AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int, fileHeader *multipart.FileHeader, req AddDisputeEvidenceRequest) (*DisputeEvidence, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}

	roleName, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}

	req.Caption = strings.TrimSpace(req.Caption)
	req.CaptureSource = strings.TrimSpace(strings.ToLower(req.CaptureSource))
	if req.CaptureSource == "" {
		req.CaptureSource = "camera"
	}
	switch req.CaptureSource {
	case "camera":
	default:
		return nil, errors.New("capture_source must be camera")
	}

	if (req.CapturedLatitude == nil) != (req.CapturedLongitude == nil) {
		return nil, errors.New("captured_latitude and captured_longitude must be sent together")
	}
	if req.CapturedLatitude != nil {
		if *req.CapturedLatitude < -90 || *req.CapturedLatitude > 90 {
			return nil, errors.New("captured_latitude must be between -90 and 90")
		}
		if *req.CapturedLongitude < -180 || *req.CapturedLongitude > 180 {
			return nil, errors.New("captured_longitude must be between -180 and 180")
		}
	}

	saved, err := saveTemporaryEvidenceImage(caseID, fileHeader)
	if err != nil {
		return nil, err
	}

	return s.repository.AddDisputeEvidence(ctx, caseID, userID, roleName, saved.FileName, saved.MimeType, saved.FileStorageKey, req)
}

func (s *Service) ReplaceDisputeEvidence(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int, fileHeader *multipart.FileHeader, req AddDisputeEvidenceRequest) (*DisputeEvidence, error) {
	if caseID <= 0 || evidenceID <= 0 {
		return nil, errors.New("invalid evidence request")
	}

	roleName, err := mapRoleIDToCaseRole(roleID)
	if err != nil {
		return nil, err
	}

	req.Caption = strings.TrimSpace(req.Caption)
	req.CaptureSource = strings.TrimSpace(strings.ToLower(req.CaptureSource))
	if req.CaptureSource == "" {
		req.CaptureSource = "camera"
	}
	switch req.CaptureSource {
	case "camera":
	default:
		return nil, errors.New("capture_source must be camera")
	}

	if (req.CapturedLatitude == nil) != (req.CapturedLongitude == nil) {
		return nil, errors.New("captured_latitude and captured_longitude must be sent together")
	}
	if req.CapturedLatitude != nil {
		if *req.CapturedLatitude < -90 || *req.CapturedLatitude > 90 {
			return nil, errors.New("captured_latitude must be between -90 and 90")
		}
		if *req.CapturedLongitude < -180 || *req.CapturedLongitude > 180 {
			return nil, errors.New("captured_longitude must be between -180 and 180")
		}
	}

	saved, err := saveTemporaryEvidenceImage(caseID, fileHeader)
	if err != nil {
		return nil, err
	}

	replaced, err := s.repository.ReplaceDisputeEvidence(ctx, caseID, evidenceID, userID, roleName, saved.FileName, saved.MimeType, saved.FileStorageKey, req)
	if err != nil {
		_ = removeStoredEvidenceFile(saved.FileStorageKey)
		return nil, err
	}

	if replaced.PreviousStorageKey != "" && replaced.PreviousStorageKey != saved.FileStorageKey {
		_ = removeStoredEvidenceFile(replaced.PreviousStorageKey)
	}

	return replaced.Item, nil
}

func (s *Service) ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.ListDisputeEvidence(ctx, caseID, userID, roleID)
}

func (s *Service) GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error) {
	if caseID <= 0 || evidenceID <= 0 {
		return nil, errors.New("invalid evidence request")
	}
	return s.repository.GetDisputeEvidenceFile(ctx, caseID, evidenceID, userID, roleID)
}

func mapRoleIDToCaseRole(roleID int) (string, error) {
	switch roleID {
	case 1:
		return "admin", nil
	case 2:
		return "wholesaler", nil
	case 3:
		return "retailer", nil
	case 4:
		return "driver", nil
	case 5:
		return "customer", nil
	case 6:
		return "ops_l1", nil
	case 7:
		return "ops_l2", nil
	case 8:
		return "finance", nil
	default:
		return "", errors.New("unsupported role")
	}
}

var _ ServiceInterface = (*Service)(nil)
