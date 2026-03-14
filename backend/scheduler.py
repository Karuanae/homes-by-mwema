# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
import atexit
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

def job_listener(event):
    """Listen for job events and log them"""
    if event.exception:
        logger.error(f"❌ Job {event.job_id} failed: {event.exception}")
    else:
        logger.info(f"✅ Job {event.job_id} completed successfully")

def expire_pending_bookings_job(app):
    """Job to expire old pending bookings"""
    with app.app_context():
        try:
            from views.booking import expire_old_pending_bookings
            count = expire_old_pending_bookings()
            if count > 0:
                logger.info(f"🧹 APScheduler expired {count} pending bookings")
            else:
                logger.debug("No pending bookings to expire")
        except Exception as e:
            logger.error(f"❌ Error in expiry job: {str(e)}")

def cleanup_old_payments_job(app):
    """Job to cleanup old abandoned payments"""
    with app.app_context():
        try:
            from views.payment import cleanup_old_payments
            count = cleanup_old_payments()
            if count > 0:
                logger.info(f"🧹 APScheduler cleaned up {count} abandoned payments")
        except Exception as e:
            logger.error(f"❌ Error in payment cleanup: {str(e)}")

def init_scheduler(app):
    """Initialize and start the background scheduler"""
    global scheduler
    
    if scheduler is not None:
        logger.info("Scheduler already initialized")
        return scheduler
    
    logger.info("🚀 Initializing APScheduler...")
    
    # Create scheduler
    scheduler = BackgroundScheduler({
        'apscheduler.job_defaults.max_instances': 1,
        'apscheduler.job_defaults.coalesce': True,
        'apscheduler.job_defaults.misfire_grace_time': 60,
        'apscheduler.timezone': 'UTC'
    })
    
    # Add job listener
    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    
    # Add jobs
    
    # Expire pending bookings every minute
    scheduler.add_job(
        func=lambda: expire_pending_bookings_job(app),
        trigger=IntervalTrigger(minutes=1),
        id='expire_pending_bookings',
        name='Expire old pending bookings',
        replace_existing=True,
        max_instances=1
    )
    
    # Cleanup old payments every 5 minutes
    scheduler.add_job(
        func=lambda: cleanup_old_payments_job(app),
        trigger=IntervalTrigger(minutes=5),
        id='cleanup_old_payments',
        name='Cleanup abandoned payments',
        replace_existing=True,
        max_instances=1
    )
    
    # Also run once at startup to catch any missed expirations
    scheduler.add_job(
        func=lambda: expire_pending_bookings_job(app),
        trigger='date',
        id='startup_expiry',
        name='Initial expiry run',
        run_date=datetime.now()
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info("✅ APScheduler started successfully")
    
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: shutdown_scheduler())
    
    return scheduler

def shutdown_scheduler():
    """Shutdown the scheduler gracefully"""
    global scheduler
    if scheduler:
        logger.info("🛑 Shutting down APScheduler...")
        scheduler.shutdown()
        scheduler = None
        logger.info("✅ APScheduler shutdown complete")