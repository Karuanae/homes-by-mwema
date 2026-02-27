import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function MenuLink({ to, label, highlight, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={
        `flex items-center justify-between px-8 py-3 group transition-all duration-300
      ${highlight ? 'bg-[#C1A173]/10' : 'hover:bg-white'}`
      }
    >
      <span
        className={
          `text-[10px] uppercase tracking-[0.2em] font-bold transition-colors
      text-[#C1A173]`
        }
      >
        {label}
      </span>
      <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#C1A173]">
        <ChevronRight size={14} strokeWidth={1} />
      </span>
    </Link>
  );
}
