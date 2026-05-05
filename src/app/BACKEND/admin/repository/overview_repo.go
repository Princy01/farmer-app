package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
	commonratings "farmerapp/internal/common/ratings"
	commonverification "farmerapp/internal/common/verification"
	profilepkg "farmerapp/internal/profile"

	"github.com/jackc/pgx/v5"
)

func (r *AdminRepository) GetTransporterOverview(driverID int64) (*models.TransporterOverview, error) {
	ctx := context.Background()

	driverProfile, err := loadDriverProfile(ctx, driverID)
	if err != nil {
		return nil, err
	}

	overview := &models.TransporterOverview{
		Profile: models.TransporterProfileOverview{
			DriverID:       driverID,
			FullName:       strings.TrimSpace(strings.Join([]string{driverProfile.FirstName, driverProfile.LastName}, " ")),
			PhoneNumber:    driverProfile.ContactNum,
			AlternatePhone: driverProfile.ContactNumAddl,
			Email:          driverProfile.Email,
			Age:            deriveAge(driverProfile.DOB),
			CityOfOps:      driverProfile.AddressTown,
			Address: buildAddress(
				driverProfile.AddressDoorNo,
				driverProfile.AddressStreet,
				driverProfile.AddressTown,
				driverProfile.AddressState,
				driverProfile.AddressPinCode,
			),
			DateOfJoining: driverProfile.RegistrationDate,
			ActiveStatus:  driverProfile.ActiveStatus,
			ProfileImage:  driverProfile.ProfileImage,
		},
		Verification: models.TransporterVerificationOverview{
			LicenceNumber:       driverProfile.LicenceNo,
			LicenceType:         driverProfile.LicenceType,
			LicenceIssuedDate:   driverProfile.LicenceIssuedDate,
			LicenceExpiryDate:   driverProfile.LicenceExpiryDate,
			LicenceExpiringSoon: !driverProfile.LicenceExpiryDate.IsZero() && driverProfile.LicenceExpiryDate.Before(time.Now().AddDate(0, 0, 30)),
			MaskedPAN:           maskSensitiveValue(driverProfile.Pan, 4),
			MaskedAadhaar:       maskSensitiveValue(driverProfile.Aadhar, 4),
		},
		Vehicle: models.TransporterVehicleOverview{
			VehicleNumber: driverProfile.VehNumber,
			VehicleState:  driverProfile.VehicleState,
			VehicleTypeID: driverProfile.TypeID,
			RegDate:       driverProfile.RegDate,
			LoadCapacity:  driverProfile.LoadCapacity,
			FuelType:      driverProfile.FuelType,
		},
		Performance: models.TransporterPerformanceOverview{
			TripsCompleted: int64(driverProfile.TotalDeliveries),
		},
	}

	if err := db.Pool.QueryRow(ctx, `
		SELECT
			COALESCE(status, ''),
			COALESCE(onboarding_verification_status, 'pending_documents'),
			COALESCE(document_verification_status, 'pending_documents'),
			document_verified_at,
			document_verified_by,
			COALESCE(document_verification_notes, ''),
			COALESCE(physical_verification_status, 'pending_documents'),
			physical_verified_at,
			physical_verified_by,
			COALESCE(physical_verification_notes, ''),
			transport_schema.check_driver_registration_complete($1),
			COALESCE(onboarding_verification_notes, ''),
			onboarding_verified_at,
			onboarding_verified_by
		FROM transport_schema.driver_info
		WHERE id = $1
	`, driverID).Scan(
		&overview.Profile.DriverStatus,
		&overview.Verification.OnboardingStatus,
		&overview.Verification.DocumentVerificationStatus,
		&overview.Verification.DocumentVerifiedAt,
		&overview.Verification.DocumentVerifiedByUserID,
		&overview.Verification.DocumentVerificationNotes,
		&overview.Verification.PhysicalVerificationStatus,
		&overview.Verification.PhysicalVerifiedAt,
		&overview.Verification.PhysicalVerifiedByUserID,
		&overview.Verification.PhysicalVerificationNotes,
		&overview.Verification.RegistrationComplete,
		&overview.Verification.VerificationNotes,
		&overview.Verification.OnboardingVerifiedAt,
		&overview.Verification.OnboardingVerifiedByUserID,
	); err != nil {
		return nil, err
	}
	overview.Verification.CanActOnLiveJobs = overview.Verification.DocumentVerificationStatus == "verified" &&
		overview.Verification.PhysicalVerificationStatus == "verified"

	var (
		vehicleID    *int64
		vehicleMake  *string
		vehicleModel *string
		rcDocument   *string
		kmsTravelled *string
		loadCapacity *string
	)
	vehicleErr := db.Pool.QueryRow(ctx, `
		SELECT
			vehicle_id,
			veh_make,
			veh_model,
			rc_document,
			kms_travelled,
			load_capacity
		FROM transport_schema.get_driver_vehicles_by_driver_id($1)
		ORDER BY vehicle_id DESC
		LIMIT 1
	`, driverID).Scan(
		&vehicleID,
		&vehicleMake,
		&vehicleModel,
		&rcDocument,
		&kmsTravelled,
		&loadCapacity,
	)
	if vehicleErr != nil && !errors.Is(vehicleErr, pgx.ErrNoRows) {
		return nil, vehicleErr
	}
	if vehicleErr == nil {
		overview.Vehicle.VehicleID = vehicleID
		overview.Vehicle.VehicleMake = vehicleMake
		overview.Vehicle.VehicleModel = vehicleModel
		overview.Vehicle.RCDocument = rcDocument
		overview.Vehicle.KMSTravelled = kmsTravelled
		if overview.Vehicle.LoadCapacity == nil {
			overview.Vehicle.LoadCapacity = parseFloatPointer(loadCapacity)
		}
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH driver_jobs AS (
			SELECT DISTINCT ON (ta.job_id)
				ta.job_id,
				ta.delivery_status,
				COALESCE(tj.base_price, 0)::float8 AS base_price
			FROM transport_schema.trip_assignments ta
			JOIN transport_schema.transport_jobs tj ON tj.job_id = ta.job_id
			WHERE ta.driver_id = $1
			ORDER BY ta.job_id, ta.accepted_at DESC NULLS LAST, ta.assignment_id DESC
		)
		SELECT
			COUNT(*) FILTER (WHERE delivery_status IN ('pending', 'partially_picked', 'picked_up', 'disputed')) AS active_jobs,
			COALESCE(SUM(base_price) FILTER (WHERE delivery_status = 'delivered'), 0)::float8 AS money_earned
		FROM driver_jobs
	`, driverID).Scan(
		&overview.Performance.ActiveJobs,
		&overview.Performance.MoneyEarned,
	); err != nil {
		return nil, err
	}

	disputeQuery := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total_disputes,
			COUNT(*) FILTER (WHERE dc.status IN (%s)) AS open_disputes,
			COUNT(*) FILTER (WHERE COALESCE(dc.suspected_fraud, FALSE) = TRUE) AS suspected_fraud_cases,
			COUNT(*) FILTER (WHERE it.code = 'LOAD_MISMATCH') AS load_mismatch_issues,
			COUNT(*) FILTER (WHERE it.code IN ('GOODS_NOT_READY', 'UNLOADING_DELAY', 'PICKUP_LOCATION_ISSUE', 'DROP_LOCATION_ISSUE')) AS timing_issues,
			COUNT(*) FILTER (WHERE it.code IN ('RECEIVER_UNAVAILABLE', 'CUSTOMER_REFUSED_DELIVERY')) AS no_show_issues,
			COUNT(*) FILTER (WHERE it.code = 'RIDE_ISSUE') AS vehicle_mismatch_issues,
			0::bigint AS accident_issues,
			COUNT(*) FILTER (WHERE it.code = 'DOCUMENT_ISSUE') AS document_issues,
			COUNT(*) FILTER (WHERE it.code = 'DAMAGED_AT_PICKUP') AS damaged_at_pickup_issues,
			COUNT(*) FILTER (WHERE it.code = 'CUSTOMER_REFUSED_DELIVERY') AS customer_refused_delivery_issues,
			COUNT(*) FILTER (WHERE it.code = 'POD_CONFIRMATION_ISSUE') AS pod_confirmation_issues,
			COUNT(*) FILTER (WHERE it.code = 'RIDE_ISSUE') AS ride_issues
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		WHERE COALESCE(dc.driver_id, 0)::bigint = $1
		   OR (dc.raised_by_user_id = $1 AND dc.raised_by_role = 'driver')
	`, buildStatusPlaceholders(2, len(openDisputeStatuses)))

	disputeArgs := make([]interface{}, 0, 1+len(openDisputeStatuses))
	disputeArgs = append(disputeArgs, driverID)
	for _, status := range openDisputeStatuses {
		disputeArgs = append(disputeArgs, status)
	}

	if err := db.Pool.QueryRow(ctx, disputeQuery, disputeArgs...).Scan(
		&overview.Disputes.TotalDisputes,
		&overview.Disputes.OpenDisputes,
		&overview.Disputes.SuspectedFraudCases,
		&overview.Issues.LoadMismatchIssues,
		&overview.Issues.TimingIssues,
		&overview.Issues.NoShowIssues,
		&overview.Issues.VehicleMismatchIssues,
		&overview.Issues.AccidentIssues,
		&overview.Issues.DocumentIssues,
		&overview.Issues.DamagedAtPickupIssues,
		&overview.Issues.CustomerRefusedDeliveryIssues,
		&overview.Issues.PODConfirmationIssues,
		&overview.Issues.RideIssues,
	); err != nil {
		return nil, err
	}

	lastCompletedTripAt, err := r.getLatestDriverCompletedAt(ctx, driverID)
	if err != nil {
		return nil, err
	}

	overview.PeerRating, err = r.getPeerRatingOverview(ctx, "driver", driverID)
	if err != nil {
		return nil, err
	}

	overview.Rating = toEntityRatingOverview(commonratings.Driver(commonratings.DriverInput{
		TripsCompleted:        overview.Performance.TripsCompleted,
		OpenDisputes:          overview.Disputes.OpenDisputes,
		SuspectedFraudCases:   overview.Disputes.SuspectedFraudCases,
		LoadMismatchIssues:    overview.Issues.LoadMismatchIssues,
		NoShowIssues:          overview.Issues.NoShowIssues,
		VehicleMismatchIssues: overview.Issues.VehicleMismatchIssues,
		AccidentIssues:        overview.Issues.AccidentIssues,
		DocumentIssues:        overview.Issues.DocumentIssues,
		DamagedAtPickupIssues: overview.Issues.DamagedAtPickupIssues,
		PODConfirmationIssues: overview.Issues.PODConfirmationIssues,
		RideIssues:            overview.Issues.RideIssues,
		DocumentVerified:      overview.Verification.DocumentVerificationStatus == "verified",
		PhysicalVerified:      overview.Verification.PhysicalVerificationStatus == "verified",
		RegistrationComplete:  overview.Verification.RegistrationComplete,
		PublicRatingAverage:   overview.PeerRating.DisplayedAverageRating,
		PublicRatingCount:     overview.PeerRating.RatingCount,
		LastCompletedTripAt:   lastCompletedTripAt,
	}))

	return overview, nil
}

