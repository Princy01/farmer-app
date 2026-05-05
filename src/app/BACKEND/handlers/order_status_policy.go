package handlers

import "fmt"

const (
	orderStatusCreated            = 1
	orderStatusConfirmed          = 2
	orderStatusPaymentPending     = 3
	orderStatusPaymentConfirmed   = 4
	orderStatusPaymentFailed      = 5
	orderStatusDeliveryInProgress = 6
)

var defaultIncompleteCheckoutStatuses = []string{
	"created",
	"payment_pending",
	"payment_failed",
	"payment_expired",
}

func isLegacyPaymentOnlyOrderStatus(status int) bool {
	return status == orderStatusPaymentPending ||
		status == orderStatusPaymentConfirmed ||
		status == orderStatusPaymentFailed
}

func validateMaterializedOrderStatus(status int) error {
	if isLegacyPaymentOnlyOrderStatus(status) {
		return fmt.Errorf("payment-only order statuses must not be used for materialized orders")
	}
	return nil
}

func isRetailerCurrentOrderStatus(status int32) bool {
	return status == orderStatusCreated ||
		status == orderStatusConfirmed ||
		status == orderStatusDeliveryInProgress
}
