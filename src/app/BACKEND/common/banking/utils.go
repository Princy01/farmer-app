package banking

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/rand"
)

func GenerateChecksum(data, secret string) string {
	hash := sha256.Sum256([]byte(data + secret))
	return hex.EncodeToString(hash[:])
}

func GeneratePaymentChecksum(merchantID, orderID, amount, secret string) string {
	data := fmt.Sprintf("%s|%s|%s", merchantID, orderID, amount)
	return GenerateChecksum(data, secret)
}

func GenerateOrderID() string {
	return fmt.Sprintf("ORDER_NO_%s", GenerateRandomNumber())
}

func GenerateRandomNumber() string {
	num := rand.Intn(1000001)
	return fmt.Sprintf("%07d", num)
}
