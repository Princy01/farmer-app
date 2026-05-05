package models

import "time"

type PeerRatingOverview struct {
	Available              bool       `json:"available"`
	RawAverageRating       float64    `json:"raw_average_rating"`
	DisplayedAverageRating float64    `json:"displayed_average_rating"`
	RatingCount            int64      `json:"rating_count"`
	LastRatedAt            *time.Time `json:"last_rated_at,omitempty"`
}

type PeerRatingDashboardFilter struct {
	Page       int
	PageSize   int
	EntityType string
	Query      string
}

type PeerRatingDashboardSummary struct {
	TotalRatings      int64   `json:"total_ratings"`
	RatingsToday      int64   `json:"ratings_today"`
	DriverAverage     float64 `json:"driver_average"`
	RetailerAverage   float64 `json:"retailer_average"`
	WholesalerAverage float64 `json:"wholesaler_average"`
	RecentWindowHours int     `json:"recent_window_hours"`
}

type PeerRatingEntitySummaryItem struct {
	EntityType             string     `json:"entity_type"`
	EntityID               int64      `json:"entity_id"`
	DisplayName            string     `json:"display_name"`
	MobileNumber           string     `json:"mobile_number,omitempty"`
	RawAverageRating       float64    `json:"raw_average_rating"`
	DisplayedAverageRating float64    `json:"displayed_average_rating"`
	RatingCount            int64      `json:"rating_count"`
	LastRatedAt            *time.Time `json:"last_rated_at,omitempty"`
}

type PeerRatingRecentItem struct {
	RatingID         int64     `json:"rating_id"`
	OrderID          int64     `json:"order_id"`
	JobID            *int64    `json:"job_id,omitempty"`
	RaterEntityType  string    `json:"rater_entity_type"`
	RaterEntityID    int64     `json:"rater_entity_id"`
	RaterDisplayName string    `json:"rater_display_name"`
	RateeEntityType  string    `json:"ratee_entity_type"`
	RateeEntityID    int64     `json:"ratee_entity_id"`
	RateeDisplayName string    `json:"ratee_display_name"`
	Stars            int       `json:"stars"`
	Comment          string    `json:"comment,omitempty"`
	CapturedByUserID int64     `json:"captured_by_user_id"`
	CapturedAt       time.Time `json:"captured_at"`
}

type PeerRatingDashboardResponse struct {
	Summary       PeerRatingDashboardSummary `json:"summary"`
	RecentRatings []PeerRatingRecentItem     `json:"recent_ratings"`
	PagingMeta
	Items []PeerRatingEntitySummaryItem `json:"items"`
}

type PeerRatingEntityRef struct {
	EntityType   string `json:"entity_type"`
	EntityID     int64  `json:"entity_id"`
	DisplayName  string `json:"display_name"`
	MobileNumber string `json:"mobile_number,omitempty"`
	JobID        *int64 `json:"job_id,omitempty"`
}

type PeerRatingPairOption struct {
	PairKey          string `json:"pair_key"`
	OrderID          int64  `json:"order_id"`
	JobID            *int64 `json:"job_id,omitempty"`
	RaterEntityType  string `json:"rater_entity_type"`
	RaterEntityID    int64  `json:"rater_entity_id"`
	RaterDisplayName string `json:"rater_display_name"`
	RateeEntityType  string `json:"ratee_entity_type"`
	RateeEntityID    int64  `json:"ratee_entity_id"`
	RateeDisplayName string `json:"ratee_display_name"`
	Label            string `json:"label"`
}

type PeerRatingContextResponse struct {
	OrderID            int64                  `json:"order_id"`
	OrderStatusText    string                 `json:"order_status_text,omitempty"`
	DeliveredAt        *time.Time             `json:"delivered_at,omitempty"`
	Eligible           bool                   `json:"eligible"`
	EligibilityMessage string                 `json:"eligibility_message,omitempty"`
	Actor              *PeerRatingEntityRef   `json:"actor,omitempty"`
	Retailer           *PeerRatingEntityRef   `json:"retailer,omitempty"`
	Wholesalers        []PeerRatingEntityRef  `json:"wholesalers"`
	Drivers            []PeerRatingEntityRef  `json:"drivers"`
	EligiblePairs      []PeerRatingPairOption `json:"eligible_pairs"`
	ExistingRatings    []PeerRatingRecentItem `json:"existing_ratings"`
}

type PeerRatingSubmissionRequest struct {
	OrderID         int64  `json:"order_id"`
	JobID           *int64 `json:"job_id"`
	RaterEntityType string `json:"rater_entity_type"`
	RaterEntityID   int64  `json:"rater_entity_id"`
	RateeEntityType string `json:"ratee_entity_type"`
	RateeEntityID   int64  `json:"ratee_entity_id"`
	Stars           int    `json:"stars"`
	Comment         string `json:"comment"`
}

type PeerRatingSubmissionResponse struct {
	RatingID    int64              `json:"rating_id"`
	Message     string             `json:"message"`
	RateeRating PeerRatingOverview `json:"ratee_rating"`
}

type MyPeerRatingResponse struct {
	Actor          PeerRatingEntityRef    `json:"actor"`
	ReceivedRating PeerRatingOverview     `json:"received_rating"`
	RecentReceived []PeerRatingRecentItem `json:"recent_received"`
	RecentGiven    []PeerRatingRecentItem `json:"recent_given"`
}
