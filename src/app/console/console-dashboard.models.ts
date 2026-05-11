export interface SummaryRefreshMeta {
  server_time: string;
  refreshed_at: string;
  next_refresh_after_seconds: number;
}

export interface AdminControlTowerSummary extends SummaryRefreshMeta {
  total_businesses: number;
  total_branches: number;
  active_branches: number;
  total_orders: number;
  pending_orders: number;
  total_transport_jobs: number;
  open_transport_jobs: number;
  total_revenue: number;
  monthly_revenue: number;
  total_users: number;
  active_users: number;
  open_disputes: number;
  overdue_disputes: number;
  pending_branch_verification: number;
  pending_driver_onboarding: number;
  pending_buyer_kyc: number;
  pending_wholesaler_license: number;
  large_orders: number;
  large_order_threshold: number;
}

export interface OpsDashboardSummary extends SummaryRefreshMeta {
  total_open: number;
  awaiting_evidence: number;
  under_review: number;
  pending_external_action: number;
  pending_execution: number;
  overdue: number;
  due_today: number;
  due_soon: number;
  first_response_breached: number;
  resolution_breached: number;
  pending_branch_verification: number;
  pending_driver_onboarding: number;
  pending_buyer_kyc: number;
  pending_wholesaler_license: number;
  ride_not_assigned: number;
  ride_not_taken: number;
  pickup_delayed: number;
  delivery_overdue: number;
}

export interface FinanceDashboardSummary extends SummaryRefreshMeta {
  total_open: number;
  pending_execution: number;
  overdue: number;
  due_today: number;
  due_soon: number;
  payment_failures: number;
  high_value_cases: number;
  total_revenue: number;
  monthly_revenue: number;
  large_orders: number;
  large_order_threshold: number;
}
