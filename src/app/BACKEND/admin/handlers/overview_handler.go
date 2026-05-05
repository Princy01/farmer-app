package handlers

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

func (h *AdminHandler) GetBuyerOverview(c *fiber.Ctx) error {
	businessID, err := parseOverviewID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid buyer id"})
	}

	overview, err := h.service.GetBuyerOverview(businessID)
	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "buyer not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch buyer overview"})
	}
	return c.JSON(overview)
}

func (h *AdminHandler) GetWholesalerOverview(c *fiber.Ctx) error {
	businessID, err := parseOverviewID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid wholesaler id"})
	}

	overview, err := h.service.GetWholesalerOverview(businessID)
	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "wholesaler not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch wholesaler overview"})
	}
	return c.JSON(overview)
}

func (h *AdminHandler) GetTransporterOverview(c *fiber.Ctx) error {
	driverID, err := parseOverviewID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid transporter id"})
	}

	overview, err := h.service.GetTransporterOverview(driverID)
	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "transporter not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch transporter overview"})
	}
	return c.JSON(overview)
}

func parseOverviewID(c *fiber.Ctx, param string) (int64, error) {
	return strconv.ParseInt(c.Params(param), 10, 64)
}
