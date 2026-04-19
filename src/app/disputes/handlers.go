package disputes

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service ServiceInterface
}

func NewHandler(service ServiceInterface) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetIssueTypes(c *fiber.Ctx) error {
	_, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	ctx := c.Context()

	var isActive *bool
	if value := c.Query("is_active"); value != "" {
		parsed := value == "true" || value == "1"
		isActive = &parsed
	}

	items, err := h.service.ListIssueTypes(ctx, roleID, IssueTypeFilter{
		Module:   c.Query("module"),
		IsActive: isActive,
		RoleCode: c.Query("role"),
	})
	if err != nil {
		if err.Error() == "unsupported role" || err.Error() == "unsupported role_id" || err.Error() == "unsupported role" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "validation_error",
				"message": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load issue types",
		})
	}

	return c.JSON(fiber.Map{"items": items})
}

func (h *Handler) CreateDispute(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	var req CreateDisputeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid request payload",
		})
	}

	resp, err := h.service.CreateDispute(c.Context(), userID, roleID, req)
	if err != nil {
		var duplicateErr *DuplicateDisputeError
		if errors.As(err, &duplicateErr) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "duplicate_dispute",
				"message": duplicateErr.Error(),
				"existing_case": fiber.Map{
					"case_id":        duplicateErr.ExistingCase.CaseID,
					"case_reference": duplicateErr.ExistingCase.CaseReference,
					"status":         duplicateErr.ExistingCase.Status,
				},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func (h *Handler) ListMyDisputes(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	filter := DisputeListFilter{
		UserID:   userID,
		RoleID:   roleID,
		Status:   c.Query("status"),
		Page:     parseIntWithDefault(c.Query("page"), 1),
		PageSize: parseIntWithDefault(c.Query("page_size"), 20),
	}
	if orderID := parseOptionalInt64(c.Query("order_id")); orderID != nil {
		filter.OrderID = orderID
	}
	if jobID := parseOptionalInt64(c.Query("job_id")); jobID != nil {
		filter.JobID = jobID
	}

	items, err := h.service.ListDisputes(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load disputes",
		})
	}

	return c.JSON(fiber.Map{
		"items":     items,
		"page":      filter.Page,
		"page_size": filter.PageSize,
	})
}

func (h *Handler) GetAdminDisputeSummary(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	summary, err := h.service.GetAdminDisputeSummary(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load dispute summary",
		})
	}

	return c.JSON(summary)
}

func (h *Handler) CreateAdminDispute(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	var req AdminCreateDisputeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid request payload",
		})
	}

	resp, err := h.service.CreateAdminDispute(c.Context(), userID, roleID, req)
	if err != nil {
		var duplicateErr *DuplicateDisputeError
		if errors.As(err, &duplicateErr) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "duplicate_dispute",
				"message": duplicateErr.Error(),
				"existing_case": fiber.Map{
					"case_id":        duplicateErr.ExistingCase.CaseID,
					"case_reference": duplicateErr.ExistingCase.CaseReference,
					"status":         duplicateErr.ExistingCase.Status,
				},
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func (h *Handler) GetAdminDisputeOptions(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	resp, err := h.service.GetAdminDisputeOptions(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load dispute options",
		})
	}

	return c.JSON(resp)
}

func (h *Handler) ListAdminDisputeUsers(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	items, err := h.service.ListAdminDisputeUsers(c.Context(), DisputeUserFilter{
		Role: c.Query("role"),
		Q:    c.Query("q"),
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"items": items})
}

func (h *Handler) SearchAdminDisputeOrders(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	filter := AdminOrderSearchFilter{
		Phone:    strings.TrimSpace(c.Query("phone")),
		Page:     parseIntWithDefault(c.Query("page"), 1),
		PageSize: parseIntWithDefault(c.Query("page_size"), 20),
	}
	if orderID := parseOptionalInt64(c.Query("order_id")); orderID != nil {
		filter.OrderID = orderID
	}

	dateFrom, err := parseOptionalDate(c.Query("date_from"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "date_from must be YYYY-MM-DD",
		})
	}
	filter.DateFrom = dateFrom

	dateTo, err := parseOptionalDate(c.Query("date_to"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "date_to must be YYYY-MM-DD",
		})
	}
	filter.DateTo = dateTo

	resp, err := h.service.SearchAdminDisputeOrders(c.Context(), filter)
	if err != nil {
		if err.Error() == "phone or order_id is required" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "validation_error",
				"message": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load matching orders",
		})
	}

	return c.JSON(resp)
}

