package models

import "time"

type VerificationStatusUpdateRequest struct {
	Status string `json:"status"`
	Notes  string `json:"notes"`
}

type VerificationStatusUpdateResponse struct {
	EntityID          int64      `json:"entity_id"`
	VerificationStage string     `json:"verification_stage"`
	Status            string     `json:"status"`
	Notes             string     `json:"notes,omitempty"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	VerifiedByUserID  *int64     `json:"verified_by_user_id,omitempty"`
}
