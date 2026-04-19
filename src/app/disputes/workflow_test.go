package disputes

import "testing"

func TestIsValidStatusTransition(t *testing.T) {
	t.Parallel()

	tests := []struct {
		from string
		to   string
		want bool
	}{
		{from: "new", to: "triaged", want: true},
		{from: "new", to: "resolved", want: false},
		{from: "triaged", to: "awaiting_evidence", want: true},
		{from: "under_review", to: "resolved", want: true},
		{from: "resolved", to: "closed", want: true},
		{from: "closed", to: "resolved", want: false},
	}

	for _, tc := range tests {
		if got := isValidStatusTransition(tc.from, tc.to); got != tc.want {
			t.Fatalf("transition %s -> %s: got %v want %v", tc.from, tc.to, got, tc.want)
		}
	}
}

func TestIsAllowedAdminAssigneeRole(t *testing.T) {
	t.Parallel()

	if !isAllowedAdminAssigneeRole("ops_l1") {
		t.Fatal("expected ops_l1 to be allowed")
	}
	if isAllowedAdminAssigneeRole("retailer") {
		t.Fatal("did not expect retailer to be an admin assignee role")
	}
}
