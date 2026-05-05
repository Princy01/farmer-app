package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"farmerapp/go_backend/db"
	"farmerapp/internal/admin/models"
	commonratings "farmerapp/internal/common/ratings"

	"github.com/jackc/pgx/v5/pgconn"
)

const recentRatingsWindowHours = 24

type peerRatingActor struct {
	models.PeerRatingEntityRef
	UserID int64
	RoleID int
}

func (r *AdminRepository) GetPeerRatingDashboard(filter models.PeerRatingDashboardFilter) (*models.PeerRatingDashboardResponse, error) {
	ctx := context.Background()

	page := filter.Page
	if page <= 0 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	resp := &models.PeerRatingDashboardResponse{
		Summary: models.PeerRatingDashboardSummary{
			RecentWindowHours: recentRatingsWindowHours,
		},
		PagingMeta: models.PagingMeta{
			Page:     page,
			PageSize: pageSize,
		},
		RecentRatings: make([]models.PeerRatingRecentItem, 0),
		Items:         make([]models.PeerRatingEntitySummaryItem, 0),
	}

	if err := db.Pool.QueryRow(ctx, `
		SELECT
			COUNT(*)::bigint AS total_ratings,
			COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint AS ratings_today,
			COALESCE(AVG(stars::float8) FILTER (WHERE ratee_entity_type = 'driver'), 0)::float8 AS driver_average,
			COALESCE(AVG(stars::float8) FILTER (WHERE ratee_entity_type = 'retailer'), 0)::float8 AS retailer_average,
			COALESCE(AVG(stars::float8) FILTER (WHERE ratee_entity_type = 'wholesaler'), 0)::float8 AS wholesaler_average
		FROM ratings_schema.peer_ratings
	`).Scan(
		&resp.Summary.TotalRatings,
		&resp.Summary.RatingsToday,
		&resp.Summary.DriverAverage,
		&resp.Summary.RetailerAverage,
		&resp.Summary.WholesalerAverage,
	); err != nil {
		return nil, err
	}

	recentRows, err := db.Pool.Query(ctx, `
		SELECT
			rating_id,
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			COALESCE(comment, '') AS comment,
			captured_by_user_id,
			created_at
		FROM ratings_schema.peer_ratings
		ORDER BY created_at DESC, rating_id DESC
		LIMIT 10
	`)
	if err != nil {
		return nil, err
	}
	defer recentRows.Close()

	for recentRows.Next() {
		var item models.PeerRatingRecentItem
		if err := recentRows.Scan(
			&item.RatingID,
			&item.OrderID,
			&item.JobID,
			&item.RaterEntityType,
			&item.RaterEntityID,
			&item.RaterDisplayName,
			&item.RateeEntityType,
			&item.RateeEntityID,
			&item.RateeDisplayName,
			&item.Stars,
			&item.Comment,
			&item.CapturedByUserID,
			&item.CapturedAt,
		); err != nil {
			return nil, err
		}
		resp.RecentRatings = append(resp.RecentRatings, item)
	}
	if err := recentRows.Err(); err != nil {
		return nil, err
	}

	rows, err := db.Pool.Query(ctx, `
		WITH entity_ratings AS (
			SELECT
				ratee_entity_type,
				ratee_entity_id,
				COUNT(*)::bigint AS rating_count,
				COALESCE(SUM(stars), 0)::bigint AS sum_stars,
				COALESCE(AVG(stars::float8), 0)::float8 AS raw_average_rating,
				MAX(created_at) AS last_rated_at
			FROM ratings_schema.peer_ratings
			GROUP BY ratee_entity_type, ratee_entity_id
		),
		platform_means AS (
			SELECT
				ratee_entity_type,
				COALESCE(AVG(stars::float8), 0)::float8 AS platform_mean
			FROM ratings_schema.peer_ratings
			GROUP BY ratee_entity_type
		),
		named AS (
			SELECT
				er.ratee_entity_type,
				er.ratee_entity_id,
				er.rating_count,
				er.sum_stars,
				er.raw_average_rating,
				er.last_rated_at,
				COALESCE(pm.platform_mean, 0)::float8 AS platform_mean,
				COALESCE(
					NULLIF(
						CASE
							WHEN er.ratee_entity_type = 'driver' THEN TRIM(COALESCE(di.first_name, '') || ' ' || COALESCE(di.last_name, ''))
							ELSE COALESCE(bt.b_owner_name, '')
						END,
						''
					),
					INITCAP(er.ratee_entity_type) || ' #' || er.ratee_entity_id::text
				) AS display_name,
				CASE
					WHEN er.ratee_entity_type = 'driver' THEN COALESCE(di.contact_num, '')
					ELSE COALESCE(bt.mobile_number, '')
				END AS mobile_number
			FROM entity_ratings er
			LEFT JOIN platform_means pm ON pm.ratee_entity_type = er.ratee_entity_type
			LEFT JOIN transport_schema.driver_info di
				ON er.ratee_entity_type = 'driver' AND di.id = er.ratee_entity_id
			LEFT JOIN admin_schema.business_table bt
				ON er.ratee_entity_type IN ('retailer', 'wholesaler') AND bt.bid = er.ratee_entity_id
			WHERE ($1 = '' OR er.ratee_entity_type = $1)
			  AND (
					$2 = ''
					OR COALESCE(
						NULLIF(
							CASE
								WHEN er.ratee_entity_type = 'driver' THEN TRIM(COALESCE(di.first_name, '') || ' ' || COALESCE(di.last_name, ''))
								ELSE COALESCE(bt.b_owner_name, '')
							END,
							''
						),
						INITCAP(er.ratee_entity_type) || ' #' || er.ratee_entity_id::text
					) ILIKE '%%' || $2 || '%%'
					OR CASE
						WHEN er.ratee_entity_type = 'driver' THEN COALESCE(di.contact_num, '')
						ELSE COALESCE(bt.mobile_number, '')
					END ILIKE '%%' || $2 || '%%'
			  )
		)
		SELECT
			ratee_entity_type,
			ratee_entity_id,
			display_name,
			mobile_number,
			rating_count,
			sum_stars,
			raw_average_rating,
			platform_mean,
			last_rated_at,
			COUNT(*) OVER()::bigint AS total_count
		FROM named
		ORDER BY last_rated_at DESC NULLS LAST, rating_count DESC, display_name ASC
		LIMIT $3 OFFSET $4
	`, normalizePeerRatingEntityType(filter.EntityType), strings.TrimSpace(filter.Query), pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			item         models.PeerRatingEntitySummaryItem
			sumStars     int64
			platformMean float64
			totalCount   int64
		)
		if err := rows.Scan(
			&item.EntityType,
			&item.EntityID,
			&item.DisplayName,
			&item.MobileNumber,
			&item.RatingCount,
			&sumStars,
			&item.RawAverageRating,
			&platformMean,
			&item.LastRatedAt,
			&totalCount,
		); err != nil {
			return nil, err
		}

		public := commonratings.BuildPublicRatingSummary(item.EntityType, item.RatingCount, sumStars, platformMean)
		item.RawAverageRating = public.RawAverageRating
		item.DisplayedAverageRating = public.DisplayedAverageRating
		resp.TotalCount = totalCount
		resp.Items = append(resp.Items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return resp, nil
}

func (r *AdminRepository) GetPeerRatingContext(orderID int64, jobID *int64) (*models.PeerRatingContextResponse, error) {
	ctx := context.Background()
	return r.loadPeerRatingContext(ctx, orderID, jobID)
}

func (r *AdminRepository) GetPeerRatingContextForActor(actorUserID int64, actorRoleID int, orderID int64, jobID *int64) (*models.PeerRatingContextResponse, error) {
	ctx := context.Background()

	actor, err := r.resolvePeerRatingActor(ctx, actorUserID, actorRoleID)
	if err != nil {
		return nil, err
	}

	contextResp, err := r.loadPeerRatingContext(ctx, orderID, jobID)
	if err != nil {
		return nil, err
	}

	return r.filterPeerRatingContextForActor(contextResp, actor)
}

func (r *AdminRepository) CreatePeerRating(actorUserID int64, req models.PeerRatingSubmissionRequest) (*models.PeerRatingSubmissionResponse, error) {
	ctx := context.Background()

	if req.OrderID <= 0 {
		return nil, errors.New("order_id is required")
	}
	if req.Stars < 1 || req.Stars > 5 {
		return nil, errors.New("stars must be between 1 and 5")
	}
	req.Comment = strings.TrimSpace(req.Comment)
	if len(req.Comment) > 500 {
		return nil, errors.New("comment must be 500 characters or fewer")
	}

	contextResp, err := r.loadPeerRatingContext(ctx, req.OrderID, req.JobID)
	if err != nil {
		return nil, err
	}
	if !contextResp.Eligible {
		if contextResp.EligibilityMessage != "" {
			return nil, errors.New(contextResp.EligibilityMessage)
		}
		return nil, errors.New("order is not yet eligible for peer rating")
	}

	pair, ok := matchPeerRatingPair(contextResp.EligiblePairs, req)
	if !ok {
		return nil, errors.New("selected peer rating pair is not valid for this order")
	}

	var ratingID int64
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO ratings_schema.peer_ratings (
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			comment,
			captured_by_user_id,
			source
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'admin_console'
		)
		RETURNING rating_id
	`, req.OrderID, pair.JobID, pair.RaterEntityType, pair.RaterEntityID, pair.RaterDisplayName, pair.RateeEntityType, pair.RateeEntityID, pair.RateeDisplayName, req.Stars, req.Comment, actorUserID).Scan(&ratingID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, errors.New("a peer rating already exists for this order and pair")
		}
		return nil, err
	}

	rateeRating, err := r.getPeerRatingOverview(ctx, pair.RateeEntityType, pair.RateeEntityID)
	if err != nil {
		return nil, err
	}

	return &models.PeerRatingSubmissionResponse{
		RatingID:    ratingID,
		Message:     "Peer rating captured successfully",
		RateeRating: rateeRating,
	}, nil
}

func (r *AdminRepository) CreatePeerRatingForActor(actorUserID int64, actorRoleID int, req models.PeerRatingSubmissionRequest) (*models.PeerRatingSubmissionResponse, error) {
	ctx := context.Background()

	if req.OrderID <= 0 {
		return nil, errors.New("order_id is required")
	}
	if req.Stars < 1 || req.Stars > 5 {
		return nil, errors.New("stars must be between 1 and 5")
	}
	req.Comment = strings.TrimSpace(req.Comment)
	if len(req.Comment) > 500 {
		return nil, errors.New("comment must be 500 characters or fewer")
	}

	actor, err := r.resolvePeerRatingActor(ctx, actorUserID, actorRoleID)
	if err != nil {
		return nil, err
	}

	contextResp, err := r.loadPeerRatingContext(ctx, req.OrderID, req.JobID)
	if err != nil {
		return nil, err
	}

	filteredContext, err := r.filterPeerRatingContextForActor(contextResp, actor)
	if err != nil {
		return nil, err
	}
	if !filteredContext.Eligible {
		if filteredContext.EligibilityMessage != "" {
			return nil, errors.New(filteredContext.EligibilityMessage)
		}
		return nil, errors.New("no peer rating is currently available for this order")
	}

	pair, ok := matchPeerRatingPair(filteredContext.EligiblePairs, req)
	if !ok {
		return nil, errors.New("selected peer rating pair is not valid for the current user")
	}

	var ratingID int64
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO ratings_schema.peer_ratings (
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			comment,
			captured_by_user_id,
			source
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'app_user'
		)
		RETURNING rating_id
	`, req.OrderID, pair.JobID, pair.RaterEntityType, pair.RaterEntityID, pair.RaterDisplayName, pair.RateeEntityType, pair.RateeEntityID, pair.RateeDisplayName, req.Stars, req.Comment, actorUserID).Scan(&ratingID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, errors.New("a peer rating already exists for this order and pair")
		}
		return nil, err
	}

	rateeRating, err := r.getPeerRatingOverview(ctx, pair.RateeEntityType, pair.RateeEntityID)
	if err != nil {
		return nil, err
	}

	return &models.PeerRatingSubmissionResponse{
		RatingID:    ratingID,
		Message:     "Peer rating captured successfully",
		RateeRating: rateeRating,
	}, nil
}

