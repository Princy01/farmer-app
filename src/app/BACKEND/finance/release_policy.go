package finance

import (
	"errors"
	"fmt"
	"time"
)

var ErrAllocationNotReleasable = errors.New("allocation not releasable")

const sellerPayoutReleaseWindow = 10 * time.Minute

var releasableAcceptedOrderStatuses = map[int]struct{}{
	2: {}, // Order Confirmed
	6: {}, // Delivery In Progress
	7: {}, // Delivered
}

type settlementAllocationReleaseContext struct {
	Allocation       SettlementAllocation
	OrderStatusID    *int
	DeliveredAt      *time.Time
	OpenDisputeCount int64
}

type settlementAllocationReleaseDecision struct {
	Status             string
	ReleaseAfter       *time.Time
	HoldReason         *string
	ReleaseBlockReason *string
	CanRelease         bool
}

func evaluateSettlementAllocationRelease(ctx settlementAllocationReleaseContext, now time.Time) settlementAllocationReleaseDecision {
	allocation := ctx.Allocation

	if allocation.Status == SettlementAllocationStatusReleased || allocation.Status == SettlementAllocationStatusCancelled {
		return settlementAllocationReleaseDecision{
			Status:             allocation.Status,
			ReleaseAfter:       allocation.ReleaseAfter,
			HoldReason:         allocation.HoldReason,
			ReleaseBlockReason: allocation.ReleaseBlockReason,
			CanRelease:         allocation.Status == SettlementAllocationStatusReleased,
		}
	}

	if allocation.Status == SettlementAllocationStatusBlocked && allocation.HoldSource == "admin" {
		reason := allocation.ReleaseBlockReason
		if reason == nil {
			reason = stringPtr("manual_admin_hold")
		}
		return settlementAllocationReleaseDecision{
			Status:             SettlementAllocationStatusBlocked,
			ReleaseAfter:       allocation.ReleaseAfter,
			HoldReason:         allocation.HoldReason,
			ReleaseBlockReason: reason,
			CanRelease:         false,
		}
	}

	if allocation.AllocationType != "wholeseller_payable" && allocation.AllocationType != "transporter_payable" {
		return settlementAllocationReleaseDecision{
			Status:             allocation.Status,
			ReleaseAfter:       allocation.ReleaseAfter,
			HoldReason:         allocation.HoldReason,
			ReleaseBlockReason: allocation.ReleaseBlockReason,
			CanRelease:         allocation.Status == SettlementAllocationStatusReadyForRelease,
		}
	}

	if allocation.PayeeType == "transport_pending" {
		return holdDecision("awaiting_driver_assignment", allocation.ReleaseAfter)
	}

	if allocation.OrderID == nil {
		return holdDecision("awaiting_order_materialization", nil)
	}

	if ctx.OpenDisputeCount > 0 {
		return blockedDecision("open_dispute")
	}

	if ctx.OrderStatusID == nil {
		return holdDecision("awaiting_order_acceptance", nil)
	}

	if isOrderTerminallyUnreleasable(*ctx.OrderStatusID) {
		return blockedDecision("order_not_releasable")
	}

	if !isAcceptedOrderStatus(*ctx.OrderStatusID) {
		return holdDecision("awaiting_order_acceptance", nil)
	}

	if ctx.DeliveredAt == nil {
		return holdDecision("awaiting_delivery_confirmation", nil)
	}

	releaseAfter := ctx.DeliveredAt.Add(sellerPayoutReleaseWindow)
	if now.Before(releaseAfter) {
		return holdDecision("awaiting_release_window", &releaseAfter)
	}

	return settlementAllocationReleaseDecision{
		Status:             SettlementAllocationStatusReadyForRelease,
		ReleaseAfter:       &releaseAfter,
		HoldReason:         nil,
		ReleaseBlockReason: nil,
		CanRelease:         true,
	}
}

func holdDecision(reason string, releaseAfter *time.Time) settlementAllocationReleaseDecision {
	return settlementAllocationReleaseDecision{
		Status:             SettlementAllocationStatusHold,
		ReleaseAfter:       releaseAfter,
		HoldReason:         stringPtr(reason),
		ReleaseBlockReason: nil,
		CanRelease:         false,
	}
}

func blockedDecision(reason string) settlementAllocationReleaseDecision {
	return settlementAllocationReleaseDecision{
		Status:             SettlementAllocationStatusBlocked,
		ReleaseAfter:       nil,
		HoldReason:         nil,
		ReleaseBlockReason: stringPtr(reason),
		CanRelease:         false,
	}
}

func isAcceptedOrderStatus(orderStatusID int) bool {
	_, ok := releasableAcceptedOrderStatuses[orderStatusID]
	return ok
}

func isOrderTerminallyUnreleasable(orderStatusID int) bool {
	switch orderStatusID {
	case 8, 9, 10, 11, 12:
		return true
	default:
		return false
	}
}

func AllocationReleaseErrorMessage(allocation SettlementAllocation) error {
	if allocation.Status == SettlementAllocationStatusReleased {
		return fmt.Errorf("%w: allocation is already released", ErrAllocationNotReleasable)
	}
	if allocation.Status == SettlementAllocationStatusCancelled {
		return fmt.Errorf("%w: allocation is cancelled", ErrAllocationNotReleasable)
	}
	if allocation.ReleaseBlockReason != nil && *allocation.ReleaseBlockReason != "" {
		return fmt.Errorf("%w: %s", ErrAllocationNotReleasable, *allocation.ReleaseBlockReason)
	}
	if allocation.HoldReason != nil && *allocation.HoldReason != "" {
		return fmt.Errorf("%w: %s", ErrAllocationNotReleasable, *allocation.HoldReason)
	}
	return fmt.Errorf("%w: allocation is not ready for release", ErrAllocationNotReleasable)
}

func stringPtr(value string) *string {
	return &value
}
