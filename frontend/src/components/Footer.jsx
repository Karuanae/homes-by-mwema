import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#093A3E] text-[#f5f2ee] border-t border-[#ED9B40]/20 pt-12 pb-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Main Content: Single Row Layout on Desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-0 mb-12">
          
          {/* 1. Brand Identity - Left with Logo (same as navbar) */}
          <div className="max-w-xs">
            <Link to="/" className="inline-block">
              <img
                src="/Logo3.png"
                alt="Homes by Mwema"
                className="w-32 h-20 object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg"
              />
            </Link>
            <p className="text-[#F5F2EE]/60 text-xs leading-relaxed font-light mt-3">
              Curated sanctuaries for the discerning traveler. <br />
              Nairobi, Kenya.
            </p>
          </div>

          {/* 2. Navigation - Only Navbar Buttons */}
          <div className="flex gap-12 sm:gap-20">
            {/* Main Nav Links (from navbar desktop view) */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#ED9B40] font-bold">Navigate</h4>
              <ul className="space-y-2 text-sm text-[#F5F2EE]/70 font-light">
                <li>
                  <Link to="/properties" className="hover:text-[#ED9B40] transition-colors">
                    Reserve a Unit
                  </Link>
                </li>
                <li>
                  <Link to="/management" className="hover:text-[#ED9B40] transition-colors">
                    Management Services
                  </Link>
                </li>
                <li>
                  <Link to="/photography-videography" className="hover:text-[#ED9B40] transition-colors">
                    Photography & Videography
                  </Link>
                </li>
                <li>
                  <Link to="/listing-optimization" className="hover:text-[#ED9B40] transition-colors">
                    Listing Optimization
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/?consult=1'} 
                    className="hover:text-[#ED9B40] transition-colors text-left"
                  >
                    Consultation
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Newsletter - Minimal Input */}
            <div className="space-y-3 hidden sm:block">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#ED9B40] font-bold">The Guestlist</h4>
              <div className="flex items-center border-b border-[#ED9B40]/30 pb-1 group focus-within:border-[#ED9B40] transition-colors">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-transparent border-none text-xs text-white placeholder-[#F5F2EE]/40 focus:outline-none w-32"
                />
                <button className="text-[#F5F2EE]/40 hover:text-[#ED9B40] transition-colors text-xs group-focus-within:text-[#ED9B40]">→</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom: Divider & Copyright */}
        <div className="pt-8 border-t border-[#ED9B40]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#F5F2EE]/50 uppercase tracking-widest">
          <p>© {currentYear} Homes by Mwema</p>
          
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-[#ED9B40] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#ED9B40] transition-colors">Privacy</Link>
            <a href="#" className="hover:text-[#ED9B40] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#ED9B40] transition-colors">LinkedIn</a>
          </div>
        </div>

      </div>
    </footer>
  );
}