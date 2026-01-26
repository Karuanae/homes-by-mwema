# quick_seed.py - Minimal version
from app import app, db
from models import User, Property

def quick_seed():
    with app.app_context():
        print("Running quick seed...")
        
        # Check if admin exists
        admin = User.query.filter_by(email='admin@luxurystays.com').first()
        if not admin:
            print("Creating admin user...")
            admin = User(
                name='Administrator',
                email='admin@luxurystays.com',
                phone='+254700000000',
                role='admin'
            )
            admin.set_password('Admin@123456')
            db.session.add(admin)
        
        # Check if any properties exist
        if Property.query.count() == 0:
            print("Creating sample property...")
            property = Property(
                name='Eva Studio',
                title='Luxury Studio Apartment',
                description='Modern studio in prime location',
                type='studio',
                price=8500,
                location='Westlands, Nairobi',
                rooms=1,
                bathrooms=1,
                max_guests=2,
                amenities=['WiFi', 'Kitchen', 'AC'],
                images=['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'],
                status='active',
                is_featured=True,
                host_id=admin.id
            )
            db.session.add(property)
        
        db.session.commit()
        print("✅ Quick seed completed!")
        print(f"Total users: {User.query.count()}")
        print(f"Total properties: {Property.query.count()}")

if __name__ == '__main__':
    quick_seed()