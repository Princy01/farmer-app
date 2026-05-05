package services

import (
	"context"
	"farmerapp/internal/admin/models"
	"farmerapp/internal/admin/repository"
	financepkg "farmerapp/internal/finance"
	"time"
)

type AdminService struct {
	repo        *repository.AdminRepository
	financeRepo *financepkg.Repository
}

const dashboardRefreshAfterSeconds = 300

func NewAdminService(repo *repository.AdminRepository) *AdminService {
	return &AdminService{
		repo:        repo,
		financeRepo: financepkg.NewRepository(),
	}
}

func (s *AdminService) GetDashboardSummary() (*models.DashboardSummary, error) {
	return s.repo.GetDashboardSummary()
}

func (s *AdminService) GetControlTowerSummary() (*models.ControlTowerSummary, error) {
	summary, err := s.repo.GetControlTowerSummary()
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) GetOpsDashboardSummary(actorUserID int64, actorRoleID int) (*models.OpsDashboardSummary, error) {
	summary, err := s.repo.GetOpsDashboardSummary(actorUserID, actorRoleID)
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) GetFinanceDashboardSummary(actorUserID int64, actorRoleID int) (*models.FinanceDashboardSummary, error) {
	summary, err := s.repo.GetFinanceDashboardSummary(actorUserID, actorRoleID)
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) GetOnboardingWatchSummary() (*models.OnboardingWatchSummary, error) {
	summary, err := s.repo.GetOnboardingWatchSummary()
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) ListOnboardingWatchItems(page, pageSize int, watchType, status string) (*models.OnboardingWatchListResponse, error) {
	return s.repo.ListOnboardingWatchItems(page, pageSize, watchType, status)
}

func (s *AdminService) GetTransportWatchSummary() (*models.TransportWatchSummary, error) {
	summary, err := s.repo.GetTransportWatchSummary()
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) ListTransportWatchItems(page, pageSize int, watchType string) (*models.TransportWatchListResponse, error) {
	return s.repo.ListTransportWatchItems(page, pageSize, watchType)
}

func (s *AdminService) GetPaymentWatchSummary() (*models.PaymentWatchSummary, error) {
	summary, err := s.repo.GetPaymentWatchSummary()
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&summary.DashboardRefreshMeta)
	return summary, nil
}

func (s *AdminService) ListPaymentWatchItems(page, pageSize int) (*models.PaymentWatchListResponse, error) {
	return s.repo.ListPaymentWatchItems(page, pageSize)
}

func (s *AdminService) GetPeerRatingDashboard(filter models.PeerRatingDashboardFilter) (*models.PeerRatingDashboardResponse, error) {
	return s.repo.GetPeerRatingDashboard(filter)
}

func (s *AdminService) GetPeerRatingContext(orderID int64, jobID *int64) (*models.PeerRatingContextResponse, error) {
	return s.repo.GetPeerRatingContext(orderID, jobID)
}

func (s *AdminService) CreatePeerRating(actorUserID int64, req models.PeerRatingSubmissionRequest) (*models.PeerRatingSubmissionResponse, error) {
	return s.repo.CreatePeerRating(actorUserID, req)
}

func (s *AdminService) GetTransporterOverview(driverID int64) (*models.TransporterOverview, error) {
	overview, err := s.repo.GetTransporterOverview(driverID)
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&overview.DashboardRefreshMeta)
	return overview, nil
}

func (s *AdminService) GetBuyerOverview(businessID int64) (*models.BuyerOverview, error) {
	overview, err := s.repo.GetBuyerOverview(businessID)
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&overview.DashboardRefreshMeta)
	return overview, nil
}

func (s *AdminService) GetWholesalerOverview(businessID int64) (*models.WholesalerOverview, error) {
	overview, err := s.repo.GetWholesalerOverview(businessID)
	if err != nil {
		return nil, err
	}
	applyDashboardRefreshMeta(&overview.DashboardRefreshMeta)
	return overview, nil
}

func (s *AdminService) UpdateTransporterDocumentVerification(driverID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateDriverDocumentVerification(driverID, actorUserID, req)
}

func (s *AdminService) UpdateTransporterPhysicalVerification(driverID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateDriverPhysicalVerification(driverID, actorUserID, req)
}

func (s *AdminService) UpdateBranchDocumentVerification(branchID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateBranchDocumentVerification(branchID, actorUserID, req)
}

func (s *AdminService) UpdateBranchLocationVerification(branchID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateBranchLocationVerification(branchID, actorUserID, req)
}

func (s *AdminService) UpdateBuyerPANVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateBuyerPANVerification(businessID, actorUserID, req)
}

func (s *AdminService) UpdateBuyerAadhaarVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateBuyerAadhaarVerification(businessID, actorUserID, req)
}

func (s *AdminService) UpdateWholesalerLicenseVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	return s.repo.UpdateWholesalerLicenseVerification(businessID, actorUserID, req)
}

func (s *AdminService) GetAllBusinesses() ([]models.BusinessListItem, error) {
	return s.repo.GetAllBusinesses()
}

func (s *AdminService) ListBranches(businessID *int64, branchID *int) ([]models.BranchListItem, error) {
	return s.repo.GetBranches(businessID, branchID)
}

func (s *AdminService) GetAllUsers() ([]models.UserListItem, error) {
	return s.repo.GetAllUsers()
}

func (s *AdminService) ToggleUserStatus(userID int) error {
	return s.repo.ToggleUserStatus(userID)
}

func (s *AdminService) ToggleBusinessStatus(businessID int64) error {
	return s.repo.ToggleBusinessStatus(businessID)
}

func (s *AdminService) ToggleBranchStatus(branchID int) error {
	return s.repo.ToggleBranchStatus(branchID)
}