func (h *Handler) GetAdminDisputeOrderContext(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	orderID := parseOptionalInt64(c.Query("order_id"))
	if orderID == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "order_id is required",
		})
	}

	resp, err := h.service.GetAdminDisputeOrderContext(c.Context(), *orderID)
	if err != nil {
		if err.Error() == "order_id is required" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "validation_error",
				"message": err.Error(),
			})
		}
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "order context not found",
		})
	}

	return c.JSON(resp)
}

func (h *Handler) ListAdminDisputeFollowups(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	filter := AdminDisputeFollowupFilter{
		Bucket:   c.Query("bucket"),
		Page:     parseIntWithDefault(c.Query("page"), 1),
		PageSize: parseIntWithDefault(c.Query("page_size"), 20),
	}
	if assignedUserID := parseOptionalInt64(c.Query("assigned_user_id")); assignedUserID != nil {
		filter.AssignedUserID = assignedUserID
	}
	filter.AssignedRole = c.Query("assigned_role")

	resp, err := h.service.ListAdminDisputeFollowups(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load dispute follow-ups",
		})
	}

	return c.JSON(resp)
}

func (h *Handler) ListAdminDisputes(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	filter := AdminDisputeListFilter{
		Status:        c.Query("status"),
		Priority:      c.Query("priority"),
		Severity:      c.Query("severity"),
		SourceChannel: c.Query("source_channel"),
		AssignedRole:  c.Query("assigned_role"),
		DueState:      c.Query("due_state"),
		Page:          parseIntWithDefault(c.Query("page"), 1),
		PageSize:      parseIntWithDefault(c.Query("page_size"), 20),
	}
	if issueTypeID := parseOptionalInt64(c.Query("issue_type_id")); issueTypeID != nil {
		filter.IssueTypeID = issueTypeID
	}
	if assignedUserID := parseOptionalInt64(c.Query("assigned_user_id")); assignedUserID != nil {
		filter.AssignedUserID = assignedUserID
	}
	if orderID := parseOptionalInt64(c.Query("order_id")); orderID != nil {
		filter.OrderID = orderID
	}
	if jobID := parseOptionalInt64(c.Query("job_id")); jobID != nil {
		filter.JobID = jobID
	}
	if paymentID := parseOptionalInt64(c.Query("payment_id")); paymentID != nil {
		filter.PaymentID = paymentID
	}
	if shipmentID := parseOptionalInt64(c.Query("shipment_id")); shipmentID != nil {
		filter.ShipmentID = shipmentID
	}

	items, err := h.service.ListAdminDisputes(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "server_error",
			"message": "failed to load dispute queue",
		})
	}

	return c.JSON(fiber.Map{
		"items":     items,
		"page":      filter.Page,
		"page_size": filter.PageSize,
	})
}

func (h *Handler) GetDisputeByID(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	item, err := h.service.GetDisputeByID(c.Context(), caseID, userID, roleID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "dispute not found",
		})
	}

	return c.JSON(item)
}

func (h *Handler) GetAdminDisputeWorkbench(c *fiber.Ctx) error {
	_, _, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	item, err := h.service.GetAdminDisputeWorkbench(c.Context(), caseID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "dispute workbench not found",
		})
	}

	return c.JSON(item)
}

func (h *Handler) ListDisputeActions(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	items, err := h.service.ListDisputeActions(c.Context(), caseID, userID, roleID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "dispute actions not found",
		})
	}

	return c.JSON(fiber.Map{"items": items})
}

func (h *Handler) AddAdminDisputeAction(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	var req AdminAddDisputeActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid request payload",
		})
	}

	resp, err := h.service.AddAdminDisputeAction(c.Context(), caseID, userID, roleID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.JSON(resp)
}

func (h *Handler) AssignAdminDispute(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	var req AssignDisputeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid request payload",
		})
	}

	if err := h.service.AssignAdminDispute(c.Context(), caseID, userID, roleID, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"message": "case assigned successfully"})
}

