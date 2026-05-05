package models

import "time"

type BusinessListItem struct {
	BusinessID         int64      `json:"business_id"`
	RegistrationNumber string     `json:"registration_number"`
	OwnerName          string     `json:"owner_name"`
	BusinessType       string     `json:"business_type"`
	BusinessCategory   string     `json:"business_category"`
	Email              string     `json:"email"`
	MobileNumber       string     `json:"mobile_number"`
	State              string     `json:"state"`
	City               string     `json:"city"`
	Address            string     `json:"address"`
	IsActive           bool       `json:"is_active"`
	CreatedAt          *time.Time `json:"created_at"`
}

type BranchListItem struct {
	BranchID     int64        `json:"branch_id"`
	BranchName   string     `json:"branch_name"`
	BusinessID   int64      `json:"business_id"`
	BusinessName string     `json:"business_name"`
	BusinessType string     `json:"business_type"`
	City         string     `json:"city"`
	State        string     `json:"state"`
	Email        string     `json:"email"`
	MobileNumber string     `json:"mobile_number"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    *time.Time `json:"created_at"`
}
