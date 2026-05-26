export interface OrderPostDeliveryStatus {
  post_delivery_type: 'none' | 'return' | 'return_dispute' | 'dispute' | 'finance_exception' | string;
  return_id?: number | null;
  return_status_id?: number | null;
  return_status_name?: string | null;
  return_status_description?: string | null;
  return_dispute_id?: number | null;
  return_dispute_status?: string | null;
  dispute_case_id?: number | null;
  dispute_status?: string | null;
  finance_exception_id?: number | null;
  finance_exception_status?: string | null;
  needs_admin_action?: boolean;
  updated_at?: string | null;
}

export function hasPostDeliveryStatus(status?: OrderPostDeliveryStatus | null): boolean {
  return !!status && (status.post_delivery_type || 'none') !== 'none';
}

export function getPostDeliveryColor(status?: OrderPostDeliveryStatus | null): string {
  if (!hasPostDeliveryStatus(status)) {
    return 'medium';
  }
  if (status?.needs_admin_action) {
    return 'warning';
  }
  switch (status?.post_delivery_type) {
    case 'dispute':
    case 'return_dispute':
      return 'danger';
    case 'finance_exception':
      return 'tertiary';
    case 'return':
      return 'secondary';
    default:
      return 'medium';
  }
}

export function getPostDeliveryLabelKey(status?: OrderPostDeliveryStatus | null): string | null {
  if (!hasPostDeliveryStatus(status)) {
    return null;
  }

  switch (status?.post_delivery_type) {
    case 'dispute':
      return 'POST_DELIVERY.DISPUTE';
    case 'return_dispute':
      return 'POST_DELIVERY.RETURN_DISPUTE';
    case 'finance_exception':
      return 'POST_DELIVERY.FINANCE_EXCEPTION';
    case 'return':
      return getReturnStatusLabelKey(status.return_status_id);
    default:
      return null;
  }
}

function getReturnStatusLabelKey(statusId?: number | null): string {
  switch (statusId) {
    case 1:
      return 'POST_DELIVERY.RETURN_REQUESTED';
    case 2:
      return 'POST_DELIVERY.RETURN_APPROVED';
    case 3:
      return 'POST_DELIVERY.RETURN_REJECTED';
    case 4:
      return 'POST_DELIVERY.RETURN_PICKUP_SCHEDULED';
    case 5:
      return 'POST_DELIVERY.RETURN_PICKED_UP';
    case 6:
      return 'POST_DELIVERY.RETURN_IN_TRANSIT';
    case 7:
      return 'POST_DELIVERY.RETURN_DELIVERED_TO_WHOLESALER';
    case 8:
      return 'POST_DELIVERY.RETURN_QUALITY_CHECKED';
    case 9:
      return 'POST_DELIVERY.RETURN_REFUND_INITIATED';
    case 10:
      return 'POST_DELIVERY.RETURN_REFUND_COMPLETED';
    case 11:
      return 'POST_DELIVERY.RETURN_DISPUTED';
    case 12:
      return 'POST_DELIVERY.RETURN_CLOSED';
    case 13:
      return 'POST_DELIVERY.RETURN_CANCELLED';
    default:
      return 'POST_DELIVERY.RETURN';
  }
}