func (r *AdminRepository) GetBuyerOverview(businessID int64) (*models.BuyerOverview, error) {
	ctx := context.Background()

	profile, err := r.getBusinessEntityProfile(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview := &models.BuyerOverview{
		Profile: profile,
		Orders: models.BusinessOrdersOverview{
			LargeOrderThreshold: largeOrderThreshold,
		},
	}

	overview.Verification, err = r.getBusinessVerificationOverview(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview.Branches, err = r.getBusinessBranchVerificationOverview(ctx, businessID)
	if err != nil {
		return nil, err
	}

	if err := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total_orders,
			COALESCE(SUM(COALESCE(final_amount, total_order_amount, 0)), 0)::float8 AS total_amount,
			COALESCE(MAX(COALESCE(final_amount, total_order_amount, 0)), 0)::float8 AS max_order_value,
			COUNT(*) FILTER (WHERE COALESCE(final_amount, total_order_amount, 0) > $2) AS large_orders
		FROM business_schema.order_table
		WHERE retailer_id = $1
	`, businessID, largeOrderThreshold).Scan(
		&overview.Orders.TotalOrders,
		&overview.Orders.TotalAmount,
		&overview.Orders.MaxOrderValue,
		&overview.Orders.LargeOrders,
	); err != nil {
		return nil, err
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH retailer_wholesalers AS (
			SELECT
				wid.bid::bigint AS wholesaler_id,
				COALESCE(wt.b_owner_name, '') AS wholesaler_name,
				o.order_id
			FROM business_schema.order_table o
			LEFT JOIN LATERAL unnest(o.wholeseller_id) wid(bid) ON TRUE
			LEFT JOIN admin_schema.business_table wt ON wt.bid = wid.bid
			WHERE o.retailer_id = $1
		)
		SELECT wholesaler_id, wholesaler_name, COUNT(DISTINCT order_id) AS order_count
		FROM retailer_wholesalers
		WHERE wholesaler_id IS NOT NULL
		GROUP BY wholesaler_id, wholesaler_name
		ORDER BY COUNT(DISTINCT order_id) DESC, wholesaler_name ASC
		LIMIT 1
	`, businessID).Scan(
		&overview.Relationships.FrequentWholesalerID,
		&overview.Relationships.FrequentWholesalerName,
		&overview.Relationships.FrequentWholesalerOrders,
	); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		overview.Relationships = models.BuyerRelationshipOverview{}
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH retailer_wholesalers AS (
			SELECT
				wid.bid::bigint AS wholesaler_id,
				COALESCE(wt.b_owner_name, '') AS wholesaler_name,
				COALESCE(o.final_amount, o.total_order_amount, 0)::float8 AS order_amount
			FROM business_schema.order_table o
			LEFT JOIN LATERAL unnest(o.wholeseller_id) wid(bid) ON TRUE
			LEFT JOIN admin_schema.business_table wt ON wt.bid = wid.bid
			WHERE o.retailer_id = $1
		)
		SELECT wholesaler_id, wholesaler_name, COALESCE(SUM(order_amount), 0)::float8 AS total_amount
		FROM retailer_wholesalers
		WHERE wholesaler_id IS NOT NULL
		GROUP BY wholesaler_id, wholesaler_name
		ORDER BY total_amount DESC, wholesaler_name ASC
		LIMIT 1
	`, businessID).Scan(
		&overview.Relationships.MaxSpendWholesalerID,
		&overview.Relationships.MaxSpendWholesalerName,
		&overview.Relationships.MaxSpendWholesalerAmount,
	); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		overview.Relationships.MaxSpendWholesalerID = nil
		overview.Relationships.MaxSpendWholesalerName = ""
		overview.Relationships.MaxSpendWholesalerAmount = 0
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH payment_errors AS (
			SELECT
				o.order_id,
				MAX(pe.created_at) AS latest_error_at,
				COUNT(*) AS error_count
			FROM business_schema.order_table o
			JOIN LATERAL admin_schema.get_payment_errors(o.order_id) pe ON TRUE
			WHERE o.retailer_id = $1
			GROUP BY o.order_id
		)
		SELECT
			COALESCE(COUNT(*), 0) AS failed_orders,
			COALESCE(SUM(error_count), 0) AS failure_events,
			COALESCE(COUNT(*) FILTER (WHERE latest_error_at >= NOW() - INTERVAL '30 days'), 0) AS recent_failures_30_days
		FROM payment_errors
	`, businessID).Scan(
		&overview.Payments.FailedOrders,
		&overview.Payments.FailureEvents,
		&overview.Payments.RecentFailures30Days,
	); err != nil {
		overview.Payments = models.BuyerPaymentOverview{}
	}

	overview.Disputes, err = r.getBuyerDisputeOverview(ctx, businessID)
	if err != nil {
		overview.Disputes = models.EntityDisputeOverview{}
	}

	lastCompletedOrderAt, err := r.getLatestRetailerCompletedAt(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview.PeerRating, err = r.getPeerRatingOverview(ctx, "retailer", businessID)
	if err != nil {
		return nil, err
	}

	overview.Rating = toEntityRatingOverview(commonratings.Buyer(commonratings.BuyerInput{
		TotalOrders:             overview.Orders.TotalOrders,
		OpenDisputes:            overview.Disputes.OpenDisputes,
		SuspectedFraudCases:     overview.Disputes.SuspectedFraudCases,
		DeliveryMismatch:        overview.Disputes.DeliveryMismatch,
		NoShowIssues:            overview.Disputes.NoShowIssues,
		PaymentIssues:           overview.Disputes.PaymentIssues,
		FraudClaimIssues:        overview.Disputes.FraudClaimIssues,
		FailedOrders:            overview.Payments.FailedOrders,
		PANVerified:             overview.Verification.PANVerificationStatus == "verified",
		AadhaarVerified:         overview.Verification.AadhaarVerificationStatus == "verified",
		VerifiedBranchDocuments: overview.Branches.VerifiedBranchDocuments,
		VerifiedBranches:        overview.Branches.VerifiedBranches,
		TotalBranches:           overview.Branches.TotalBranches,
		PublicRatingAverage:     overview.PeerRating.DisplayedAverageRating,
		PublicRatingCount:       overview.PeerRating.RatingCount,
		LastCompletedOrderAt:    lastCompletedOrderAt,
	}))

	return overview, nil
}

func (r *AdminRepository) GetWholesalerOverview(businessID int64) (*models.WholesalerOverview, error) {
	ctx := context.Background()

	profile, err := r.getBusinessEntityProfile(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview := &models.WholesalerOverview{
		Profile: profile,
		Orders: models.BusinessOrdersOverview{
			LargeOrderThreshold: largeOrderThreshold,
		},
	}

	overview.Verification, err = r.getBusinessVerificationOverview(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview.Branches, err = r.getBusinessBranchVerificationOverview(ctx, businessID)
	if err != nil {
		return nil, err
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH wholesaler_orders AS (
			SELECT COALESCE(o.final_amount, o.total_order_amount, 0)::float8 AS order_amount
			FROM business_schema.order_table o
			WHERE EXISTS (
				SELECT 1
				FROM unnest(o.wholeseller_id) wid(bid)
				WHERE wid.bid::bigint = $1
			)
		)
		SELECT
			COUNT(*) AS total_orders,
			COALESCE(SUM(order_amount), 0)::float8 AS total_amount,
			COALESCE(MAX(order_amount), 0)::float8 AS max_order_value,
			COUNT(*) FILTER (WHERE order_amount > $2) AS large_orders
		FROM wholesaler_orders
	`, businessID, largeOrderThreshold).Scan(
		&overview.Orders.TotalOrders,
		&overview.Orders.TotalAmount,
		&overview.Orders.MaxOrderValue,
		&overview.Orders.LargeOrders,
	); err != nil {
		return nil, err
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH wholesaler_buyers AS (
			SELECT
				o.retailer_id::bigint AS buyer_id,
				COALESCE(rb.b_owner_name, '') AS buyer_name,
				o.order_id
			FROM business_schema.order_table o
			LEFT JOIN admin_schema.business_table rb ON rb.bid = o.retailer_id
			WHERE EXISTS (
				SELECT 1
				FROM unnest(o.wholeseller_id) wid(bid)
				WHERE wid.bid::bigint = $1
			)
		)
		SELECT buyer_id, buyer_name, COUNT(DISTINCT order_id) AS order_count
		FROM wholesaler_buyers
		WHERE buyer_id IS NOT NULL
		GROUP BY buyer_id, buyer_name
		ORDER BY COUNT(DISTINCT order_id) DESC, buyer_name ASC
		LIMIT 1
	`, businessID).Scan(
		&overview.Relationships.FrequentBuyerID,
		&overview.Relationships.FrequentBuyerName,
		&overview.Relationships.FrequentBuyerOrders,
	); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		overview.Relationships = models.WholesalerRelationshipOverview{}
	}

	if err := db.Pool.QueryRow(ctx, `
		WITH wholesaler_buyers AS (
			SELECT
				o.retailer_id::bigint AS buyer_id,
				COALESCE(rb.b_owner_name, '') AS buyer_name,
				COALESCE(o.final_amount, o.total_order_amount, 0)::float8 AS order_amount
			FROM business_schema.order_table o
			LEFT JOIN admin_schema.business_table rb ON rb.bid = o.retailer_id
			WHERE EXISTS (
				SELECT 1
				FROM unnest(o.wholeseller_id) wid(bid)
				WHERE wid.bid::bigint = $1
			)
		)
		SELECT buyer_id, buyer_name, COALESCE(SUM(order_amount), 0)::float8 AS total_amount
		FROM wholesaler_buyers
		WHERE buyer_id IS NOT NULL
		GROUP BY buyer_id, buyer_name
		ORDER BY total_amount DESC, buyer_name ASC
		LIMIT 1
	`, businessID).Scan(
		&overview.Relationships.MaxBuyerID,
		&overview.Relationships.MaxBuyerName,
		&overview.Relationships.MaxBuyerAmount,
	); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		overview.Relationships.MaxBuyerID = nil
		overview.Relationships.MaxBuyerName = ""
		overview.Relationships.MaxBuyerAmount = 0
	}

	overview.Disputes, err = r.getWholesalerDisputeOverview(ctx, businessID)
	if err != nil {
		overview.Disputes = models.EntityDisputeOverview{}
	}

	lastCompletedOrderAt, err := r.getLatestWholesalerCompletedAt(ctx, businessID)
	if err != nil {
		return nil, err
	}

	overview.PeerRating, err = r.getPeerRatingOverview(ctx, "wholesaler", businessID)
	if err != nil {
		return nil, err
	}

	overview.Rating = toEntityRatingOverview(commonratings.Wholesaler(commonratings.WholesalerInput{
		TotalOrders:          overview.Orders.TotalOrders,
		OpenDisputes:         overview.Disputes.OpenDisputes,
		SuspectedFraudCases:  overview.Disputes.SuspectedFraudCases,
		DeliveryMismatch:     overview.Disputes.DeliveryMismatch,
		NoShowIssues:         overview.Disputes.NoShowIssues,
		PaymentIssues:        overview.Disputes.PaymentIssues,
		FraudClaimIssues:     overview.Disputes.FraudClaimIssues,
		PublicRatingAverage:  overview.PeerRating.DisplayedAverageRating,
		PublicRatingCount:    overview.PeerRating.RatingCount,
		LastCompletedOrderAt: lastCompletedOrderAt,
	}))

	return overview, nil
}

func (r *AdminRepository) getBusinessEntityProfile(ctx context.Context, businessID int64) (models.BusinessEntityProfile, error) {
	query := `
		SELECT
			b.bid,
			COALESCE(b.b_owner_name, '') AS owner_name,
			COALESCE(b.b_registration_num, '') AS registration_number,
			COALESCE(b.address, '') AS address,
			COALESCE(mc.city_name, '') AS city_name,
			COALESCE(ms.state_name, '') AS state_name,
			COALESCE(b.mobile_number, '') AS mobile_number,
			COALESCE(b.email, '') AS email,
			COALESCE(b.gst_number, '') AS gst_number,
			COALESCE(b.pan_number, '') AS pan_number,
			b.created_at,
			COALESCE(b.is_active, FALSE) AS is_active
		FROM admin_schema.business_table b
		LEFT JOIN admin_schema.master_city mc ON mc.id = b.city_id
		LEFT JOIN admin_schema.master_states ms ON ms.id = b.state_id
		WHERE b.bid = $1
	`

	var (
		profile models.BusinessEntityProfile
		rawPAN  string
	)
	if err := db.Pool.QueryRow(ctx, query, businessID).Scan(
		&profile.BusinessID,
		&profile.OwnerName,
		&profile.RegistrationNumber,
		&profile.Address,
		&profile.CityName,
		&profile.StateName,
		&profile.MobileNumber,
		&profile.Email,
		&profile.GSTNumber,
		&rawPAN,
		&profile.DateOfJoining,
		&profile.ActiveStatus,
	); err != nil {
		return models.BusinessEntityProfile{}, err
	}
	profile.MaskedPAN = maskSensitiveValue(rawPAN, 4)
	return profile, nil
}

func (r *AdminRepository) getBusinessVerificationOverview(ctx context.Context, businessID int64) (models.BusinessVerificationOverview, error) {
	query := `
		SELECT
			COALESCE(b_type_id, 0),
			COALESCE(pan_number, ''),
			COALESCE(pan_verification_status, 'pending_documents'),
			pan_verified_at,
			pan_verified_by,
			COALESCE(pan_verification_notes, ''),
			COALESCE(aadhaar_number, ''),
			COALESCE(aadhaar_verification_status, 'pending_documents'),
			aadhaar_verified_at,
			aadhaar_verified_by,
			COALESCE(aadhaar_verification_notes, ''),
			COALESCE(government_license_number, ''),
			COALESCE(government_license_verification_status, 'pending_documents'),
			government_license_verified_at,
			government_license_verified_by,
			COALESCE(government_license_verification_notes, '')
		FROM admin_schema.business_table
		WHERE bid = $1
	`

	var (
		businessTypeID int64
		rawPAN         string
		rawAadhaar     string
		overview       models.BusinessVerificationOverview
	)
	if err := db.Pool.QueryRow(ctx, query, businessID).Scan(
		&businessTypeID,
		&rawPAN,
		&overview.PANVerificationStatus,
		&overview.PANVerifiedAt,
		&overview.PANVerifiedByUserID,
		&overview.PANVerificationNotes,
		&rawAadhaar,
		&overview.AadhaarVerificationStatus,
		&overview.AadhaarVerifiedAt,
		&overview.AadhaarVerifiedByUserID,
		&overview.AadhaarVerificationNotes,
		&overview.GovernmentLicenseNumber,
		&overview.GovernmentLicenseVerificationStatus,
		&overview.GovernmentLicenseVerifiedAt,
		&overview.GovernmentLicenseVerifiedByUserID,
		&overview.GovernmentLicenseVerificationNotes,
	); err != nil {
		return models.BusinessVerificationOverview{}, err
	}

	overview.MaskedPAN = maskSensitiveValue(rawPAN, 4)
	overview.MaskedAadhaar = maskSensitiveValue(rawAadhaar, 4)
	overview.PANVerificationStatus = commonverification.NormalizeBusinessVerificationStatus(overview.PANVerificationStatus)
	overview.AadhaarVerificationStatus = commonverification.NormalizeBusinessVerificationStatus(overview.AadhaarVerificationStatus)
	overview.GovernmentLicenseVerificationStatus = commonverification.NormalizeBusinessVerificationStatus(overview.GovernmentLicenseVerificationStatus)
	if businessTypeID == commonverification.RetailerBusinessTypeID {
		overview.CanPlaceLiveOrders = commonverification.BuyerCanPlaceLiveOrders(
			overview.PANVerificationStatus,
			overview.AadhaarVerificationStatus,
		)
	} else {
		overview.CanPlaceLiveOrders = true
	}

	return overview, nil
}

func (r *AdminRepository) getBusinessBranchVerificationOverview(ctx context.Context, businessID int64) (models.BusinessBranchVerificationOverview, error) {
	var summary models.BusinessBranchVerificationOverview
	err := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total_branches,
			COUNT(*) FILTER (WHERE COALESCE(active_status, FALSE) = TRUE) AS active_branches,
			COUNT(*) FILTER (WHERE COALESCE(document_verification_status, 'pending_review') = 'verified') AS verified_branch_documents,
			COUNT(*) FILTER (WHERE COALESCE(document_verification_status, 'pending_review') = 'pending_review') AS pending_branch_documents,
			COUNT(*) FILTER (WHERE COALESCE(document_verification_status, 'pending_review') = 'rejected') AS rejected_branch_documents,
			COUNT(*) FILTER (WHERE COALESCE(location_verification_status, 'pending_verification') = 'verified') AS verified_branches,
			COUNT(*) FILTER (WHERE COALESCE(location_verification_status, 'pending_verification') = 'pending_verification') AS pending_branch_verification,
			COUNT(*) FILTER (WHERE COALESCE(location_verification_status, 'pending_verification') = 'manual_review') AS manual_review_branches
		FROM admin_schema.business_branch_table
		WHERE bid = $1
	`, businessID).Scan(
		&summary.TotalBranches,
		&summary.ActiveBranches,
		&summary.VerifiedBranchDocuments,
		&summary.PendingBranchDocuments,
		&summary.RejectedBranchDocuments,
		&summary.VerifiedBranches,
		&summary.PendingBranchVerification,
		&summary.ManualReviewBranches,
	)
	return summary, err
}

func (r *AdminRepository) getBuyerDisputeOverview(ctx context.Context, businessID int64) (models.EntityDisputeOverview, error) {
	query := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total_disputes,
			COUNT(*) FILTER (WHERE dc.status IN (%s)) AS open_disputes,
			COUNT(*) FILTER (WHERE COALESCE(dc.suspected_fraud, FALSE) = TRUE) AS suspected_fraud_cases,
			COUNT(*) FILTER (WHERE it.code IN ('WRONG_ITEM', 'DAMAGED_GOODS', 'QUANTITY_SHORTAGE')) AS delivery_mismatch,
			COUNT(*) FILTER (WHERE it.code = 'ORDER_NOT_DELIVERED') AS no_show_issues,
			COUNT(*) FILTER (WHERE it.module = 'payment') AS payment_issues,
			COUNT(*) FILTER (WHERE it.code = 'CUSTOMER_CLAIM_DISPUTE') AS fraud_claim_issues
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		LEFT JOIN business_schema.order_table o ON o.order_id = dc.order_id
		WHERE COALESCE(dc.retailer_id, o.retailer_id)::bigint = $1
	`, buildStatusPlaceholders(2, len(openDisputeStatuses)))

	args := make([]interface{}, 0, 1+len(openDisputeStatuses))
	args = append(args, businessID)
	for _, status := range openDisputeStatuses {
		args = append(args, status)
	}

	var summary models.EntityDisputeOverview
	err := db.Pool.QueryRow(ctx, query, args...).Scan(
		&summary.TotalDisputes,
		&summary.OpenDisputes,
		&summary.SuspectedFraudCases,
		&summary.DeliveryMismatch,
		&summary.NoShowIssues,
		&summary.PaymentIssues,
		&summary.FraudClaimIssues,
	)
	return summary, err
}

