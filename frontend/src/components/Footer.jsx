import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-[#f5f2ee] border-t border-stone-800 pt-12 pb-8 px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Main Content: Single Row Layout on Desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-0 mb-12">
          
          {/* 1. Brand Identity - Left */}
          <div className="max-w-xs">
            <h3 className="font-serif text-2xl tracking-wide mb-2">MWEMA</h3>
            <p className="text-stone-500 text-xs leading-relaxed font-light">
              Curated sanctuaries for the discerning traveler. <br />
              Nairobi, Kenya.
            </p>
          </div>

          {/* 2. Compact Navigation - Right */}
          <div className="flex gap-12 sm:gap-20">
            {/* Column 1 */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-600 font-bold">Explore</h4>
              <ul className="space-y-2 text-sm text-stone-400 font-light">
                <li><Link to="/properties" className="hover:text-white transition-colors">Residences</Link></li>
                <li><Link to="/concierge" className="hover:text-white transition-colors">Concierge</Link></li>
                <li><Link to="/journal" className="hover:text-white transition-colors">Journal</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-600 font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-stone-400 font-light">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="mailto:stay@mwema.com" className="hover:text-white transition-colors">stay@mwema.com</a></li>
              </ul>
            </div>
            
            {/* Newsletter - Minimal Input */}
            <div className="space-y-3 hidden sm:block">
               <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-600 font-bold">The Guestlist</h4>
               <div className="flex items-center border-b border-stone-700 pb-1">
                 <input 
                   type="email" 
                   placeholder="Email address" 
                   className="bg-transparent border-none text-xs text-white placeholder-stone-600 focus:outline-none w-32"
                 />
                 <button className="text-stone-500 hover:text-white transition-colors text-xs">→</button>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom: Divider & Copyright */}
        <div className="pt-8 border-t border-stone-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-600 uppercase tracking-widest">
          <p>© {currentYear} Mwema Collection</p>
          
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-stone-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-stone-400 transition-colors">Privacy</Link>
            <a href="#" className="hover:text-stone-400 transition-colors">Instagram</a>
            <a href="#" className="hover:text-stone-400 transition-colors">LinkedIn</a>
          </div>
        </div>

      </div>
    </footer>
  );
}