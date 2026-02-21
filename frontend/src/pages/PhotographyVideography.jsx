import React from 'react';

const PhotographyVideography = () => (
  <div className="max-w-2xl mx-auto py-16 px-4">
    <h1 className="text-3xl font-serif mb-4 text-[#1C1917]">Photography & Videography</h1>
    <p className="text-stone-700 mb-6">
      Our team offers professional photography and videography services to showcase your property in the best light. High-quality visuals help attract more guests and increase bookings.
    </p>
    <ul className="list-disc pl-6 mb-6 text-stone-700">
      <li>Professional property photoshoots</li>
      <li>High-definition video tours</li>
      <li>Drone photography for stunning aerial views</li>
      <li>Editing and post-production for maximum impact</li>
    </ul>
    <div className="bg-[#F5F2EE] border border-[#EBE5DE] p-6 rounded-lg">
      <h2 className="text-xl font-serif mb-2 text-[#C1A173]">Why Invest in Quality Visuals?</h2>
      <p className="mb-2 text-stone-700">Listings with professional photos and videos receive more views and bookings. Let us help your property stand out!</p>
      <a href="/contact" className="inline-block mt-4 px-6 py-2 bg-[#C1A173] text-white rounded hover:bg-[#a88a5c] transition-colors text-[13px] uppercase tracking-wider">Request a Shoot</a>
    </div>
  </div>
);

export default PhotographyVideography;
