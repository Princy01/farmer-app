package models

import "time"

type Dispute struct {
	DisputeID      int64      `json:"dispute_id"`
	OrderID        *int64     `json:"order_id"`
	BusinessID     *int64     `json:"business_id"`
	BranchID       *int       `json:"branch_id"`
	RaisedByUserID int        `json:"raised_by_user_id"`
	RaisedByRole   int        `json:"raised_by_role"`
	DisputeType    string     `json:"dispute_type"`
	Description    string     `json:"description"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	CreatedAt      *time.Time `json:"created_at"`
}

type DisputeActionRequest struct {
	Action  string `json:"action"`
	Status  string `json:"status"`
	Remarks string `json:"remarks"`
}
