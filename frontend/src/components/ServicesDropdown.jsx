import React from 'react';
import { Link } from 'react-router-dom';

export default function ServicesDropdown({ onClose }) {
  return (
    <div className="py-2 px-4 text-left">
      <Link to="/photography-videography" className="block text-[11px] font-serif text-[#1C1917] py-2 border-b border-[#EBE5DE] hover:bg-[#F5F2EE] transition-colors" onClick={onClose}>
        Photography & videography
      </Link>
      <Link to="/listing-optimization" className="block text-[11px] font-serif text-[#1C1917] py-2 border-b border-[#EBE5DE] hover:bg-[#F5F2EE] transition-colors" onClick={onClose}>
        Listing optimization
      </Link>
      <Link to="/management" className="block text-[11px] font-serif text-[#1C1917] py-2 hover:bg-[#F5F2EE] transition-colors" onClick={onClose}>
        Management
      </Link>
    </div>
  );
}
