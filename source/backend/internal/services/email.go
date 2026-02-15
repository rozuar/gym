package services

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"boxmagic/internal/config"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

func (s *EmailService) Send(to, subject, htmlBody string) error {
	if !s.cfg.EmailEnabled {
		log.Printf("[email] (disabled) To: %s, Subject: %s", to, subject)
		return nil
	}

	from := s.cfg.SMTPFrom
	// Extract email address from "Name <email>" format
	fromAddr := from
	if idx := strings.Index(from, "<"); idx >= 0 {
		fromAddr = strings.Trim(from[idx:], "<>")
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		from, to, subject, htmlBody)

	auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)
	addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)

	if err := smtp.SendMail(addr, auth, fromAddr, []string{to}, []byte(msg)); err != nil {
		log.Printf("[email] Error sending to %s: %v", to, err)
		return err
	}

	log.Printf("[email] Sent to %s: %s", to, subject)
	return nil
}

func (s *EmailService) SendBookingConfirmation(email, userName, className, date, time string) error {
	subject := fmt.Sprintf("Reserva confirmada - %s", className)
	body := fmt.Sprintf(`<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
		<h2 style="color:#10b981">Reserva Confirmada</h2>
		<p>Hola <strong>%s</strong>,</p>
		<p>Tu reserva ha sido confirmada:</p>
		<div style="background:#f4f4f5;padding:15px;border-radius:8px;margin:15px 0">
			<p style="margin:5px 0"><strong>Clase:</strong> %s</p>
			<p style="margin:5px 0"><strong>Fecha:</strong> %s</p>
			<p style="margin:5px 0"><strong>Hora:</strong> %s</p>
		</div>
		<p style="color:#71717a;font-size:14px">Recuerda llegar 10 minutos antes.</p>
		<hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
		<p style="color:#a1a1aa;font-size:12px">Box Magic</p>
	</div>`, userName, className, date, time)

	return s.Send(email, subject, body)
}

func (s *EmailService) SendBookingCancellation(email, userName, className, date, time string) error {
	subject := fmt.Sprintf("Reserva cancelada - %s", className)
	body := fmt.Sprintf(`<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
		<h2 style="color:#ef4444">Reserva Cancelada</h2>
		<p>Hola <strong>%s</strong>,</p>
		<p>Tu reserva ha sido cancelada:</p>
		<div style="background:#f4f4f5;padding:15px;border-radius:8px;margin:15px 0">
			<p style="margin:5px 0"><strong>Clase:</strong> %s</p>
			<p style="margin:5px 0"><strong>Fecha:</strong> %s</p>
			<p style="margin:5px 0"><strong>Hora:</strong> %s</p>
		</div>
		<p>Tus creditos han sido devueltos.</p>
		<hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
		<p style="color:#a1a1aa;font-size:12px">Box Magic</p>
	</div>`, userName, className, date, time)

	return s.Send(email, subject, body)
}

func (s *EmailService) SendClassCancelled(email, userName, className, date, time string) error {
	subject := fmt.Sprintf("Clase cancelada - %s", className)
	body := fmt.Sprintf(`<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
		<h2 style="color:#f59e0b">Clase Cancelada</h2>
		<p>Hola <strong>%s</strong>,</p>
		<p>Lamentamos informarte que la siguiente clase ha sido cancelada:</p>
		<div style="background:#f4f4f5;padding:15px;border-radius:8px;margin:15px 0">
			<p style="margin:5px 0"><strong>Clase:</strong> %s</p>
			<p style="margin:5px 0"><strong>Fecha:</strong> %s</p>
			<p style="margin:5px 0"><strong>Hora:</strong> %s</p>
		</div>
		<p>Tus creditos han sido devueltos automaticamente.</p>
		<p>Disculpa las molestias.</p>
		<hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
		<p style="color:#a1a1aa;font-size:12px">Box Magic</p>
	</div>`, userName, className, date, time)

	return s.Send(email, subject, body)
}
