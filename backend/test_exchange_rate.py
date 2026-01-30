"""Test live exchange rate fetching"""
from flask import Flask

app = Flask(__name__)
app.config['KES_TO_USD_RATE'] = 153.0

with app.app_context():
    from paypal_service import get_live_exchange_rate, convert_kes_to_usd
    
    print('Fetching live USD/KES exchange rate...')
    rate = get_live_exchange_rate()
    print(f'✅ Live rate: 1 USD = {rate} KES')
    print()
    
    # Test conversion
    kes_amount = 15000
    usd_amount, rate_used = convert_kes_to_usd(kes_amount)
    print(f'Conversion test:')
    print(f'  KES {kes_amount:,} = USD {usd_amount:.2f}')
    print(f'  Rate used: {rate_used}')
