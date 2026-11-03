# Backend email delivery

Booking confirmations are sent to the email address on the account that owns
the booking, after its payment is confirmed. The message includes the booked
property, stay dates, room and bathroom counts, payment amount, booking total,
and payment reference when available.

Configure one provider in the backend deployment environment:

- **Resend:** set `RESEND_API_KEY` and `MAIL_DEFAULT_SENDER` to an address on a
  domain verified with Resend. Optionally set `MAIL_FROM_NAME`.
- **SMTP fallback:** set `MAIL_USERNAME`, `MAIL_PASSWORD`, and
  `MAIL_DEFAULT_SENDER`. Configure `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`,
  and `MAIL_USE_SSL` for the chosen SMTP provider as needed.

If neither provider is configured, booking payments still complete, but email
delivery is unavailable and the backend logs the delivery failure. Keep
provider credentials in the deployment's secret/environment-variable settings;
do not commit them to the repository.
