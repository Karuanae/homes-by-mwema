import React from 'react';

const ListingOptimization = () => (
  <div className="max-w-2xl mx-auto py-16 px-4">
    <h1 className="text-3xl font-serif mb-4 text-[#1C1917]">Listing Optimization</h1>
    <p className="text-stone-700 mb-6">
      We provide expert listing optimization to ensure your property stands out. From compelling descriptions to strategic pricing, we help maximize your rental income.
    </p>
    <ul className="list-disc pl-6 mb-6 text-stone-700">
      <li>SEO-optimized property descriptions</li>
      <li>Strategic pricing analysis</li>
      <li>Highlighting unique amenities and features</li>
      <li>Advice on guest communication and reviews</li>
    </ul>
    <div className="bg-[#F5F2EE] border border-[#EBE5DE] p-6 rounded-lg">
      <h2 className="text-xl font-serif mb-2 text-[#C1A173]">Maximize Your Bookings</h2>
      <p className="mb-2 text-stone-700">Our tailored optimization strategies help you attract more guests and increase your rental income. Let us handle the details!</p>
      <a href="/contact" className="inline-block mt-4 px-6 py-2 bg-[#C1A173] text-white rounded hover:bg-[#a88a5c] transition-colors text-[13px] uppercase tracking-wider">Optimize My Listing</a>
    </div>
  </div>
);

export default ListingOptimization;