func (r *AdminRepository) GetMyPeerRating(actorUserID int64, actorRoleID int) (*models.MyPeerRatingResponse, error) {
	ctx := context.Background()

	actor, err := r.resolvePeerRatingActor(ctx, actorUserID, actorRoleID)
	if err != nil {
		return nil, err
	}

	receivedRating, err := r.getPeerRatingOverview(ctx, actor.EntityType, actor.EntityID)
	if err != nil {
		return nil, err
	}

	resp := &models.MyPeerRatingResponse{
		Actor:          actor.PeerRatingEntityRef,
		ReceivedRating: receivedRating,
		RecentReceived: make([]models.PeerRatingRecentItem, 0),
		RecentGiven:    make([]models.PeerRatingRecentItem, 0),
	}

	if err := r.loadRecentPeerRatingsForEntity(ctx, &resp.RecentReceived, `
		SELECT
			rating_id,
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			COALESCE(comment, '') AS comment,
			captured_by_user_id,
			created_at
		FROM ratings_schema.peer_ratings
		WHERE ratee_entity_type = $1
		  AND ratee_entity_id = $2
		ORDER BY created_at DESC, rating_id DESC
		LIMIT 10
	`, actor.EntityType, actor.EntityID); err != nil {
		return nil, err
	}

	if err := r.loadRecentPeerRatingsForEntity(ctx, &resp.RecentGiven, `
		SELECT
			rating_id,
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			COALESCE(comment, '') AS comment,
			captured_by_user_id,
			created_at
		FROM ratings_schema.peer_ratings
		WHERE rater_entity_type = $1
		  AND rater_entity_id = $2
		ORDER BY created_at DESC, rating_id DESC
		LIMIT 10
	`, actor.EntityType, actor.EntityID); err != nil {
		return nil, err
	}

	return resp, nil
}

