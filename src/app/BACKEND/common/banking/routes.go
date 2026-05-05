package banking

import (
	"farmerapp/internal/common/auth"

	"github.com/gofiber/fiber/v2"
)

type BankingRouter struct {
	handler *PaymentHandler
}

func InitializeBankingModule() *BankingRouter {

	repo := NewPaymentRepository()

	merchant := GetMerchantCredentials()
	gatewayURL := GetGatewayURL()

	service := NewPaymentService(repo, merchant, gatewayURL)

	handler := NewPaymentHandler(service)
	return &BankingRouter{handler: handler}
}

func (router *BankingRouter) RegisterRoutes(r fiber.Router) {
	middleware := auth.AuthMiddleware()
	g := r.Group("/payments")
	// Protected endpoints
	g.Post("/initiate", middleware, router.handler.InitiatePayment)
	g.Get("/status/:order_id", middleware, router.handler.GetPaymentStatus)
	g.Get("/orders", middleware, router.handler.GetUserOrders)
	g.Post("/cancel/:order_id", middleware, router.handler.CancelOrder)

	// Webhook endpoint (public - called by gateway)
	g.Post("/callback", router.handler.HandleCallback)

	// Return URL endpoint (public - user redirect from gateway)
	g.Get("/return", router.handler.HandleReturn)
}
