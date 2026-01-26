#!/usr/bin/env python3
"""Quick script to add host_id to existing properties"""

from app import app, db
from models import Property, User
from sqlalchemy import text

def migrate_host_id():
    with app.app_context():
        print("Checking if host_id column exists...")
        
        # Check if column exists
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('properties')]
        
        if 'host_id' not in columns:
            print("Adding host_id column to properties table...")
            try:
                db.session.execute(text('''
                    ALTER TABLE properties ADD COLUMN host_id INTEGER,
                    ADD FOREIGN KEY (host_id) REFERENCES users(id)
                '''))
                db.session.commit()
                print("✅ host_id column added successfully!")
            except Exception as e:
                print(f"Error adding column: {e}")
                db.session.rollback()
        else:
            print("✅ host_id column already exists!")
        
        # Set admin as host for all properties that don't have a host
        print("\nSetting host for properties without a host...")
        admin = User.query.filter_by(role='admin').first()
        
        if admin:
            properties_without_host = Property.query.filter(Property.host_id == None).all()
            count = len(properties_without_host)
            
            if count > 0:
                for prop in properties_without_host:
                    prop.host_id = admin.id
                db.session.commit()
                print(f"✅ Set admin as host for {count} properties!")
            else:
                print("✅ All properties already have a host assigned!")
        else:
            print("⚠️  No admin user found. Please create an admin user first.")
        
        print(f"\nTotal properties: {Property.query.count()}")
        print(f"Properties with host: {Property.query.filter(Property.host_id != None).count()}")

if __name__ == '__main__':
    migrate_host_id()
