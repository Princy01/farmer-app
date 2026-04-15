package disputes

import (
	"farmerapp/internal/common/auth"

	"github.com/gofiber/fiber/v2"
)

type Router struct {
	handler *Handler
}

func InitializeModule() *Router {
	repository := NewRepository()
	service := NewService(repository)
	handler := NewHandler(service)
	return &Router{handler: handler}
}

func (r *Router) RegisterRoutes(app fiber.Router, admin fiber.Router) {
	secured := app.Group("", auth.AuthMiddleware())

	secured.Get("/issue-types", r.handler.GetIssueTypes)
	secured.Post("/disputes", r.handler.CreateDispute)
	secured.Get("/disputes", r.handler.ListMyDisputes)
	secured.Get("/disputes/:id", r.handler.GetDisputeByID)
	secured.Get("/disputes/:id/actions", r.handler.ListDisputeActions)
	secured.Post("/disputes/:id/evidence", r.handler.AddDisputeEvidence)
	secured.Get("/disputes/:id/evidence", r.handler.ListDisputeEvidence)
	secured.Get("/disputes/:id/evidence/:evidence_id/file", r.handler.GetDisputeEvidenceFile)

	_ = admin
}