func (h *Handler) UpsertAdminDisputeResolution(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	var req UpsertDisputeResolutionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid request payload",
		})
	}

	item, err := h.service.UpsertAdminDisputeResolution(c.Context(), caseID, userID, roleID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.JSON(item)
}

func (h *Handler) AddDisputeEvidence(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "image is required",
		})
	}

	req, err := parseAddDisputeEvidenceRequest(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	item, err := h.service.AddDisputeEvidence(c.Context(), caseID, userID, roleID, fileHeader, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"evidence_id": item.EvidenceID,
		"file_url":    item.FileURL,
		"message":     "evidence uploaded successfully",
	})
}

func (h *Handler) ReplaceDisputeEvidence(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}
	evidenceID, err := strconv.ParseInt(c.Params("evidence_id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid evidence id",
		})
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "image is required",
		})
	}

	req, err := parseAddDisputeEvidenceRequest(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	item, err := h.service.ReplaceDisputeEvidence(c.Context(), caseID, evidenceID, userID, roleID, fileHeader, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"evidence_id": item.EvidenceID,
		"file_url":    item.FileURL,
		"message":     "evidence reuploaded successfully",
	})
}

func (h *Handler) ListDisputeEvidence(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}

	items, err := h.service.ListDisputeEvidence(c.Context(), caseID, userID, roleID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "dispute evidence not found",
		})
	}

	return c.JSON(fiber.Map{"items": items})
}

func (h *Handler) GetDisputeEvidenceFile(c *fiber.Ctx) error {
	userID, roleID, ok := getAuthContext(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "unauthorized",
			"message": "user not authenticated",
		})
	}

	caseID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid case id",
		})
	}
	evidenceID, err := strconv.ParseInt(c.Params("evidence_id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation_error",
			"message": "invalid evidence id",
		})
	}

	item, err := h.service.GetDisputeEvidenceFile(c.Context(), caseID, evidenceID, userID, roleID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "evidence file not found",
		})
	}

	if _, err := os.Stat(item.FileStorageKey); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "not_found",
			"message": "stored evidence file is missing",
		})
	}

	c.Set(fiber.HeaderContentType, item.MimeType)
	return c.SendFile(item.FileStorageKey)
}

func getAuthContext(c *fiber.Ctx) (int64, int, bool) {
	userLocal := c.Locals("user_id")
	roleLocal := c.Locals("role_id")
	if userLocal == nil || roleLocal == nil {
		return 0, 0, false
	}

	userFloat, ok := userLocal.(float64)
	if !ok {
		return 0, 0, false
	}
	roleFloat, ok := roleLocal.(float64)
	if !ok {
		return 0, 0, false
	}

	return int64(userFloat), int(roleFloat), true
}

func parseAddDisputeEvidenceRequest(c *fiber.Ctx) (AddDisputeEvidenceRequest, error) {
	req := AddDisputeEvidenceRequest{
		Caption:       c.FormValue("caption"),
		CaptureSource: strings.TrimSpace(c.FormValue("capture_source")),
	}

	latRaw := strings.TrimSpace(c.FormValue("captured_latitude"))
	lngRaw := strings.TrimSpace(c.FormValue("captured_longitude"))
	if (latRaw == "") != (lngRaw == "") {
		return req, errors.New("captured_latitude and captured_longitude must be sent together")
	}
	if latRaw != "" {
		lat, err := strconv.ParseFloat(latRaw, 64)
		if err != nil {
			return req, errors.New("captured_latitude must be a valid number")
		}
		lng, err := strconv.ParseFloat(lngRaw, 64)
		if err != nil {
			return req, errors.New("captured_longitude must be a valid number")
		}
		req.CapturedLatitude = &lat
		req.CapturedLongitude = &lng
	}

	capturedAtRaw := strings.TrimSpace(c.FormValue("captured_at"))
	if capturedAtRaw != "" {
		parsedAt, err := time.Parse(time.RFC3339, capturedAtRaw)
		if err != nil {
			return req, errors.New("captured_at must be RFC3339")
		}
		req.CapturedAt = &parsedAt
	}

	return req, nil
}

func parseOptionalInt64(value string) *int64 {
	if value == "" {
		return nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

func parseIntWithDefault(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func parseOptionalDate(value string) (*time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
