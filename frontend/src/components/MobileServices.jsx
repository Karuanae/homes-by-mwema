import React from 'react';
import MenuLink from './MenuLink';

export default function MobileServices({ onNavigate }) {
  // onNavigate callback handles closing menu/menu state from parent
  return (
    <>
      <MenuLink to="/photography-videography" label="Photography & Videography" onClick={onNavigate} />
      <MenuLink to="/listing-optimization" label="Listing Optimization" onClick={onNavigate} />
      <MenuLink to="/interior-design" label="Interior Design Setup" onClick={onNavigate} />
      <MenuLink to="/management" label="Management" onClick={onNavigate} />
    </>
  );
}
