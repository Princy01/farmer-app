package banking

import "os"

type Config struct {
	MerchantID  string
	MerchantKey string
	GatewayURL  string
	ReturnURL   string
	CallbackURL string
}

func GetMerchantCredentials() *MerchantCredentials {
	return &MerchantCredentials{
		MerchantID:  os.Getenv("BANKING_MERCHANT_ID"),
		MerchantKey: os.Getenv("BANKING_MERCHANT_KEY"),
	}
}

func GetGatewayURL() string {
	return os.Getenv("BANKING_GATEWAY_URL")
}

func GetGatewayReturnURL() string {
	return os.Getenv("BANKING_RETURN_URL")
}

func GetGatewayCallbackURL() string {
	return os.Getenv("BANKING_CALLBACK_URL")
}
