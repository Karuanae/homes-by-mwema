"""
Booking Cancellation Test Suite
================================
Tests all 7 cancellation scenarios without waiting real days.
Dates are injected via freezegun or direct datetime patching.

Install deps:
    pip install pytest freezegun

Run:
    pytest test_cancellation.py -v
"""

try:
    import pytest
except ImportError:
    pytest = None

from datetime import datetime, timedelta, date
from decimal import Decimal
from unittest.mock import patch, MagicMock


# ─────────────────────────────────────────────
#  Minimal stubs so tests run without Flask app
# ─────────────────────────────────────────────

class MockDB:
    """Minimal db session stub."""
    def __init__(self):
        self._committed = False
        self._rolled_back = False

    def commit(self):
        self._committed = True

    def rollback(self):
        self._rolled_back = True


class MockBooking:
    """
    Mirrors the Booking model fields used in cancel_booking() and
    calculate_refund_amount().
    """
    _id_counter = 1

    def __init__(
        self,
        check_in: date,
        check_out: date,
        total_amount: float = 10000.0,
        status: str = "confirmed",
        payment_status: str = "completed",
        expires_at: datetime = None,
        user_id: int = 1,
    ):
        self.id = MockBooking._id_counter
        MockBooking._id_counter += 1

        self.user_id = user_id
        self.check_in = check_in
        self.check_out = check_out
        self.nights = (check_out - check_in).days
        self.total_amount = Decimal(str(total_amount))
        self.status = status
        self.payment_status = payment_status
        self.expires_at = expires_at
        self.cancelled_at = None
        self.cancellation_fee = Decimal("0")
        self.refund_amount = Decimal("0")
        self.updated_at = datetime.utcnow()
        self.cancellation_deadline_30 = None
        self.cancellation_deadline_14 = None

    # ── Methods copied verbatim from models.py ──────────────────────────────

    def calculate_cancellation_deadlines(self):
        if self.check_in:
            self.cancellation_deadline_30 = self.check_in - timedelta(days=30)
            self.cancellation_deadline_14 = self.check_in - timedelta(days=14)

    def calculate_refund_amount(self):
        if not self.check_in:
            return 0, 0

        now = datetime.now().date()
        days_until_checkin = (self.check_in - now).days

        if days_until_checkin >= 30:
            fee_amount = 0
            refund_amount = float(self.total_amount)
        elif days_until_checkin >= 14:
            fee_amount = float(self.total_amount) * 0.5
            refund_amount = float(self.total_amount) * 0.5
        else:
            fee_amount = float(self.total_amount)
            refund_amount = 0

        return fee_amount, refund_amount


# ─────────────────────────────────────────────
#  Pure unit tests for calculate_refund_amount
# ─────────────────────────────────────────────

class TestRefundCalculation:
    """Tests the refund maths directly — no Flask needed."""

    def _booking(self, days_from_today: int, total: float = 10000.0) -> MockBooking:
        today = date.today()
        check_in = today + timedelta(days=days_from_today)
        check_out = check_in + timedelta(days=3)
        return MockBooking(check_in=check_in, check_out=check_out, total_amount=total)

    def test_full_refund_exactly_30_days(self):
        booking = self._booking(30)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 0
        assert refund == 10000.0, f"Expected 10000.0 refund, got {refund}"

    def test_full_refund_35_days_out(self):
        booking = self._booking(35)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 0
        assert refund == 10000.0

    def test_partial_refund_exactly_14_days(self):
        booking = self._booking(14)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 5000.0, f"Expected 5000.0 fee, got {fee}"
        assert refund == 5000.0, f"Expected 5000.0 refund, got {refund}"

    def test_partial_refund_20_days_out(self):
        booking = self._booking(20)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 5000.0
        assert refund == 5000.0

    def test_partial_refund_29_days_out(self):
        booking = self._booking(29)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 5000.0
        assert refund == 5000.0

    def test_no_refund_13_days_out(self):
        booking = self._booking(13)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 10000.0
        assert refund == 0

    def test_no_refund_1_day_out(self):
        booking = self._booking(1)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 10000.0
        assert refund == 0

    def test_no_refund_today_checkin(self):
        """check_in == today: days_until_checkin == 0 → no refund."""
        booking = self._booking(0)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 10000.0
        assert refund == 0

    def test_fee_plus_refund_always_equals_total(self):
        for days in [0, 1, 13, 14, 20, 29, 30, 35, 60]:
            b = self._booking(days)
            fee, refund = b.calculate_refund_amount()
            assert abs(fee + refund - float(b.total_amount)) < 0.01, (
                f"days={days}: fee({fee}) + refund({refund}) != total({b.total_amount})"
            )

    def test_custom_amount(self):
        booking = self._booking(20, total=7500.0)
        fee, refund = booking.calculate_refund_amount()
        assert fee == 3750.0
        assert refund == 3750.0


