package handlers

import (
	"errors"
	"strconv"
	"strings"

	"farmerapp/internal/admin/models"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) GetPeerRatingDashboard(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.GetPeerRatingDashboard(models.PeerRatingDashboardFilter{
		Page:       page,
		PageSize:   pageSize,
		EntityType: c.Query("entity_type"),
		Query:      c.Query("q"),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch ratings dashboard"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) GetPeerRatingContext(c *fiber.Ctx) error {
	orderID, err := strconv.ParseInt(strings.TrimSpace(c.Query("order_id")), 10, 64)
	if err != nil || orderID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "order_id is required"})
	}

	jobID, err := parseOptionalInt64Query(c.Query("job_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid job_id"})
	}

	resp, err := h.service.GetPeerRatingContext(orderID, jobID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch peer rating context"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) CreatePeerRating(c *fiber.Ctx) error {
	actorUserID, _, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req models.PeerRatingSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	resp, err := h.service.CreatePeerRating(actorUserID, req)
	if err != nil {
		switch {
		case errors.Is(err, fiber.ErrBadRequest):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		case isPeerRatingValidationError(err):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		case strings.Contains(err.Error(), "already exists"):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to capture peer rating"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func parseOptionalInt64Query(raw string) (*int64, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return nil, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func isPeerRatingValidationError(err error) bool {
	if err == nil {
		return false
	}

	message := err.Error()
	switch {
	case strings.Contains(message, "required"):
		return true
	case strings.Contains(message, "must be"):
		return true
	case strings.Contains(message, "eligible"):
		return true
	case strings.Contains(message, "valid for this order"):
		return true
	default:
		return false
	}
}
