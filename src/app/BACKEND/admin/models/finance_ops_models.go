package models

import financepkg "farmerapp/internal/finance"

type FinanceAllocationListResponse struct {
	PagingMeta
	Items []financepkg.SettlementAllocation `json:"items"`
}

type FinanceExceptionListResponse struct {
	PagingMeta
	Items []financepkg.FinanceException `json:"items"`
}

type FinanceAllocationActionRequest struct {
	Reason string `json:"reason"`
	Note   string `json:"note"`
}

type FinanceExceptionStatusUpdateRequest struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}