# ─────────────────────────────────────────────
#  Tests for cancel_booking guard logic
#  (extracted so we can unit-test without Flask)
# ─────────────────────────────────────────────

def simulate_cancel(booking: MockBooking, today_override: date = None) -> dict:
    """
    Reproduces the guard logic from views/booking.py cancel_booking()
    without needing Flask or a real DB session.

    Returns a dict with:
        success (bool)
        error   (str | None)
        refund_amount (float)
        fee_amount    (float)
    """
    now_date = today_override or date.today()
    now_dt   = datetime.combine(now_date, datetime.min.time())

    # Guard 1: expired booking
    if booking.status == "pending" and booking.expires_at and booking.expires_at < datetime.utcnow():
        booking.status = "expired"
        return {"success": False, "error": "Booking has expired and cannot be cancelled", "expired": True}

    if booking.status == "expired":
        return {"success": False, "error": "Booking has expired and cannot be cancelled", "expired": True}

    # Guard 2: already cancelled
    if booking.status == "cancelled":
        return {"success": False, "error": "Booking already cancelled"}

    # Guard 3: stay already started
    if booking.check_in <= now_date:
        return {"success": False, "error": "Cannot cancel booking that has already started", "can_cancel": False}

    # Calculate deadlines
    booking.calculate_cancellation_deadlines()

    # Calculate refund
    fee_amount, refund_amount = booking.calculate_refund_amount()

    # Apply cancellation
    booking.status = "cancelled"
    booking.cancelled_at = now_dt
    booking.cancellation_fee = Decimal(str(fee_amount))
    booking.refund_amount = Decimal(str(refund_amount))
    booking.updated_at = now_dt

    return {
        "success": True,
        "refund_amount": refund_amount,
        "fee_amount": fee_amount,
        "cancelled_at": booking.cancelled_at.isoformat(),
    }


