import React from 'react';

export default function Management() {
  return (
    <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center px-4 py-24">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-xl p-8 border border-stone-200">
        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Airbnb Management Services
        </h1>
        <p className="text-stone-700 text-lg mb-6">
          Unlock the full potential of your property with our professional Airbnb management services. We handle everything from guest communication and cleaning to pricing optimization and 24/7 support.
        </p>
        <div className="mb-6">
          <ul className="list-disc pl-6 text-stone-600 text-base space-y-2">
            <li>Listing creation & professional photography</li>
            <li>Dynamic pricing for maximum returns</li>
            <li>Guest screening & communication</li>
            <li>Housekeeping & maintenance coordination</li>
            <li>Check-in/out management</li>
            <li>24/7 guest support</li>
          </ul>
        </div>
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded mb-6">
          <span className="block text-stone-900 font-bold mb-1">Transparent Pricing</span>
          <span className="text-stone-700">We offer management at an agreed rate tailored to your needs. Contact us for a custom quote.</span>
        </div>
        <div className="flex justify-center">
          <a href="/contact" className="px-6 py-2 bg-amber-500 text-white rounded-full font-bold uppercase tracking-widest shadow hover:bg-amber-600 transition-colors text-xs" style={{ letterSpacing: '0.15em', fontFamily: "'Playfair Display', serif" }}>
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
