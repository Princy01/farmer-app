package middleware

import "testing"

func TestIsAllowedNonAdminAdminPath(t *testing.T) {
	tests := []struct {
		name   string
		path   string
		roleID int
		want   bool
	}{
		{
			name:   "ops can access dispute console",
			path:   "/admin/dispute-cases",
			roleID: OpsL1RoleID,
			want:   true,
		},
		{
			name:   "finance can access dispute console",
			path:   "/admin/dispute-cases/41",
			roleID: FinanceRoleID,
			want:   true,
		},
		{
			name:   "ops can access ops dashboard",
			path:   "/admin/ops-dashboard/summary",
			roleID: OpsL1RoleID,
			want:   true,
		},
		{
			name:   "ops can access onboarding watch",
			path:   "/admin/onboarding-watch/summary",
			roleID: OpsL1RoleID,
			want:   true,
		},
		{
			name:   "ops can access transport watch",
			path:   "/admin/transport-watch/list",
			roleID: OpsL1RoleID,
			want:   true,
		},
		{
			name:   "finance cannot access ops dashboard",
			path:   "/admin/ops-dashboard/summary",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "finance can access finance dashboard",
			path:   "/admin/finance-dashboard/summary",
			roleID: FinanceRoleID,
			want:   true,
		},
		{
			name:   "finance can access payment watch",
			path:   "/admin/payment-watch/summary",
			roleID: FinanceRoleID,
			want:   true,
		},
		{
			name:   "ops cannot access finance dashboard",
			path:   "/admin/finance-dashboard/summary",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "ops cannot access payment watch",
			path:   "/admin/payment-watch/list",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "finance cannot access onboarding watch",
			path:   "/admin/onboarding-watch/list",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "ops can access buyer overview",
			path:   "/admin/buyers/41/overview",
			roleID: OpsL1RoleID,
			want:   true,
		},
		{
			name:   "ops cannot update buyer pan verification",
			path:   "/admin/buyers/41/pan-verification",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "finance cannot update buyer aadhaar verification",
			path:   "/admin/buyers/41/aadhaar-verification",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "finance can access wholesaler overview",
			path:   "/admin/wholesalers/12/overview",
			roleID: FinanceRoleID,
			want:   true,
		},
		{
			name:   "ops cannot update wholesaler license verification",
			path:   "/admin/wholesalers/12/license-verification",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "finance cannot update wholesaler license verification",
			path:   "/admin/wholesalers/12/license-verification",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "finance cannot access transporter overview",
			path:   "/admin/transporters/9/overview",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "ops cannot update transporter document verification",
			path:   "/admin/transporters/9/document-verification",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "ops cannot update branch location verification",
			path:   "/admin/branches/12/location-verification",
			roleID: OpsL1RoleID,
			want:   false,
		},
		{
			name:   "finance cannot update branch document verification",
			path:   "/admin/branches/12/document-verification",
			roleID: FinanceRoleID,
			want:   false,
		},
		{
			name:   "non admin cannot access control tower",
			path:   "/admin/control-tower/summary",
			roleID: OpsL1RoleID,
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isAllowedNonAdminAdminPath(tt.path, tt.roleID)
			if got != tt.want {
				t.Fatalf("isAllowedNonAdminAdminPath(%q, %d) = %v, want %v", tt.path, tt.roleID, got, tt.want)
			}
		})
	}
}
