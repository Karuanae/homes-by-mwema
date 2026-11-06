# Backend email delivery

Booking confirmations are sent to the email address on the account that owns
the booking, after its payment is confirmed. The message includes the booked
property, stay dates, room and bathroom counts, payment amount, booking total,
and payment reference when available.

Configure email delivery in the backend deployment environment:

- **Truehost SMTP:** the backend defaults to `das105.truehost.cloud` on port
  `465` with implicit SSL, authenticating and sending as
  `info@homesbymwema.com`. Set `MAIL_PASSWORD` to that mailbox's password in
  the backend deployment's secret/environment-variable settings.
- The SMTP settings can be overridden with `MAIL_SERVER`, `MAIL_PORT`,
  `MAIL_USE_SSL`, `MAIL_USE_TLS`, `MAIL_USERNAME`, and
  `MAIL_DEFAULT_SENDER`. Set `MAIL_FROM_NAME` to change the displayed sender
  name. For Truehost's port 465 setup, keep `MAIL_USE_SSL=true` and
  `MAIL_USE_TLS=false`.

If the mailbox password is missing, booking payments still complete, but email
delivery is unavailable and the backend logs the delivery failure. Keep
credentials in the deployment's secret/environment-variable settings; do not
commit them to the repository or share them in chat.
