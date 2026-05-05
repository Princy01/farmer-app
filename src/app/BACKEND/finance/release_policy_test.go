package finance

import (
	"testing"
	"time"
)

func TestEvaluateSettlementAllocationReleaseReadyAfterWindow(t *testing.T) {
	now := time.Now()
	deliveredAt := now.Add(-11 * time.Minute)
	orderID := int64(101)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   1,
			OrderID:        &orderID,
			AllocationType: "wholeseller_payable",
			PayeeType:      "wholeseller",
			Status:         SettlementAllocationStatusHold,
			HoldSource:     "system",
		},
		OrderStatusID:    intPtr(7),
		DeliveredAt:      &deliveredAt,
		OpenDisputeCount: 0,
	}, now)

	if decision.Status != SettlementAllocationStatusReadyForRelease {
		t.Fatalf("expected ready_for_release, got %q", decision.Status)
	}
	if !decision.CanRelease {
		t.Fatalf("expected allocation to be releasable")
	}
	if decision.ReleaseAfter == nil {
		t.Fatalf("expected release_after to be set")
	}
}

func TestEvaluateSettlementAllocationReleaseWaitsForWindow(t *testing.T) {
	now := time.Now()
	deliveredAt := now.Add(-5 * time.Minute)
	orderID := int64(102)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   2,
			OrderID:        &orderID,
			AllocationType: "wholeseller_payable",
			PayeeType:      "wholeseller",
			Status:         SettlementAllocationStatusHold,
			HoldSource:     "system",
		},
		OrderStatusID:    intPtr(7),
		DeliveredAt:      &deliveredAt,
		OpenDisputeCount: 0,
	}, now)

	if decision.Status != SettlementAllocationStatusHold {
		t.Fatalf("expected hold status, got %q", decision.Status)
	}
	if decision.HoldReason == nil || *decision.HoldReason != "awaiting_release_window" {
		t.Fatalf("expected awaiting_release_window, got %+v", decision.HoldReason)
	}
	if decision.CanRelease {
		t.Fatalf("allocation should not be releasable before release window")
	}
}

func TestEvaluateSettlementAllocationReleaseBlockedByDispute(t *testing.T) {
	now := time.Now()
	deliveredAt := now.Add(-20 * time.Minute)
	orderID := int64(103)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   3,
			OrderID:        &orderID,
			AllocationType: "wholeseller_payable",
			PayeeType:      "wholeseller",
			Status:         SettlementAllocationStatusHold,
			HoldSource:     "system",
		},
		OrderStatusID:    intPtr(7),
		DeliveredAt:      &deliveredAt,
		OpenDisputeCount: 1,
	}, now)

	if decision.Status != SettlementAllocationStatusBlocked {
		t.Fatalf("expected blocked status, got %q", decision.Status)
	}
	if decision.ReleaseBlockReason == nil || *decision.ReleaseBlockReason != "open_dispute" {
		t.Fatalf("expected open_dispute block reason, got %+v", decision.ReleaseBlockReason)
	}
	if decision.CanRelease {
		t.Fatalf("allocation should not be releasable with open disputes")
	}
}

func TestEvaluateSettlementAllocationReleaseWaitsForAcceptance(t *testing.T) {
	now := time.Now()
	orderID := int64(104)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   4,
			OrderID:        &orderID,
			AllocationType: "wholeseller_payable",
			PayeeType:      "wholeseller",
			Status:         SettlementAllocationStatusHold,
			HoldSource:     "system",
		},
		OrderStatusID: intPtr(1),
	}, now)

	if decision.Status != SettlementAllocationStatusHold {
		t.Fatalf("expected hold status, got %q", decision.Status)
	}
	if decision.HoldReason == nil || *decision.HoldReason != "awaiting_order_acceptance" {
		t.Fatalf("expected awaiting_order_acceptance, got %+v", decision.HoldReason)
	}
}

func TestEvaluateSettlementAllocationReleaseWaitsForDriverAssignment(t *testing.T) {
	now := time.Now()
	orderID := int64(105)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   5,
			OrderID:        &orderID,
			AllocationType: "transporter_payable",
			PayeeType:      "transport_pending",
			Status:         SettlementAllocationStatusHold,
			HoldSource:     "system",
		},
		OrderStatusID: intPtr(7),
	}, now)

	if decision.HoldReason == nil || *decision.HoldReason != "awaiting_driver_assignment" {
		t.Fatalf("expected awaiting_driver_assignment, got %+v", decision.HoldReason)
	}
}

func TestEvaluateSettlementAllocationReleasePreservesAdminBlock(t *testing.T) {
	now := time.Now()
	orderID := int64(106)

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:       6,
			OrderID:            &orderID,
			AllocationType:     "wholeseller_payable",
			PayeeType:          "wholeseller",
			Status:             SettlementAllocationStatusBlocked,
			HoldSource:         "admin",
			ReleaseBlockReason: stringPtr("manual_admin_hold"),
		},
		OrderStatusID: intPtr(7),
	}, now)

	if decision.Status != SettlementAllocationStatusBlocked {
		t.Fatalf("expected blocked status, got %q", decision.Status)
	}
	if decision.ReleaseBlockReason == nil || *decision.ReleaseBlockReason != "manual_admin_hold" {
		t.Fatalf("expected manual_admin_hold, got %+v", decision.ReleaseBlockReason)
	}
}

func TestEvaluateSettlementAllocationReleaseDoesNotGatePlatformFee(t *testing.T) {
	now := time.Now()

	decision := evaluateSettlementAllocationRelease(settlementAllocationReleaseContext{
		Allocation: SettlementAllocation{
			AllocationID:   7,
			AllocationType: "platform_fee",
			PayeeType:      "platform",
			Status:         SettlementAllocationStatusReleased,
			HoldSource:     "system",
		},
		OrderStatusID: intPtr(1),
	}, now)

	if decision.Status != SettlementAllocationStatusReleased {
		t.Fatalf("expected released status, got %q", decision.Status)
	}
	if !decision.CanRelease {
		t.Fatalf("expected released platform fee to remain releasable")
	}
	if decision.HoldReason != nil || decision.ReleaseBlockReason != nil {
		t.Fatalf("expected no hold or block reason for platform fee, got %+v / %+v", decision.HoldReason, decision.ReleaseBlockReason)
	}
}

func intPtr(value int) *int {
	return &value
}