class TestCancellationGuards:
    """Tests the 7 real-world scenarios."""

    # ── Test 1: Cancel a pending booking (never paid) ────────────────────
    def test_cancel_pending_booking_no_payment(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=40),
            check_out=today + timedelta(days=43),
            status="pending",
            payment_status="pending",
            expires_at=datetime.utcnow() + timedelta(minutes=10),  # still active
        )
        result = simulate_cancel(booking)

        assert result["success"] is True, result.get("error")
        assert booking.status == "cancelled"
        assert result["refund_amount"] == float(booking.total_amount)  # full refund (>30 days)
        assert result["fee_amount"] == 0
        print(f"\n✅ Test 1 PASS — pending booking cancelled, full refund indicated")

    # ── Test 2: Cancel ≥ 30 days before check-in → 100% refund ──────────
    def test_cancel_30_plus_days_out_full_refund(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=35),
            check_out=today + timedelta(days=38),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is True, result.get("error")
        assert result["refund_amount"] == 10000.0
        assert result["fee_amount"] == 0
        assert booking.status == "cancelled"
        print(f"\n✅ Test 2 PASS — 35 days out → 100% refund KES {result['refund_amount']}")

    # ── Test 3: Cancel 14–29 days before check-in → 50% refund ─────────
    def test_cancel_14_to_29_days_out_partial_refund(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=20),
            check_out=today + timedelta(days=23),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is True, result.get("error")
        assert result["refund_amount"] == 5000.0
        assert result["fee_amount"] == 5000.0
        assert booking.status == "cancelled"
        print(f"\n✅ Test 3 PASS — 20 days out → 50% refund KES {result['refund_amount']}, fee KES {result['fee_amount']}")

    # ── Test 4: Cancel < 14 days before check-in → no refund ────────────
    def test_cancel_under_14_days_no_refund(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=10),
            check_out=today + timedelta(days=13),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is True, result.get("error")
        assert result["refund_amount"] == 0
        assert result["fee_amount"] == 10000.0
        assert booking.status == "cancelled"
        print(f"\n✅ Test 4 PASS — 10 days out → no refund, full fee KES {result['fee_amount']}")

    # ── Test 5: Cancel an expired booking → rejected ─────────────────────
    def test_cancel_expired_booking_rejected(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=20),
            check_out=today + timedelta(days=23),
            status="pending",
            expires_at=datetime.utcnow() - timedelta(minutes=5),  # expired 5 mins ago
        )
        result = simulate_cancel(booking)

        assert result["success"] is False
        assert "expired" in result["error"].lower()
        assert booking.status == "expired"
        print(f"\n✅ Test 5 PASS — expired booking rejected: '{result['error']}'")

    # ── Test 6: Cancel a booking whose check-in is today → rejected ──────
    def test_cancel_checkin_today_rejected(self):
        today = date.today()
        booking = MockBooking(
            check_in=today,
            check_out=today + timedelta(days=3),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is False
        assert "already started" in result["error"].lower()
        assert booking.status == "confirmed"  # unchanged
        print(f"\n✅ Test 6 PASS — check-in today rejected: '{result['error']}'")

    # ── Test 7: Double cancel → rejected ─────────────────────────────────
    def test_double_cancel_rejected(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=20),
            check_out=today + timedelta(days=23),
            status="confirmed",
        )
        # First cancel
        result1 = simulate_cancel(booking)
        assert result1["success"] is True

        # Second cancel
        result2 = simulate_cancel(booking)
        assert result2["success"] is False
        assert "already cancelled" in result2["error"].lower()
        print(f"\n✅ Test 7 PASS — double cancel rejected: '{result2['error']}'")

    # ── Bonus: Check-in is yesterday (past stay) → rejected ──────────────
    def test_cancel_past_checkin_rejected(self):
        today = date.today()
        booking = MockBooking(
            check_in=today - timedelta(days=1),
            check_out=today + timedelta(days=2),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is False
        assert "already started" in result["error"].lower()
        print(f"\n✅ Bonus PASS — past check-in rejected: '{result['error']}'")

    # ── Boundary: exactly 14 days is still partial refund ────────────────
    def test_boundary_exactly_14_days(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=14),
            check_out=today + timedelta(days=17),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is True
        assert result["refund_amount"] == 5000.0
        assert result["fee_amount"] == 5000.0
        print(f"\n✅ Boundary PASS — exactly 14 days → partial refund")

    # ── Boundary: exactly 30 days is still full refund ───────────────────
    def test_boundary_exactly_30_days(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=30),
            check_out=today + timedelta(days=33),
            status="confirmed",
        )
        result = simulate_cancel(booking)

        assert result["success"] is True
        assert result["refund_amount"] == 10000.0
        assert result["fee_amount"] == 0
        print(f"\n✅ Boundary PASS — exactly 30 days → full refund")

    # ── Cancellation deadlines are stored correctly ───────────────────────
    def test_cancellation_deadlines_stored(self):
        today = date.today()
        check_in = today + timedelta(days=40)
        booking = MockBooking(
            check_in=check_in,
            check_out=check_in + timedelta(days=3),
            status="confirmed",
        )
        simulate_cancel(booking)

        assert booking.cancellation_deadline_30 == check_in - timedelta(days=30)
        assert booking.cancellation_deadline_14 == check_in - timedelta(days=14)
        print(f"\n✅ Deadline PASS — 30-day: {booking.cancellation_deadline_30}, 14-day: {booking.cancellation_deadline_14}")

    # ── cancelled_at timestamp is set ────────────────────────────────────
    def test_cancelled_at_timestamp_set(self):
        today = date.today()
        booking = MockBooking(
            check_in=today + timedelta(days=40),
            check_out=today + timedelta(days=43),
            status="confirmed",
        )
        simulate_cancel(booking)

        assert booking.cancelled_at is not None
        assert isinstance(booking.cancelled_at, datetime)
        assert booking.cancelled_at.date() == today
        print(f"\n✅ Timestamp PASS — cancelled_at set to {booking.cancelled_at}")


