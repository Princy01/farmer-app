package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
	commonverification "farmerapp/internal/common/verification"

	"github.com/jackc/pgx/v5"
)

const (
	branchLocationVerificationPending      = "pending_verification"
	branchLocationVerificationManualReview = "manual_review"
	branchLocationVerificationVerified     = "verified"
	branchLocationVerificationRejected     = "rejected"
)

func (r *AdminRepository) UpdateDriverDocumentVerification(driverID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeDriverVerificationStatus(req.Status)
	if status != commonverification.DriverVerificationPendingReview &&
		status != commonverification.DriverVerificationVerified &&
		status != commonverification.DriverVerificationRejected {
		return nil, fmt.Errorf("invalid document verification status")
	}

	var registrationComplete bool
	if err := db.Pool.QueryRow(context.Background(), `
		SELECT transport_schema.check_driver_registration_complete($1)
		FROM transport_schema.driver_info
		WHERE id = $1
	`, driverID).Scan(&registrationComplete); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, fmt.Errorf("failed to load driver onboarding state: %w", err)
	}
	if status == commonverification.DriverVerificationVerified && !registrationComplete {
		return nil, fmt.Errorf("driver registration is incomplete")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = defaultDriverDocumentVerificationNote(status)
	}

	var verifiedAt *time.Time
	var verifiedBy *int64
	err := db.Pool.QueryRow(context.Background(), `
		UPDATE transport_schema.driver_info
		SET
			document_verification_status = $2::varchar(30),
			document_verified_at = CASE
				WHEN $2::varchar(30) = 'verified' THEN COALESCE(document_verified_at, NOW())
				ELSE NULL
			END,
			document_verified_by = CASE
				WHEN $2::varchar(30) = 'verified' THEN $3::integer
				ELSE NULL
			END,
			document_verification_notes = $4::text
		WHERE id = $1
		RETURNING document_verified_at, document_verified_by
	`, driverID, status, actorUserID, note).Scan(&verifiedAt, &verifiedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}

	if err := commonverification.SyncDriverOnboardingVerificationStatus(context.Background(), driverID); err != nil {
		return nil, err
	}

	return &models.VerificationStatusUpdateResponse{
		EntityID:          driverID,
		VerificationStage: "driver_document",
		Status:            status,
		Notes:             note,
		VerifiedAt:        verifiedAt,
		VerifiedByUserID:  verifiedBy,
	}, nil
}

func (r *AdminRepository) UpdateDriverPhysicalVerification(driverID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeDriverVerificationStatus(req.Status)
	if status != commonverification.DriverVerificationPendingReview &&
		status != commonverification.DriverVerificationVerified &&
		status != commonverification.DriverVerificationRejected {
		return nil, fmt.Errorf("invalid physical verification status")
	}

	var documentStatus string
	if err := db.Pool.QueryRow(context.Background(), `
		SELECT COALESCE(document_verification_status, 'pending_documents')
		FROM transport_schema.driver_info
		WHERE id = $1
	`, driverID).Scan(&documentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, fmt.Errorf("failed to load driver document verification state: %w", err)
	}
	if status == commonverification.DriverVerificationVerified &&
		commonverification.NormalizeDriverVerificationStatus(documentStatus) != commonverification.DriverVerificationVerified {
		return nil, fmt.Errorf("driver documents must be verified before physical verification can be completed")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = defaultDriverPhysicalVerificationNote(status)
	}

	var verifiedAt *time.Time
	var verifiedBy *int64
	err := db.Pool.QueryRow(context.Background(), `
		UPDATE transport_schema.driver_info
		SET
			physical_verification_status = $2::varchar(30),
			physical_verified_at = CASE
				WHEN $2::varchar(30) = 'verified' THEN COALESCE(physical_verified_at, NOW())
				ELSE NULL
			END,
			physical_verified_by = CASE
				WHEN $2::varchar(30) = 'verified' THEN $3::integer
				ELSE NULL
			END,
			physical_verification_notes = $4::text
		WHERE id = $1
		RETURNING physical_verified_at, physical_verified_by
	`, driverID, status, actorUserID, note).Scan(&verifiedAt, &verifiedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}

	if err := commonverification.SyncDriverOnboardingVerificationStatus(context.Background(), driverID); err != nil {
		return nil, err
	}

	return &models.VerificationStatusUpdateResponse{
		EntityID:          driverID,
		VerificationStage: "driver_physical",
		Status:            status,
		Notes:             note,
		VerifiedAt:        verifiedAt,
		VerifiedByUserID:  verifiedBy,
	}, nil
}

