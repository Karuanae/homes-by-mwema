import { useState, useEffect, useRef } from 'react';

export function useNavbarState() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const menuRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setShowServices(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // global escape key to close menu/services
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setShowServices(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return {
    isMenuOpen,
    setIsMenuOpen,
    showServices,
    setShowServices,
    showConsultModal,
    setShowConsultModal,
    menuRef,
  };
}
