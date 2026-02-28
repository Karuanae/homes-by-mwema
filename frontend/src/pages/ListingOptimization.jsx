import React from 'react';

const ListingOptimization = () => (
  <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-serif mb-4 text-[#1C1917]" style={{ fontFamily: "'Playfair Display', serif" }}>
        Listing Optimization
      </h1>
      <p className="text-stone-700 text-lg mb-6 leading-relaxed">
        We provide expert listing optimization to ensure your property stands out. From compelling descriptions to strategic pricing, we help maximize your rental income.
      </p>
      <div className="mb-8">
        <ul className="list-disc pl-6 text-stone-600 text-base space-y-2">
          <li>SEO-optimized property descriptions</li>
          <li>Strategic pricing analysis</li>
          <li>Highlighting unique amenities and features</li>
          <li>Advice on guest communication and reviews</li>
        </ul>
      </div>
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-lg">
        <h2 className="text-2xl font-serif mb-3 text-[#C1A173]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Maximize Your Bookings
        </h2>
        <p className="mb-6 text-stone-700 leading-relaxed">
          Our tailored optimization strategies help you attract more guests and increase your rental income. Let us handle the details!
        </p>
        <a 
          href="/contact" 
          className="inline-block px-8 py-3 bg-[#C1A173] text-white rounded hover:bg-[#a88a5c] transition-colors text-xs uppercase tracking-widest font-bold"
          style={{ letterSpacing: '0.15em' }}
        >
          Optimize My Listing
        </a>
      </div>
    </div>
  </div>
);

export default ListingOptimization;