func (s *AdminService) CreateDispute(d *models.Dispute) (int64, error) {
	return s.repo.CreateDispute(d)
}

func (s *AdminService) ListDisputes(status *string) ([]models.Dispute, error) {
	return s.repo.ListDisputes(status)
}

func (s *AdminService) AddDisputeAction(
	disputeID int64,
	userID int,
	roleID int,
	req models.DisputeActionRequest,
) error {
	return s.repo.AddDisputeAction(
		disputeID,
		userID,
		roleID,
		req.Action,
		req.Status,
		req.Remarks,
	)
}

func (s *AdminService) ListEscrows() ([]models.Escrow, error) {
	return s.repo.ListEscrows()
}

func (s *AdminService) UpdateEscrowStatus(escrowID int64, status string) error {
	return s.repo.UpdateEscrowStatus(escrowID, status)
}

func (s *AdminService) GetEscrowStatusSummary() ([]models.EscrowStatusReport, error) {
	return s.repo.GetEscrowStatusSummary()
}

func (s *AdminService) GetEscrowsHeldMoreThan(days int) ([]models.EscrowAgingReport, error) {
	return s.repo.GetEscrowsHeldMoreThan(days)
}

func (s *AdminService) GetPaymentErrors(orderID int64) ([]models.PaymentError, error) {
	return s.repo.GetPaymentErrors(orderID)
}

func (s *AdminService) ListFinanceAllocations(page, pageSize int, statuses []string) (*models.FinanceAllocationListResponse, error) {
	items, totalCount, err := s.financeRepo.ListSettlementAllocations(context.Background(), nil, statuses, page, pageSize)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	for index := range items {
		syncedItem, syncErr := s.financeRepo.SyncSettlementAllocationReleaseState(context.Background(), nil, items[index].AllocationID, now)
		if syncErr == nil && syncedItem != nil {
			items[index] = *syncedItem
		}
	}
	return &models.FinanceAllocationListResponse{
		PagingMeta: models.PagingMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
		},
		Items: items,
	}, nil
}

func (s *AdminService) HoldFinanceAllocation(allocationID int64, actorUserID int64, req models.FinanceAllocationActionRequest) (*financepkg.SettlementAllocation, error) {
	var reason *string
	if req.Reason != "" {
		reason = &req.Reason
	}
	var note *string
	if req.Note != "" {
		note = &req.Note
	}
	return s.financeRepo.HoldSettlementAllocation(context.Background(), nil, allocationID, actorUserID, reason, note)
}

func (s *AdminService) ReleaseFinanceAllocation(allocationID int64, actorUserID int64, req models.FinanceAllocationActionRequest) (*financepkg.SettlementAllocation, error) {
	syncedAllocation, err := s.financeRepo.SyncSettlementAllocationReleaseState(context.Background(), nil, allocationID, time.Now())
	if err != nil {
		return nil, err
	}
	if syncedAllocation.Status != financepkg.SettlementAllocationStatusReadyForRelease {
		return nil, financepkg.AllocationReleaseErrorMessage(*syncedAllocation)
	}

	var note *string
	if req.Note != "" {
		note = &req.Note
	}
	return s.financeRepo.ReleaseSettlementAllocation(context.Background(), nil, allocationID, actorUserID, note)
}

func (s *AdminService) ListFinanceExceptions(page, pageSize int, statuses []string) (*models.FinanceExceptionListResponse, error) {
	items, totalCount, err := s.financeRepo.ListFinanceExceptions(context.Background(), nil, statuses, page, pageSize)
	if err != nil {
		return nil, err
	}
	return &models.FinanceExceptionListResponse{
		PagingMeta: models.PagingMeta{
			Page:       page,
			PageSize:   pageSize,
			TotalCount: totalCount,
		},
		Items: items,
	}, nil
}

func (s *AdminService) UpdateFinanceExceptionStatus(exceptionID int64, actorUserID int64, req models.FinanceExceptionStatusUpdateRequest) (*financepkg.FinanceException, error) {
	status := req.Status
	resolvedAt := (*time.Time)(nil)
	if status == financepkg.FinanceExceptionStatusResolved || status == financepkg.FinanceExceptionStatusIgnored {
		now := time.Now()
		resolvedAt = &now
	}
	var note *string
	if req.Note != "" {
		note = &req.Note
	}
	return s.financeRepo.UpdateFinanceExceptionStatus(context.Background(), nil, financepkg.UpdateFinanceExceptionStatusParams{
		ExceptionID:      exceptionID,
		Status:           status,
		AssignedToUserID: &actorUserID,
		ResolutionNote:   note,
		ResolvedAt:       resolvedAt,
	})
}

func (s *AdminService) GetDailyTransactions(from, to string) ([]models.TransactionReport, error) {
	return s.repo.GetDailyTransactions(from, to)
}

func (s *AdminService) GetDailyRevenue(from, to string) ([]models.RevenueReport, error) {
	return s.repo.GetDailyRevenue(from, to)
}

func (s *AdminService) GetDailyDisputes(from, to string) ([]models.DisputeReport, error) {
	return s.repo.GetDailyDisputes(from, to)
}

func (s *AdminService) GetStuckOrders(days int) ([]models.StuckOrderReport, error) {
	return s.repo.GetStuckOrders(days)
}

func (s *AdminService) GetTopDisputedBusinesses(from, to string) ([]models.TopDisputedBusiness, error) {
	return s.repo.GetTopDisputedBusinesses(from, to)
}

func applyDashboardRefreshMeta(meta *models.DashboardRefreshMeta) {
	now := time.Now()
	meta.ServerTime = now
	meta.RefreshedAt = now
	meta.NextRefreshAfterSeconds = dashboardRefreshAfterSeconds
}
