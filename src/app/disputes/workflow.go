package disputes

var allowedStatusTransitions = map[string]map[string]struct{}{
	"new": {
		"triaged":   {},
		"cancelled": {},
	},
	"triaged": {
		"awaiting_evidence":       {},
		"under_review":            {},
		"pending_external_action": {},
		"cancelled":               {},
	},
	"awaiting_evidence": {
		"under_review": {},
		"cancelled":    {},
	},
	"under_review": {
		"pending_external_action": {},
		"pending_execution":       {},
		"resolved":                {},
		"cancelled":               {},
	},
	"pending_external_action": {
		"under_review":      {},
		"pending_execution": {},
		"resolved":          {},
	},
	"pending_execution": {
		"resolved": {},
	},
	"resolved": {
		"closed": {},
	},
}

var allowedAdminActionTypes = map[string]struct{}{
	"assigned":               {},
	"reassigned":             {},
	"note_added":             {},
	"evidence_requested":     {},
	"evidence_received":      {},
	"complainant_contacted":  {},
	"counterparty_contacted": {},
	"status_changed":         {},
	"escalated":              {},
	"settlement_requested":   {},
	"settlement_completed":   {},
	"resolved":               {},
	"closed":                 {},
	"cancelled":              {},
}

var allowedNextStepTypes = map[string]struct{}{
	"request_invoice":   {},
	"request_photo":     {},
	"request_video":     {},
	"call_complainant":  {},
	"call_counterparty": {},
	"verify_payment":    {},
	"verify_pod":        {},
	"execute_refund":    {},
	"apply_penalty":     {},
	"schedule_callback": {},
	"close_case":        {},
}

var allowedCaseRoles = map[string]struct{}{
	"system":     {},
	"admin":      {},
	"ops_l1":     {},
	"ops_l2":     {},
	"finance":    {},
	"retailer":   {},
	"wholesaler": {},
	"driver":     {},
	"customer":   {},
}

var allowedAdminAssigneeRoles = map[string]struct{}{
	"admin":   {},
	"ops_l1":  {},
	"ops_l2":  {},
	"finance": {},
}

func isValidStatusTransition(fromStatus string, toStatus string) bool {
	if toStatus == "" {
		return true
	}
	to, ok := allowedStatusTransitions[fromStatus]
	if !ok {
		return false
	}
	_, ok = to[toStatus]
	return ok
}

func isTerminalStatus(status string) bool {
	return status == "closed" || status == "cancelled"
}

func isAllowedAdminActionType(actionType string) bool {
	_, ok := allowedAdminActionTypes[actionType]
	return ok
}

func isAllowedNextStepType(nextStepType string) bool {
	_, ok := allowedNextStepTypes[nextStepType]
	return ok
}

func isAllowedAdminAssigneeRole(role string) bool {
	_, ok := allowedAdminAssigneeRoles[role]
	return ok
}

func isAllowedCaseRole(role string) bool {
	_, ok := allowedCaseRoles[role]
	return ok
}