func (r *AdminRepository) UpdateBranchDocumentVerification(branchID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeBranchDocumentVerificationStatus(req.Status)
	if status != commonverification.BranchDocumentVerificationPendingReview &&
		status != commonverification.BranchDocumentVerificationVerified &&
		status != commonverification.BranchDocumentVerificationRejected {
		return nil, fmt.Errorf("invalid branch document verification status")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = commonverification.DefaultBranchDocumentVerificationNote(status)
	}

	var verifiedAt *time.Time
	var verifiedBy *int64
	err := db.Pool.QueryRow(context.Background(), `
		UPDATE admin_schema.business_branch_table
		SET
			document_verification_status = $2::varchar(30),
			document_verified_at = CASE
				WHEN $2::varchar(30) = 'verified' THEN COALESCE(document_verified_at, NOW())
				ELSE NULL
			END,
			document_verified_by = CASE
				WHEN $2::varchar(30) = 'verified' THEN $3::integer
				ELSE NULL
			END,
			document_verification_notes = $4::text,
			updated_at = NOW()
		WHERE b_branch_id = $1
		RETURNING document_verified_at, document_verified_by
	`, branchID, status, actorUserID, note).Scan(&verifiedAt, &verifiedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}

	return &models.VerificationStatusUpdateResponse{
		EntityID:          branchID,
		VerificationStage: "branch_document",
		Status:            status,
		Notes:             note,
		VerifiedAt:        verifiedAt,
		VerifiedByUserID:  verifiedBy,
	}, nil
}

func (r *AdminRepository) UpdateBranchLocationVerification(branchID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := normalizeBranchLocationVerificationStatus(req.Status)
	if status == "" {
		return nil, fmt.Errorf("invalid branch location verification status")
	}

	if status == branchLocationVerificationVerified {
		var hasCapture bool
		if err := db.Pool.QueryRow(context.Background(), `
			SELECT COALESCE(image, '') <> ''
			   AND latitude IS NOT NULL
			   AND longitude IS NOT NULL
			   AND latitude <> 0
			   AND longitude <> 0
			FROM admin_schema.business_branch_table
			WHERE b_branch_id = $1
		`, branchID).Scan(&hasCapture); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, err
			}
			return nil, err
		}
		if !hasCapture {
			return nil, fmt.Errorf("branch location evidence is incomplete")
		}
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = defaultBranchLocationVerificationNote(status)
	}

	var verifiedAt *time.Time
	var verifiedBy *int64
	err := db.Pool.QueryRow(context.Background(), `
		UPDATE admin_schema.business_branch_table
		SET
			location_verification_status = $2::varchar(30),
			location_verified_at = CASE
				WHEN $2::varchar(30) = 'verified' THEN COALESCE(location_verified_at, NOW())
				ELSE NULL
			END,
			location_verified_by = CASE
				WHEN $2::varchar(30) = 'verified' THEN $3::integer
				ELSE NULL
			END,
			location_verification_notes = $4::text,
			updated_at = NOW()
		WHERE b_branch_id = $1
		RETURNING location_verified_at, location_verified_by
	`, branchID, status, actorUserID, note).Scan(&verifiedAt, &verifiedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}

	return &models.VerificationStatusUpdateResponse{
		EntityID:          branchID,
		VerificationStage: "branch_location",
		Status:            status,
		Notes:             note,
		VerifiedAt:        verifiedAt,
		VerifiedByUserID:  verifiedBy,
	}, nil
}