# ─────────────────────────────────────────────
#  Summary report
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("  Booking Cancellation Test Suite")
    print("=" * 60)

    refund_suite = TestRefundCalculation()
    guard_suite  = TestCancellationGuards()

    tests = [
        ("Refund: full refund exactly 30 days",      refund_suite.test_full_refund_exactly_30_days),
        ("Refund: full refund 35 days out",           refund_suite.test_full_refund_35_days_out),
        ("Refund: partial exactly 14 days",           refund_suite.test_partial_refund_exactly_14_days),
        ("Refund: partial 20 days out",               refund_suite.test_partial_refund_20_days_out),
        ("Refund: partial 29 days out",               refund_suite.test_partial_refund_29_days_out),
        ("Refund: no refund 13 days out",             refund_suite.test_no_refund_13_days_out),
        ("Refund: no refund 1 day out",               refund_suite.test_no_refund_1_day_out),
        ("Refund: no refund checkin today",           refund_suite.test_no_refund_today_checkin),
        ("Refund: fee + refund == total always",      refund_suite.test_fee_plus_refund_always_equals_total),
        ("Refund: custom amount",                     refund_suite.test_custom_amount),
        ("Cancel: pending booking (no payment)",      guard_suite.test_cancel_pending_booking_no_payment),
        ("Cancel: ≥30 days → 100% refund",           guard_suite.test_cancel_30_plus_days_out_full_refund),
        ("Cancel: 14-29 days → 50% refund",          guard_suite.test_cancel_14_to_29_days_out_partial_refund),
        ("Cancel: <14 days → no refund",             guard_suite.test_cancel_under_14_days_no_refund),
        ("Cancel: expired booking rejected",          guard_suite.test_cancel_expired_booking_rejected),
        ("Cancel: check-in today rejected",           guard_suite.test_cancel_checkin_today_rejected),
        ("Cancel: double cancel rejected",            guard_suite.test_double_cancel_rejected),
        ("Cancel: past check-in rejected",            guard_suite.test_cancel_past_checkin_rejected),
        ("Boundary: exactly 14 days",                 guard_suite.test_boundary_exactly_14_days),
        ("Boundary: exactly 30 days",                 guard_suite.test_boundary_exactly_30_days),
        ("Deadlines stored correctly",                guard_suite.test_cancellation_deadlines_stored),
        ("Timestamp cancelled_at set",                guard_suite.test_cancelled_at_timestamp_set),
    ]

    passed = 0
    failed = 0
    errors = []

    for name, test_fn in tests:
        try:
            test_fn()
            passed += 1
        except AssertionError as e:
            failed += 1
            errors.append((name, str(e)))
            print(f"\n❌ FAIL — {name}: {e}")
        except Exception as e:
            failed += 1
            errors.append((name, str(e)))
            print(f"\n💥 ERROR — {name}: {e}")

    print("\n" + "=" * 60)
    print(f"  Results: {passed} passed, {failed} failed out of {len(tests)} tests")
    print("=" * 60)

    if errors:
        print("\nFailed tests:")
        for name, err in errors:
            print(f"  ✗ {name}\n    {err}")
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")
        sys.exit(0)


 # One thing to keep in mind for production — the refund amounts in your DB reflect what should be refunded, but the actual money movement (M-PESA B2C reversal or PayPal refund) still needs to be triggered manually or via your admin panel. Your models have refund_processed and refund_processed_at fields — worth wiring those up to your PayPal /refund endpoint and M-PESA B2C when you're ready to automate that flow. #        