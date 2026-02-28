import React from 'react';

const PhotographyVideography = () => (
  <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-serif mb-4 text-[#1C1917]" style={{ fontFamily: "'Playfair Display', serif" }}>
        Photography & Videography
      </h1>
      <p className="text-stone-700 text-lg mb-6 leading-relaxed">
        Our team offers professional photography and videography services to showcase your property in the best light. High-quality visuals help attract more guests and increase bookings.
      </p>
      <div className="mb-8">
        <ul className="list-disc pl-6 text-stone-600 text-base space-y-2">
          <li>Professional property photoshoots</li>
          <li>High-definition video tours</li>
          <li>Drone photography for stunning aerial views</li>
          <li>Editing and post-production for maximum impact</li>
        </ul>
      </div>
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-lg">
        <h2 className="text-2xl font-serif mb-3 text-[#C1A173]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Why Invest in Quality Visuals?
        </h2>
        <p className="mb-6 text-stone-700 leading-relaxed">
          Listings with professional photos and videos receive more views and bookings. Let us help your property stand out!
        </p>
        <a 
          href="/contact" 
          className="inline-block px-8 py-3 bg-[#C1A173] text-white rounded hover:bg-[#a88a5c] transition-colors text-xs uppercase tracking-widest font-bold"
          style={{ letterSpacing: '0.15em' }}
        >
          Request a Shoot
        </a>
      </div>
    </div>
  </div>
);

export default PhotographyVideography;