func (r *AdminRepository) UpdateBuyerPANVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeBusinessVerificationStatus(req.Status)
	if status != commonverification.BusinessVerificationPendingReview &&
		status != commonverification.BusinessVerificationVerified &&
		status != commonverification.BusinessVerificationRejected {
		return nil, fmt.Errorf("invalid buyer pan verification status")
	}

	target, err := loadBusinessVerificationTarget(context.Background(), businessID)
	if err != nil {
		return nil, err
	}
	if target.BusinessTypeID != commonverification.RetailerBusinessTypeID {
		return nil, fmt.Errorf("buyer business not found")
	}
	if strings.TrimSpace(target.PANNumber) == "" {
		return nil, fmt.Errorf("buyer pan is missing")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = commonverification.DefaultBuyerPANVerificationNote(status)
	}

	return updateBusinessVerificationStage(
		context.Background(),
		businessID,
		actorUserID,
		status,
		note,
		"buyer_pan",
		"pan_verification_status",
		"pan_verified_at",
		"pan_verified_by",
		"pan_verification_notes",
	)
}

func (r *AdminRepository) UpdateBuyerAadhaarVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeBusinessVerificationStatus(req.Status)
	if status != commonverification.BusinessVerificationPendingReview &&
		status != commonverification.BusinessVerificationVerified &&
		status != commonverification.BusinessVerificationRejected {
		return nil, fmt.Errorf("invalid buyer aadhaar verification status")
	}

	target, err := loadBusinessVerificationTarget(context.Background(), businessID)
	if err != nil {
		return nil, err
	}
	if target.BusinessTypeID != commonverification.RetailerBusinessTypeID {
		return nil, fmt.Errorf("buyer business not found")
	}
	if strings.TrimSpace(target.AadhaarNumber) == "" {
		return nil, fmt.Errorf("buyer aadhaar is missing")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = commonverification.DefaultBuyerAadhaarVerificationNote(status)
	}

	return updateBusinessVerificationStage(
		context.Background(),
		businessID,
		actorUserID,
		status,
		note,
		"buyer_aadhaar",
		"aadhaar_verification_status",
		"aadhaar_verified_at",
		"aadhaar_verified_by",
		"aadhaar_verification_notes",
	)
}

func (r *AdminRepository) UpdateWholesalerLicenseVerification(businessID int64, actorUserID int64, req models.VerificationStatusUpdateRequest) (*models.VerificationStatusUpdateResponse, error) {
	status := commonverification.NormalizeBusinessVerificationStatus(req.Status)
	if status != commonverification.BusinessVerificationPendingReview &&
		status != commonverification.BusinessVerificationVerified &&
		status != commonverification.BusinessVerificationRejected {
		return nil, fmt.Errorf("invalid wholesaler license verification status")
	}

	target, err := loadBusinessVerificationTarget(context.Background(), businessID)
	if err != nil {
		return nil, err
	}
	if !commonverification.IsWholesalerBusinessType(target.BusinessTypeID) {
		return nil, fmt.Errorf("wholesaler business not found")
	}
	if strings.TrimSpace(target.GovernmentLicenseNumber) == "" {
		return nil, fmt.Errorf("wholesaler government license is missing")
	}

	note := strings.TrimSpace(req.Notes)
	if note == "" {
		note = commonverification.DefaultWholesalerLicenseVerificationNote(status)
	}

	return updateBusinessVerificationStage(
		context.Background(),
		businessID,
		actorUserID,
		status,
		note,
		"wholesaler_license",
		"government_license_verification_status",
		"government_license_verified_at",
		"government_license_verified_by",
		"government_license_verification_notes",
	)
}

type businessVerificationTarget struct {
	BusinessTypeID          int64
	PANNumber               string
	AadhaarNumber           string
	GovernmentLicenseNumber string
}