func (r *AdminRepository) getWholesalerDisputeOverview(ctx context.Context, businessID int64) (models.EntityDisputeOverview, error) {
	query := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total_disputes,
			COUNT(*) FILTER (WHERE dc.status IN (%s)) AS open_disputes,
			COUNT(*) FILTER (WHERE COALESCE(dc.suspected_fraud, FALSE) = TRUE) AS suspected_fraud_cases,
			COUNT(*) FILTER (WHERE it.code IN ('WRONG_ITEM', 'DAMAGED_GOODS', 'QUANTITY_SHORTAGE')) AS delivery_mismatch,
			COUNT(*) FILTER (WHERE it.code = 'ORDER_NOT_DELIVERED') AS no_show_issues,
			COUNT(*) FILTER (WHERE it.module = 'payment') AS payment_issues,
			COUNT(*) FILTER (WHERE it.code = 'CUSTOMER_CLAIM_DISPUTE') AS fraud_claim_issues
		FROM dispute_schema.dispute_cases dc
		LEFT JOIN dispute_schema.issue_types it ON it.id = dc.issue_type_id
		LEFT JOIN business_schema.order_table o ON o.order_id = dc.order_id
		WHERE COALESCE(dc.wholesaler_id, 0)::bigint = $1
		   OR EXISTS (
				SELECT 1
				FROM unnest(o.wholeseller_id) wid(bid)
				WHERE wid.bid::bigint = $1
		   )
	`, buildStatusPlaceholders(2, len(openDisputeStatuses)))

	args := make([]interface{}, 0, 1+len(openDisputeStatuses))
	args = append(args, businessID)
	for _, status := range openDisputeStatuses {
		args = append(args, status)
	}

	var summary models.EntityDisputeOverview
	err := db.Pool.QueryRow(ctx, query, args...).Scan(
		&summary.TotalDisputes,
		&summary.OpenDisputes,
		&summary.SuspectedFraudCases,
		&summary.DeliveryMismatch,
		&summary.NoShowIssues,
		&summary.PaymentIssues,
		&summary.FraudClaimIssues,
	)
	return summary, err
}

func (r *AdminRepository) getLatestRetailerCompletedAt(ctx context.Context, businessID int64) (*time.Time, error) {
	var latest *time.Time
	err := db.Pool.QueryRow(ctx, `
		SELECT MAX(o.actual_delivery_date)
		FROM business_schema.order_table o
		WHERE o.retailer_id = $1
		  AND o.actual_delivery_date IS NOT NULL
	`, businessID).Scan(&latest)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return latest, err
}

func (r *AdminRepository) getLatestWholesalerCompletedAt(ctx context.Context, businessID int64) (*time.Time, error) {
	var latest *time.Time
	err := db.Pool.QueryRow(ctx, `
		SELECT MAX(o.actual_delivery_date)
		FROM business_schema.order_table o
		WHERE o.actual_delivery_date IS NOT NULL
		  AND EXISTS (
			SELECT 1
			FROM unnest(o.wholeseller_id) wid(bid)
			WHERE wid.bid::bigint = $1
		  )
	`, businessID).Scan(&latest)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return latest, err
}

func (r *AdminRepository) getLatestDriverCompletedAt(ctx context.Context, driverID int64) (*time.Time, error) {
	var latest *time.Time
	err := db.Pool.QueryRow(ctx, `
		SELECT MAX(o.actual_delivery_date)
		FROM transport_schema.trip_assignments ta
		JOIN transport_schema.job_orders jo ON jo.job_id = ta.job_id
		JOIN business_schema.order_table o ON o.order_id = jo.order_id
		WHERE ta.driver_id = $1
		  AND ta.delivery_status = 'delivered'
		  AND o.actual_delivery_date IS NOT NULL
	`, driverID).Scan(&latest)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return latest, err
}

func loadDriverProfile(ctx context.Context, driverID int64) (*profilepkg.DriverProfile, error) {
	query := `SELECT * FROM transport_schema.get_driver_profile($1)`

	row := db.Pool.QueryRow(ctx, query, driverID)

	var d profilepkg.DriverProfile
	err := row.Scan(
		&d.FirstName,
		&d.LastName,
		&d.DOB,
		&d.LicenceNo,
		&d.LicenceType,
		&d.LicenceIssuedDate,
		&d.LicenceExpiryDate,
		&d.ContactNum,
		&d.ContactNumAddl,
		&d.Email,
		&d.Aadhar,
		&d.Pan,
		&d.AddressDoorNo,
		&d.AddressStreet,
		&d.AddressState,
		&d.AddressTown,
		&d.AddressPinCode,
		&d.AddressLandmark,
		&d.BankAcNo,
		&d.BankName,
		&d.BankBranch,
		&d.IFSC,
		&d.BankAddress,
		&d.VehNumber,
		&d.RegDate,
		&d.VehicleState,
		&d.TypeID,
		&d.LoadCapacity,
		&d.FuelType,
		&d.ProfileImage,
		&d.ActiveStatus,
		&d.TotalDeliveries,
		&d.RegistrationDate,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func buildAddress(parts ...string) string {
	filtered := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		filtered = append(filtered, part)
	}
	return strings.Join(filtered, ", ")
}

func deriveAge(dob time.Time) *int {
	if dob.IsZero() {
		return nil
	}
	now := time.Now()
	years := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		years--
	}
	if years < 0 {
		return nil
	}
	return &years
}

func maskSensitiveValue(raw string, visibleDigits int) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if len(raw) <= visibleDigits {
		return raw
	}
	return strings.Repeat("*", len(raw)-visibleDigits) + raw[len(raw)-visibleDigits:]
}

func parseFloatPointer(raw *string) *float64 {
	if raw == nil || strings.TrimSpace(*raw) == "" {
		return nil
	}
	value, err := strconv.ParseFloat(strings.TrimSpace(*raw), 64)
	if err != nil {
		return nil
	}
	return &value
}

func toEntityRatingOverview(summary commonratings.Summary) models.EntityRatingOverview {
	return models.EntityRatingOverview{
		Available:      summary.Available,
		Score:          summary.Score,
		MaxScore:       summary.MaxScore,
		Band:           summary.Band,
		Confidence:     summary.Confidence,
		RatedEvents:    summary.RatedEvents,
		NegativeEvents: summary.NegativeEvents,
		IssueRate:      summary.IssueRate,
	}
}
