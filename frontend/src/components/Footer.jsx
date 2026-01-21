export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        
        <div>
          <h3 className="text-2xl font-bold mb-4">
            Homes By <span className="text-gold">Mwema</span>
          </h3>
          <p className="text-white/70">
            Premium stays curated for comfort, style, and unforgettable
            experiences.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-white/70">
            <li>Home</li>
            <li>Properties</li>
            <li>About Us</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-white/70">
            <li>FAQs</li>
            <li>Booking Policy</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <p className="text-white/70">📍 Nairobi, Kenya</p>
          <p className="text-white/70">📞 +254 700 000 000</p>
          <p className="text-white/70">✉️ hello@luxestays.com</p>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-white/50 text-sm">
        © {new Date().getFullYear()} LuxeStays. All rights reserved.
      </div>
    </footer>
  );
}