func loadBusinessVerificationTarget(ctx context.Context, businessID int64) (*businessVerificationTarget, error) {
	var target businessVerificationTarget
	err := db.Pool.QueryRow(ctx, `
		SELECT
			COALESCE(b_type_id, 0),
			COALESCE(pan_number, ''),
			COALESCE(aadhaar_number, ''),
			COALESCE(government_license_number, '')
		FROM admin_schema.business_table
		WHERE bid = $1
	`, businessID).Scan(
		&target.BusinessTypeID,
		&target.PANNumber,
		&target.AadhaarNumber,
		&target.GovernmentLicenseNumber,
	)
	if err != nil {
		return nil, err
	}
	return &target, nil
}

func updateBusinessVerificationStage(
	ctx context.Context,
	businessID int64,
	actorUserID int64,
	status string,
	note string,
	stage string,
	statusColumn string,
	verifiedAtColumn string,
	verifiedByColumn string,
	notesColumn string,
) (*models.VerificationStatusUpdateResponse, error) {
	query := fmt.Sprintf(`
		UPDATE admin_schema.business_table
		SET
			%[1]s = $2::varchar(30),
			%[2]s = CASE
				WHEN $2::varchar(30) = 'verified' THEN COALESCE(%[2]s, NOW())
				ELSE NULL
			END,
			%[3]s = CASE
				WHEN $2::varchar(30) = 'verified' THEN $3::integer
				ELSE NULL
			END,
			%[4]s = $4::text,
			updated_at = NOW()
		WHERE bid = $1
		RETURNING %[2]s, %[3]s
	`, statusColumn, verifiedAtColumn, verifiedByColumn, notesColumn)

	var verifiedAt *time.Time
	var verifiedBy *int64
	if err := db.Pool.QueryRow(ctx, query, businessID, status, actorUserID, note).Scan(&verifiedAt, &verifiedBy); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		return nil, err
	}

	return &models.VerificationStatusUpdateResponse{
		EntityID:          businessID,
		VerificationStage: stage,
		Status:            status,
		Notes:             note,
		VerifiedAt:        verifiedAt,
		VerifiedByUserID:  verifiedBy,
	}, nil
}

func normalizeBranchLocationVerificationStatus(raw string) string {
	switch strings.TrimSpace(strings.ToLower(raw)) {
	case branchLocationVerificationPending:
		return branchLocationVerificationPending
	case branchLocationVerificationManualReview:
		return branchLocationVerificationManualReview
	case branchLocationVerificationVerified:
		return branchLocationVerificationVerified
	case branchLocationVerificationRejected:
		return branchLocationVerificationRejected
	default:
		return ""
	}
}

func defaultDriverDocumentVerificationNote(status string) string {
	switch commonverification.NormalizeDriverVerificationStatus(status) {
	case commonverification.DriverVerificationVerified:
		return "Driver documents are verified."
	case commonverification.DriverVerificationRejected:
		return "Driver documents were rejected. Update the submitted details and request review again."
	default:
		return "Driver documents are awaiting ops review."
	}
}

func defaultDriverPhysicalVerificationNote(status string) string {
	switch commonverification.NormalizeDriverVerificationStatus(status) {
	case commonverification.DriverVerificationVerified:
		return "Driver physical verification is complete."
	case commonverification.DriverVerificationRejected:
		return "Driver physical verification was rejected. Resolve the review remarks and request verification again."
	default:
		return "Driver is awaiting physical verification before live jobs are enabled."
	}
}

func defaultBranchLocationVerificationNote(status string) string {
	switch normalizeBranchLocationVerificationStatus(status) {
	case branchLocationVerificationVerified:
		return "Branch location is verified."
	case branchLocationVerificationRejected:
		return "Branch location verification was rejected. Re-submit location evidence and request review again."
	case branchLocationVerificationManualReview:
		return "Branch location requires manual review before the branch can operate live."
	default:
		return "Branch location is awaiting verification before the branch can operate live."
	}
}