func (r *AdminRepository) getPeerRatingOverview(ctx context.Context, entityType string, entityID int64) (models.PeerRatingOverview, error) {
	var (
		ratingCount  int64
		sumStars     int64
		platformMean float64
		lastRatedAt  *time.Time
	)
	err := db.Pool.QueryRow(ctx, `
		WITH platform_mean AS (
			SELECT COALESCE(AVG(stars::float8), 0)::float8 AS avg_rating
			FROM ratings_schema.peer_ratings
			WHERE ratee_entity_type = $1
		)
		SELECT
			COUNT(*)::bigint AS rating_count,
			COALESCE(SUM(stars), 0)::bigint AS sum_stars,
			COALESCE((SELECT avg_rating FROM platform_mean), 0)::float8 AS platform_mean,
			MAX(created_at) AS last_rated_at
		FROM ratings_schema.peer_ratings
		WHERE ratee_entity_type = $1
		  AND ratee_entity_id = $2
	`, entityType, entityID).Scan(&ratingCount, &sumStars, &platformMean, &lastRatedAt)
	if err != nil {
		if isUndefinedRelationError(err) {
			return models.PeerRatingOverview{}, nil
		}
		return models.PeerRatingOverview{}, err
	}

	public := commonratings.BuildPublicRatingSummary(entityType, ratingCount, sumStars, platformMean)
	return models.PeerRatingOverview{
		Available:              public.Available,
		RawAverageRating:       public.RawAverageRating,
		DisplayedAverageRating: public.DisplayedAverageRating,
		RatingCount:            public.RatingCount,
		LastRatedAt:            lastRatedAt,
	}, nil
}

