import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Group additional services for better organization
  const additionalServices = [
    { name: "Social Media Marketing", path: "/social-media-marketing" },
    { name: "Car Hire Services", path: "/car-hire" },
    { name: "Fully Furnished Units", path: "/fully-furnished-units" },
    { name: "Safari Tours", path: "/safari-tours" },
    { name: "Airport & SGR Transfers", path: "/airport-transfers" },
    { name: "Chef Services", path: "/chef-services" }
  ];

  return (
    <footer className="bg-[#093A3E] text-[#f5f2ee] border-t border-[#ED9B40]/20 pt-12 pb-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Main Content: Two Row Layout on Desktop */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-0 mb-12">
          
          {/* 1. Brand Identity - Left with Logo */}
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

          {/* 2. Navigation - Two Columns on Desktop */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 lg:gap-24">
            
            {/* Main Nav Links (from navbar desktop view) */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#ED9B40] font-bold">Main Services</h4>
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
            
            {/* Additional Services */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#ED9B40] font-bold">More Services</h4>
              <ul className="space-y-2 text-sm text-[#F5F2EE]/70 font-light">
                {additionalServices.map((service) => (
                  <li key={service.path}>
                    <Link to={service.path} className="hover:text-[#ED9B40] transition-colors">
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#ED9B40] font-bold">The Guestlist</h4>
              <div className="flex items-center border-b border-[#ED9B40]/30 pb-1 group focus-within:border-[#ED9B40] transition-colors">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-transparent border-none text-xs text-white placeholder-[#F5F2EE]/40 focus:outline-none w-32"
                />
                <button className="text-[#F5F2EE]/40 hover:text-[#ED9B40] transition-colors text-xs group-focus-within:text-[#ED9B40]">→</button>
              </div>
              <p className="text-[#F5F2EE]/40 text-[8px] uppercase tracking-wider mt-1">
                Subscribe to receive offers and updates
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom: Divider & Copyright with Legal Links */}
        <div className="pt-8 border-t border-[#ED9B40]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#F5F2EE]/50 uppercase tracking-widest">
          <p>© {currentYear} Homes by Mwema. All rights reserved.</p>
          
          <div className="flex gap-6 flex-wrap justify-center">
            <Link to="/terms" className="hover:text-[#ED9B40] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#ED9B40] transition-colors">Privacy</Link>
            <Link to="/cookie-policy" className="hover:text-[#ED9B40] transition-colors">Cookies</Link>
            <a href="#" className="hover:text-[#ED9B40] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#ED9B40] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#ED9B40] transition-colors">TikTok</a>
          </div>
        </div>

      </div>
    </footer>
  );
}