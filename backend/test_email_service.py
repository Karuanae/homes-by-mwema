from datetime import date
from decimal import Decimal
import importlib.util
from pathlib import Path
from types import SimpleNamespace

email_service_spec = importlib.util.spec_from_file_location(
    "email_service_under_test",
    Path(__file__).parent / "views" / "email_service.py",
)
assert email_service_spec and email_service_spec.loader
email_service_module = importlib.util.module_from_spec(email_service_spec)
email_service_spec.loader.exec_module(email_service_module)
EmailService = email_service_module.EmailService
_confirmation_email_html = email_service_module._confirmation_email_html


def _booking_and_user():
    prop = SimpleNamespace(
        name="Mwema Apartment",
        type="Apartment",
        formatted_address="Nairobi, Kenya",
        location="Nairobi",
        rooms=2,
        bathrooms=1,
        specs={},
        amenities=[],
        host=None,
    )
    booking = SimpleNamespace(
        id=42,
        property=prop,
        check_in=date(2026, 12, 1),
        check_out=date(2026, 12, 4),
        nights=3,
        guests={"adults": 2},
        total_amount=Decimal("15000"),
    )
    user = SimpleNamespace(name="Guest", email="guest@example.com")
    payment = SimpleNamespace(
        amount=Decimal("12500"),
        method="mpesa",
        mpesa_receipt_number="ABC123",
        transaction_id=None,
    )
    return booking, user, payment


def test_booking_confirmation_goes_to_booking_owners_account_email():
    booking, user, payment = _booking_and_user()
    service = EmailService()
    sent = {}

    def capture_email(**message):
        sent.update(message)
        return {"success": True}

    service._send = capture_email

    result = service.send_booking_confirmation(
        booking, user, payment, amount_paid=Decimal("12500")
    )

    assert result["success"] is True
    assert sent["to"] == "guest@example.com"


def test_confirmation_contains_paid_amount_and_room_details():
    booking, user, payment = _booking_and_user()

    html = _confirmation_email_html(
        booking, user, payment, amount_paid=Decimal("12500")
    )

    assert "Mwema Apartment" in html
    assert "Apartment" in html
    assert "Nairobi, Kenya" in html
    assert "Rooms / bedrooms" in html
    assert "Bathrooms" in html
    assert "KES 12,500" in html
    assert "KES 15,000" in html
