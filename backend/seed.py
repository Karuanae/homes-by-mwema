from app import app, db
from models import User, Property

def seed_database():
    with app.app_context():
        # Create admin user
        admin = User.query.filter_by(email='admin@homes.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@homes.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Create sample properties
        if Property.query.count() == 0:
            properties_data = [
                {
                    'name': 'Eva Studio',
                    'title': 'Located along Lumumba Drive',
                    'price': 5000,
                    'location': 'Lumumba Drive, Nairobi',
                    'rooms': 1,
                    'category': 'Studio Apartment',
                    'rating': 4.9,
                    'review_count': 1,
                    'images': ['/EvaStudio.jpg', '/EvaStudio1.jpg', '/EvaStudio2.jpg'],
                    'amenities': ['WiFi', 'Kitchen', 'Air Conditioning', 'Parking'],
                    'description': 'Modern studio apartment in the heart of Nairobi.',
                    'host_name': 'Ann Mwema',
                    'is_superhost': True
                },
                {
                    'name': 'Langata 2 bedroom',
                    'price': 8500,
                    'location': 'Lang\'ata, Nairobi',
                    'rooms': 2,
                    'category': '2 Bedroom Apartment',
                    'rating': 4.8,
                    'review_count': 1,
                    'images': ['/Langata2.jpg'],
                    'amenities': ['WiFi', 'Kitchen', 'Air Conditioning', 'Parking', 'Gym'],
                    'description': 'Spacious 2 bedroom apartment in Lang\'ata.',
                    'host_name': 'John Doe',
                    'is_superhost': False
                },
                {
                    'name': 'Capital 2 bedroom',
                    'price': 5000,
                    'location': 'Kilimani, Nairobi',
                    'rooms': 2,
                    'category': '2 Bedroom Apartment',
                    'rating': 4.7,
                    'review_count': 1,
                    'images': ['/Capital2.jpeg'],
                    'amenities': ['WiFi', 'Kitchen', 'Air Conditioning'],
                    'description': 'Comfortable 2 bedroom apartment in Kilimani.',
                    'host_name': 'Jane Smith',
                    'is_superhost': False
                },
                {
                    'name': 'Capital 3 bedroom',
                    'price': 4000,
                    'location': 'Kilimani, Nairobi',
                    'rooms': 3,
                    'category': '3 Bedroom Apartment',
                    'rating': 5.0,
                    'review_count': 1,
                    'images': ['/Capital3.jpg'],
                    'amenities': ['WiFi', 'Kitchen', 'Air Conditioning', 'Parking', 'Pool'],
                    'description': 'Luxurious 3 bedroom apartment with pool access.',
                    'host_name': 'Mike Johnson',
                    'is_superhost': True
                }
            ]
            
            for prop_data in properties_data:
                property = Property(**prop_data)
                db.session.add(property)
        
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