func (r *AdminRepository) loadPeerRatingContext(ctx context.Context, orderID int64, jobID *int64) (*models.PeerRatingContextResponse, error) {
	resp := &models.PeerRatingContextResponse{
		OrderID:         orderID,
		Wholesalers:     make([]models.PeerRatingEntityRef, 0),
		Drivers:         make([]models.PeerRatingEntityRef, 0),
		EligiblePairs:   make([]models.PeerRatingPairOption, 0),
		ExistingRatings: make([]models.PeerRatingRecentItem, 0),
	}

	if err := db.Pool.QueryRow(ctx, `
		SELECT
			COALESCE(os.order_status, '') AS order_status_text,
			o.actual_delivery_date
		FROM business_schema.order_table o
		LEFT JOIN admin_schema.order_status_table os ON os.order_status_id = o.order_status
		WHERE o.order_id = $1
	`, orderID).Scan(&resp.OrderStatusText, &resp.DeliveredAt); err != nil {
		return nil, err
	}

	var retailer models.PeerRatingEntityRef
	if err := db.Pool.QueryRow(ctx, `
		SELECT
			'retailer'::text AS entity_type,
			o.retailer_id::bigint AS entity_id,
			COALESCE(rb.b_owner_name, '') AS display_name,
			COALESCE(rb.mobile_number, '') AS mobile_number
		FROM business_schema.order_table o
		LEFT JOIN admin_schema.business_table rb ON rb.bid = o.retailer_id
		WHERE o.order_id = $1
	`, orderID).Scan(
		&retailer.EntityType,
		&retailer.EntityID,
		&retailer.DisplayName,
		&retailer.MobileNumber,
	); err != nil {
		return nil, err
	}
	resp.Retailer = &retailer

	wholesalerRows, err := db.Pool.Query(ctx, `
		SELECT DISTINCT
			'wholesaler'::text AS entity_type,
			wid.bid::bigint AS entity_id,
			COALESCE(bt.b_owner_name, '') AS display_name,
			COALESCE(bt.mobile_number, '') AS mobile_number
		FROM business_schema.order_table o
		JOIN LATERAL unnest(o.wholeseller_id) wid(bid) ON TRUE
		LEFT JOIN admin_schema.business_table bt ON bt.bid = wid.bid
		WHERE o.order_id = $1
		ORDER BY display_name ASC, entity_id ASC
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer wholesalerRows.Close()

	for wholesalerRows.Next() {
		var item models.PeerRatingEntityRef
		if err := wholesalerRows.Scan(&item.EntityType, &item.EntityID, &item.DisplayName, &item.MobileNumber); err != nil {
			return nil, err
		}
		resp.Wholesalers = append(resp.Wholesalers, item)
	}
	if err := wholesalerRows.Err(); err != nil {
		return nil, err
	}

	type driverContextRow struct {
		models.PeerRatingEntityRef
		DeliveredAt *time.Time
	}

	driverRows, err := db.Pool.Query(ctx, `
		SELECT DISTINCT ON (jo.job_id, ta.driver_id)
			'driver'::text AS entity_type,
			ta.driver_id::bigint AS entity_id,
			COALESCE(NULLIF(TRIM(COALESCE(di.first_name, '') || ' ' || COALESCE(di.last_name, '')), ''), 'Driver #' || ta.driver_id::text) AS display_name,
			COALESCE(di.contact_num, '') AS mobile_number,
			jo.job_id::bigint AS job_id,
			ta.delivered_at
		FROM transport_schema.job_orders jo
		LEFT JOIN transport_schema.trip_assignments ta ON ta.job_id = jo.job_id
		LEFT JOIN transport_schema.driver_info di ON di.id = ta.driver_id
		WHERE jo.order_id = $1
		  AND ta.driver_id IS NOT NULL
		  AND ($2::bigint IS NULL OR jo.job_id = $2)
		ORDER BY jo.job_id DESC, ta.driver_id ASC, ta.assignment_id DESC NULLS LAST
	`, orderID, jobID)
	if err != nil {
		return nil, err
	}
	defer driverRows.Close()

	driverContextRows := make([]driverContextRow, 0)
	for driverRows.Next() {
		var item driverContextRow
		if err := driverRows.Scan(
			&item.EntityType,
			&item.EntityID,
			&item.DisplayName,
			&item.MobileNumber,
			&item.JobID,
			&item.DeliveredAt,
		); err != nil {
			return nil, err
		}
		resp.Drivers = append(resp.Drivers, item.PeerRatingEntityRef)
		driverContextRows = append(driverContextRows, item)
		if resp.DeliveredAt == nil && item.DeliveredAt != nil {
			resp.DeliveredAt = item.DeliveredAt
		}
	}
	if err := driverRows.Err(); err != nil {
		return nil, err
	}

	resp.Eligible = resp.DeliveredAt != nil
	if !resp.Eligible {
		resp.EligibilityMessage = "order must be delivered before peer rating can be captured"
	}

	if resp.Retailer != nil {
		for _, wholesaler := range resp.Wholesalers {
			resp.EligiblePairs = append(resp.EligiblePairs,
				buildPeerRatingPair(orderID, nil, *resp.Retailer, wholesaler),
				buildPeerRatingPair(orderID, nil, wholesaler, *resp.Retailer),
			)
		}
	}

	for _, driver := range driverContextRows {
		if resp.Retailer != nil {
			resp.EligiblePairs = append(resp.EligiblePairs,
				buildPeerRatingPair(orderID, driver.JobID, *resp.Retailer, driver.PeerRatingEntityRef),
				buildPeerRatingPair(orderID, driver.JobID, driver.PeerRatingEntityRef, *resp.Retailer),
			)
		}
		for _, wholesaler := range resp.Wholesalers {
			resp.EligiblePairs = append(resp.EligiblePairs,
				buildPeerRatingPair(orderID, driver.JobID, wholesaler, driver.PeerRatingEntityRef),
				buildPeerRatingPair(orderID, driver.JobID, driver.PeerRatingEntityRef, wholesaler),
			)
		}
	}

	existingRows, err := db.Pool.Query(ctx, `
		SELECT
			rating_id,
			order_id,
			job_id,
			rater_entity_type,
			rater_entity_id,
			rater_display_name,
			ratee_entity_type,
			ratee_entity_id,
			ratee_display_name,
			stars,
			COALESCE(comment, '') AS comment,
			captured_by_user_id,
			created_at
		FROM ratings_schema.peer_ratings
		WHERE order_id = $1
		  AND ($2::bigint IS NULL OR COALESCE(job_id, 0) = COALESCE($2, 0))
		ORDER BY created_at DESC, rating_id DESC
	`, orderID, jobID)
	if err != nil {
		if isUndefinedRelationError(err) {
			return resp, nil
		}
		return nil, err
	}
	defer existingRows.Close()

	for existingRows.Next() {
		var item models.PeerRatingRecentItem
		if err := existingRows.Scan(
			&item.RatingID,
			&item.OrderID,
			&item.JobID,
			&item.RaterEntityType,
			&item.RaterEntityID,
			&item.RaterDisplayName,
			&item.RateeEntityType,
			&item.RateeEntityID,
			&item.RateeDisplayName,
			&item.Stars,
			&item.Comment,
			&item.CapturedByUserID,
			&item.CapturedAt,
		); err != nil {
			return nil, err
		}
		resp.ExistingRatings = append(resp.ExistingRatings, item)
	}
	if err := existingRows.Err(); err != nil {
		return nil, err
	}

	return resp, nil
}

func (r *AdminRepository) resolvePeerRatingActor(ctx context.Context, actorUserID int64, actorRoleID int) (peerRatingActor, error) {
	actor := peerRatingActor{
		UserID: actorUserID,
		RoleID: actorRoleID,
	}

	switch actorRoleID {
	case 2, 3:
		entityType := "wholesaler"
		if actorRoleID == 3 {
			entityType = "retailer"
		}

		err := db.Pool.QueryRow(ctx, `
			SELECT
				$2::text AS entity_type,
				bid::bigint AS entity_id,
				COALESCE(NULLIF(TRIM(b_owner_name), ''), INITCAP($2::text) || ' #' || bid::text) AS display_name,
				COALESCE(mobile_number, '') AS mobile_number
			FROM admin_schema.business_table
			WHERE user_id = $1
		`, actorUserID, entityType).Scan(
			&actor.EntityType,
			&actor.EntityID,
			&actor.DisplayName,
			&actor.MobileNumber,
		)
		if err != nil {
			return peerRatingActor{}, errors.New("business actor could not be resolved for the current user")
		}
		return actor, nil

	case 4:
		err := db.Pool.QueryRow(ctx, `
			SELECT
				'driver'::text AS entity_type,
				id::bigint AS entity_id,
				COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), 'Driver #' || id::text) AS display_name,
				COALESCE(contact_num, '') AS mobile_number
			FROM transport_schema.driver_info
			WHERE id = $1
		`, actorUserID).Scan(
			&actor.EntityType,
			&actor.EntityID,
			&actor.DisplayName,
			&actor.MobileNumber,
		)
		if err != nil {
			return peerRatingActor{}, errors.New("driver actor could not be resolved for the current user")
		}
		return actor, nil

	default:
		return peerRatingActor{}, errors.New("ratings are only available for retailer, wholesaler, and driver accounts")
	}
}

func (r *AdminRepository) filterPeerRatingContextForActor(resp *models.PeerRatingContextResponse, actor peerRatingActor) (*models.PeerRatingContextResponse, error) {
	if !actorIncludedInPeerRatingContext(resp, actor) {
		return nil, errors.New("you do not have access to rating context for this order")
	}

	filtered := *resp
	filtered.Actor = &actor.PeerRatingEntityRef

	filteredPairs := make([]models.PeerRatingPairOption, 0, len(resp.EligiblePairs))
	for _, pair := range resp.EligiblePairs {
		if pair.RaterEntityType != actor.EntityType || pair.RaterEntityID != actor.EntityID {
			continue
		}
		if peerRatingAlreadyCaptured(resp.ExistingRatings, pair) {
			continue
		}
		filteredPairs = append(filteredPairs, pair)
	}
	filtered.EligiblePairs = filteredPairs

	filteredRatings := make([]models.PeerRatingRecentItem, 0, len(resp.ExistingRatings))
	for _, item := range resp.ExistingRatings {
		if item.RaterEntityType == actor.EntityType && item.RaterEntityID == actor.EntityID {
			filteredRatings = append(filteredRatings, item)
			continue
		}
		if item.RateeEntityType == actor.EntityType && item.RateeEntityID == actor.EntityID {
			filteredRatings = append(filteredRatings, item)
		}
	}
	filtered.ExistingRatings = filteredRatings

	if resp.DeliveredAt != nil && len(filtered.EligiblePairs) == 0 {
		filtered.Eligible = false
		if len(filtered.ExistingRatings) > 0 {
			filtered.EligibilityMessage = "all available peer ratings for this order have already been submitted"
		} else {
			filtered.EligibilityMessage = "no peer rating is currently available for this order"
		}
	}

	return &filtered, nil
}

func (r *AdminRepository) loadRecentPeerRatingsForEntity(ctx context.Context, target *[]models.PeerRatingRecentItem, query string, entityType string, entityID int64) error {
	rows, err := db.Pool.Query(ctx, query, entityType, entityID)
	if err != nil {
		if isUndefinedRelationError(err) {
			return nil
		}
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var item models.PeerRatingRecentItem
		if err := rows.Scan(
			&item.RatingID,
			&item.OrderID,
			&item.JobID,
			&item.RaterEntityType,
			&item.RaterEntityID,
			&item.RaterDisplayName,
			&item.RateeEntityType,
			&item.RateeEntityID,
			&item.RateeDisplayName,
			&item.Stars,
			&item.Comment,
			&item.CapturedByUserID,
			&item.CapturedAt,
		); err != nil {
			return err
		}
		*target = append(*target, item)
	}

	return rows.Err()
}

func buildPeerRatingPair(orderID int64, jobID *int64, rater models.PeerRatingEntityRef, ratee models.PeerRatingEntityRef) models.PeerRatingPairOption {
	jobPart := int64(0)
	if jobID != nil {
		jobPart = *jobID
	}

	label := fmt.Sprintf("%s → %s", rater.DisplayName, ratee.DisplayName)
	if jobID != nil {
		label = fmt.Sprintf("%s (Job #%d)", label, *jobID)
	}

	return models.PeerRatingPairOption{
		PairKey:          fmt.Sprintf("%s:%d:%s:%d:%d", rater.EntityType, rater.EntityID, ratee.EntityType, ratee.EntityID, jobPart),
		OrderID:          orderID,
		JobID:            jobID,
		RaterEntityType:  rater.EntityType,
		RaterEntityID:    rater.EntityID,
		RaterDisplayName: rater.DisplayName,
		RateeEntityType:  ratee.EntityType,
		RateeEntityID:    ratee.EntityID,
		RateeDisplayName: ratee.DisplayName,
		Label:            label,
	}
}

func actorIncludedInPeerRatingContext(resp *models.PeerRatingContextResponse, actor peerRatingActor) bool {
	if resp.Retailer != nil && resp.Retailer.EntityType == actor.EntityType && resp.Retailer.EntityID == actor.EntityID {
		return true
	}
	for _, wholesaler := range resp.Wholesalers {
		if wholesaler.EntityType == actor.EntityType && wholesaler.EntityID == actor.EntityID {
			return true
		}
	}
	for _, driver := range resp.Drivers {
		if driver.EntityType == actor.EntityType && driver.EntityID == actor.EntityID {
			return true
		}
	}
	return false
}

func peerRatingAlreadyCaptured(existing []models.PeerRatingRecentItem, pair models.PeerRatingPairOption) bool {
	for _, item := range existing {
		if item.OrderID != pair.OrderID {
			continue
		}
		if !sameOptionalInt64(item.JobID, pair.JobID) {
			continue
		}
		if item.RaterEntityType != pair.RaterEntityType || item.RaterEntityID != pair.RaterEntityID {
			continue
		}
		if item.RateeEntityType != pair.RateeEntityType || item.RateeEntityID != pair.RateeEntityID {
			continue
		}
		return true
	}
	return false
}

func matchPeerRatingPair(pairs []models.PeerRatingPairOption, req models.PeerRatingSubmissionRequest) (models.PeerRatingPairOption, bool) {
	for _, pair := range pairs {
		if pair.OrderID != req.OrderID {
			continue
		}
		if !sameOptionalInt64(pair.JobID, req.JobID) {
			continue
		}
		if pair.RaterEntityType != normalizePeerRatingEntityType(req.RaterEntityType) || pair.RaterEntityID != req.RaterEntityID {
			continue
		}
		if pair.RateeEntityType != normalizePeerRatingEntityType(req.RateeEntityType) || pair.RateeEntityID != req.RateeEntityID {
			continue
		}
		return pair, true
	}
	return models.PeerRatingPairOption{}, false
}

func sameOptionalInt64(left *int64, right *int64) bool {
	switch {
	case left == nil && right == nil:
		return true
	case left == nil || right == nil:
		return false
	default:
		return *left == *right
	}
}

func normalizePeerRatingEntityType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "driver", "retailer", "wholesaler":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return ""
	}
}

func isUndefinedRelationError(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "42P01"
}
