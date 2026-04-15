package disputes

import (
	"context"
	"errors"
	"mime/multipart"
	"strings"
)

type ServiceInterface interface {
	ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error)
	CreateDispute(ctx context.Context, userID int64, roleID int, req CreateDisputeRequest) (*CreateDisputeResponse, error)
	ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error)
	GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error)
	ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error)
	AddDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int, fileHeader *multipart.FileHeader, req AddDisputeEvidenceRequest) (*DisputeEvidence, error)
	ListDisputeEvidence(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeEvidence, error)
	GetDisputeEvidenceFile(ctx context.Context, caseID int64, evidenceID int64, userID int64, roleID int) (*StoredEvidenceFile, error)
}

type Service struct {
	repository RepositoryInterface
}

func NewService(repository RepositoryInterface) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListIssueTypes(ctx context.Context, filter IssueTypeFilter) ([]IssueType, error) {
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

func (s *Service) ListDisputes(ctx context.Context, filter DisputeListFilter) ([]DisputeListItem, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 20
	}
	return s.repository.ListDisputes(ctx, filter)
}

func (s *Service) GetDisputeByID(ctx context.Context, caseID int64, userID int64, roleID int) (*DisputeCaseDetail, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.GetDisputeByID(ctx, caseID, userID, roleID)
}

func (s *Service) ListDisputeActions(ctx context.Context, caseID int64, userID int64, roleID int) ([]DisputeAction, error) {
	if caseID <= 0 {
		return nil, errors.New("invalid case id")
	}
	return s.repository.ListDisputeActions(ctx, caseID, userID, roleID)
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
	default:
		return "", errors.New("unsupported role")
	}
}

var _ ServiceInterface = (*Service)(nil)
