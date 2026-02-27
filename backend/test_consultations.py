"""
Simple script to exercise consultation booking endpoints.
Run this file while the backend is running, or import app and run it.
"""

import json
import os
import sys
from flask import Flask
from backend import create_app  # assuming factory pattern? if not adjust

# if create_app doesn't exist, import app directly
try:
    from backend import app as flask_app
except ImportError:
    flask_app = None

if flask_app is None:
    # fallback to import from app.py
    from app import app as flask_app


client = flask_app.test_client()

def register_and_login():
    # register a temporary user
    email = 'testuser@example.com'
    password = 'password123'
    resp = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': email,
        'password': password
    })
    print('register status', resp.status_code, resp.get_json())
    login_resp = client.post('/api/auth/login', json={'email': email, 'password': password})
    print('login status', login_resp.status_code, login_resp.get_json())
    if login_resp.status_code == 200:
        token = login_resp.get_json().get('token')
        return token
    return None


def test_consultation_flow():
    print('\n=== Testing consultation endpoint ===')
    token = register_and_login()
    if not token:
        print('failed to auth; aborting')
        return
    headers = {'Authorization': f'Bearer {token}'}
    payload = {
        'date': '2026-03-10T10:00:00',
        'hour': 10,
        'minute': 0,
        'notes': 'Test appointment'
    }
    resp = client.post('/api/consultations', json=payload, headers=headers)
    print('consultation create', resp.status_code, resp.get_json())
    if resp.status_code == 201:
        chat_id = resp.get_json().get('chat', {}).get('id')
        print('chat created id', chat_id)
    else:
        print('consultation failed')

if __name__ == '__main__':
    test_consultation_flow()
