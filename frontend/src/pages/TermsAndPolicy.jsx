import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaFileContract, 
  FaLock, 
  FaCookieBite,
  FaUserSecret,
  FaGavel,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPrint,
  FaDownload
} from 'react-icons/fa';
import { MdPrivacyTip, MdPolicy, MdUpdate } from 'react-icons/md';

const TermsAndPolicy = () => {
  const [activeSection, setActiveSection] = useState('terms');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const lastUpdated = "March 15, 2026";

  const tableOfContents = [
    { id: "agreement", title: "1. Agreement to Terms" },
    { id: "services", title: "2. Description of Services" },
    { id: "bookings", title: "3. Bookings & Payments" },
    { id: "cancellations", title: "4. Cancellation Policy" },
    { id: "user-accounts", title: "5. User Accounts" },
    { id: "prohibited", title: "6. Prohibited Activities" },
    { id: "intellectual", title: "7. Intellectual Property" },
    { id: "disclaimers", title: "8. Disclaimers" },
    { id: "limitation", title: "9. Limitation of Liability" },
    { id: "indemnification", title: "10. Indemnification" },
    { id: "governing-law", title: "11. Governing Law" },
    { id: "changes", title: "12. Changes to Terms" }
  ];

  const privacySections = [
    { id: "information-we-collect", title: "Information We Collect" },
    { id: "how-we-use", title: "How We Use Your Information" },
    { id: "sharing", title: "Sharing Your Information" },
    { id: "cookies", title: "Cookies & Tracking" },
    { id: "data-security", title: "Data Security" },
    { id: "your-rights", title: "Your Rights" },
    { id: "children", title: "Children's Privacy" },
    { id: "international", title: "International Data Transfers" },
    { id: "retention", title: "Data Retention" },
    { id: "contact-privacy", title: "Contact Us" }
  ];

  const faqs = [
    {
      q: "How do I cancel a booking?",
      a: "You can cancel a booking through your account dashboard or by contacting our support team. Refunds are processed according to our cancellation policy based on how far in advance you cancel."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept M-Pesa, credit/debit cards (Visa, Mastercard), and bank transfers for bookings and services."
    },
    {
      q: "Is my personal information secure?",
      a: "Yes, we use industry-standard encryption and security measures to protect your data. We never share your information with third parties without your consent."
    },
    {
      q: "How do I update my account information?",
      a: "You can update your profile information anytime by logging into your account and accessing the profile settings section."
    }
  ];

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden selection:bg-stone-200 pt-24">
      
      {/* Global Styles */}
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .policy-link {
          transition: all 0.2s ease;
        }
        .policy-link:hover {
          color: #ED9B40;
          padding-left: 4px;
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white py-20">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Terms & <span className="text-[#ED9B40] italic">Privacy</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto mb-6">
              Our commitment to transparency and protecting your rights
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
              <FaCalendarAlt className="text-[#ED9B40]" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white border-b border-stone-200 sticky top-20 z-40">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveSection('terms')}
              className={`py-4 px-2 text-sm uppercase tracking-widest font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeSection === 'terms'
                  ? 'border-[#ED9B40] text-[#0F4C55]'
                  : 'border-transparent text-stone-400 hover:text-[#0F4C55]'
              }`}
            >
              <FaFileContract /> Terms of Service
            </button>
            <button
              onClick={() => setActiveSection('privacy')}
              className={`py-4 px-2 text-sm uppercase tracking-widest font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeSection === 'privacy'
                  ? 'border-[#ED9B40] text-[#0F4C55]'
                  : 'border-transparent text-stone-400 hover:text-[#0F4C55]'
              }`}
            >
              <MdPrivacyTip /> Privacy Policy
            </button>
            <button
              onClick={() => setActiveSection('cookies')}
              className={`py-4 px-2 text-sm uppercase tracking-widest font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeSection === 'cookies'
                  ? 'border-[#ED9B40] text-[#0F4C55]'
                  : 'border-transparent text-stone-400 hover:text-[#0F4C55]'
              }`}
            >
              <FaCookieBite /> Cookie Policy
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar - Table of Contents */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-sm border border-stone-200 sticky top-32">
                <h3 className="text-sm uppercase tracking-widest font-bold text-[#0F4C55] mb-4 flex items-center gap-2">
                  <FaPrint /> On This Page
                </h3>
                
                {activeSection === 'terms' && (
                  <ul className="space-y-2 text-sm">
                    {tableOfContents.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {activeSection === 'privacy' && (
                  <ul className="space-y-2 text-sm">
                    {privacySections.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {activeSection === 'cookies' && (
                  <ul className="space-y-2 text-sm">
                    <li><a href="#what-are-cookies" className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block">What Are Cookies</a></li>
                    <li><a href="#how-we-use-cookies" className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block">How We Use Cookies</a></li>
                    <li><a href="#types-of-cookies" className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block">Types of Cookies</a></li>
                    <li><a href="#managing-cookies" className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block">Managing Cookies</a></li>
                    <li><a href="#third-party" className="text-stone-600 hover:text-[#ED9B40] transition-colors policy-link block">Third-Party Cookies</a></li>
                  </ul>
                )}

                <div className="mt-6 pt-4 border-t border-stone-200">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 hover:text-[#ED9B40] transition-colors"
                  >
                    <FaDownload /> Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-sm border border-stone-200">
              
              {/* Terms of Service */}
              {activeSection === 'terms' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-stone max-w-none"
                >
                  <div id="agreement" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">1. Agreement to Terms</h2>
                    <p className="text-stone-700 mb-4">
                      By accessing or using the Homes by Mwema website, mobile application, or any services provided by Homes by Mwema ("Company," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use our services.
                    </p>
                    <p className="text-stone-700">
                      These Terms constitute a legally binding agreement between you and Homes by Mwema regarding your use of our platform to book properties, access management services, or interact with our content.
                    </p>
                  </div>

                  <div id="services" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">2. Description of Services</h2>
                    <p className="text-stone-700 mb-4">
                      Homes by Mwema provides a platform that connects guests with premium residential properties for short-term stays, as well as property management services for hosts. Our services include:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Property booking and reservation platform</li>
                      <li>Property management services for hosts</li>
                      <li>Photography and videography services</li>
                      <li>Listing optimization and consultation</li>
                      <li>Guest communication and support</li>
                    </ul>
                    <p className="text-stone-700">
                      We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice.
                    </p>
                  </div>

                  <div id="bookings" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">3. Bookings & Payments</h2>
                    <p className="text-stone-700 mb-4">
                      When you make a booking through our platform, you agree to pay all charges associated with your reservation, including the property rate and any applicable taxes.
                    </p>
                    <p className="text-stone-700 mb-4">
                      Payments are processed securely through our payment partners. By providing payment information, you represent that you are authorized to use the payment method and authorize us to charge the full amount of your booking.
                    </p>
                    <p className="text-stone-700">
                      All prices are listed in Kenyan Shillings (KES) unless otherwise specified. We reserve the right to correct any pricing errors even after a booking is confirmed.
                    </p>
                  </div>

                  <div id="cancellations" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">4. Cancellation Policy</h2>
                    <p className="text-stone-700 mb-4">
                      Cancellation policies vary by property and are clearly displayed on each listing before booking. Generally, our policies include:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li><span className="font-bold">Flexible:</span> Full refund if canceled at least 24 hours before check-in</li>
                      <li><span className="font-bold">Moderate:</span> Full refund if canceled at least 5 days before check-in</li>
                      <li><span className="font-bold">Strict:</span> 50% refund if canceled at least 7 days before check-in</li>
                    </ul>
                    <p className="text-stone-700">
                      To cancel a booking, log into your account or contact our support team. Refunds are processed within 5-10 business days.
                    </p>
                  </div>

                  <div id="user-accounts" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">5. User Accounts</h2>
                    <p className="text-stone-700 mb-4">
                      To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                    <p className="text-stone-700 mb-4">
                      You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and complete.
                    </p>
                    <p className="text-stone-700">
                      We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate or if you violate these Terms.
                    </p>
                  </div>

                  <div id="prohibited" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">6. Prohibited Activities</h2>
                    <p className="text-stone-700 mb-4">You may not use our services to:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Violate any applicable laws or regulations</li>
                      <li>Infringe upon the rights of others</li>
                      <li>Transmit any harmful code or malware</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Use the platform for any commercial purpose without our consent</li>
                      <li>Harass, abuse, or harm other users</li>
                      <li>Post false, misleading, or fraudulent information</li>
                    </ul>
                  </div>

                  <div id="intellectual" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">7. Intellectual Property</h2>
                    <p className="text-stone-700 mb-4">
                      All content on our platform, including text, graphics, logos, images, and software, is the property of Homes by Mwema or our licensors and is protected by copyright and other intellectual property laws.
                    </p>
                    <p className="text-stone-700">
                      You may not reproduce, distribute, modify, or create derivative works of our content without our express written permission.
                    </p>
                  </div>

                  <div id="disclaimers" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">8. Disclaimers</h2>
                    <p className="text-stone-700 mb-4">
                      Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Our services will be uninterrupted or error-free</li>
                      <li>Defects will be corrected</li>
                      <li>The platform is free of viruses or harmful components</li>
                      <li>Any information provided is accurate or reliable</li>
                    </ul>
                  </div>

                  <div id="limitation" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">9. Limitation of Liability</h2>
                    <p className="text-stone-700 mb-4">
                      To the maximum extent permitted by law, Homes by Mwema shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of our services.
                    </p>
                    <p className="text-stone-700">
                      Our total liability to you shall not exceed the amount you paid to us during the twelve months preceding the claim.
                    </p>
                  </div>

                  <div id="indemnification" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">10. Indemnification</h2>
                    <p className="text-stone-700">
                      You agree to indemnify and hold harmless Homes by Mwema, its officers, directors, employees, and agents from any claims, damages, losses, and expenses arising out of your use of our services or violation of these Terms.
                    </p>
                  </div>

                  <div id="governing-law" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">11. Governing Law</h2>
                    <p className="text-stone-700">
                      These Terms shall be governed by the laws of the Republic of Kenya, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively by the courts of Nairobi, Kenya.
                    </p>
                  </div>

                  <div id="changes" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">12. Changes to Terms</h2>
                    <p className="text-stone-700">
                      We may modify these Terms at any time by posting the revised version on our website. Your continued use of our services after such changes constitutes your acceptance of the new Terms. The "Last Updated" date at the top of this page indicates when these Terms were last revised.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Privacy Policy */}
              {activeSection === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-stone max-w-none"
                >
                  <div id="information-we-collect" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Information We Collect</h2>
                    <p className="text-stone-700 mb-4">We collect information you provide directly to us, including:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li><span className="font-bold">Account Information:</span> Name, email address, phone number, password</li>
                      <li><span className="font-bold">Profile Information:</span> Profile photo, preferences, payment methods</li>
                      <li><span className="font-bold">Booking Information:</span> Property details, check-in/out dates, guest counts</li>
                      <li><span className="font-bold">Payment Information:</span> M-Pesa details, card information (processed securely by our payment partners)</li>
                      <li><span className="font-bold">Communications:</span> Messages with hosts or our support team</li>
                    </ul>
                    <p className="text-stone-700">
                      We also automatically collect certain information when you use our services, including your IP address, device information, browser type, and usage data through cookies and similar technologies.
                    </p>
                  </div>

                  <div id="how-we-use" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">How We Use Your Information</h2>
                    <p className="text-stone-700 mb-4">We use your information to:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Process and manage your bookings</li>
                      <li>Communicate with you about your reservations</li>
                      <li>Provide customer support</li>
                      <li>Improve and personalize your experience</li>
                      <li>Detect and prevent fraud</li>
                      <li>Comply with legal obligations</li>
                      <li>Send you marketing communications (with your consent)</li>
                    </ul>
                  </div>

                  <div id="sharing" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Sharing Your Information</h2>
                    <p className="text-stone-700 mb-4">We may share your information with:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li><span className="font-bold">Property Hosts:</span> To facilitate your booking and stay</li>
                      <li><span className="font-bold">Service Providers:</span> Payment processors, customer support tools, analytics providers</li>
                      <li><span className="font-bold">Legal Authorities:</span> When required by law or to protect our rights</li>
                      <li><span className="font-bold">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets</li>
                    </ul>
                    <p className="text-stone-700">
                      We do not sell your personal information to third parties.
                    </p>
                  </div>

                  <div id="cookies" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Cookies & Tracking</h2>
                    <p className="text-stone-700 mb-4">
                      We use cookies and similar tracking technologies to collect information about your browsing behavior and preferences. This helps us:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Remember your login information</li>
                      <li>Understand how you use our platform</li>
                      <li>Personalize content and advertisements</li>
                      <li>Improve our services</li>
                    </ul>
                    <p className="text-stone-700">
                      You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our platform.
                    </p>
                  </div>

                  <div id="data-security" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Data Security</h2>
                    <p className="text-stone-700 mb-4">
                      We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Regular security assessments</li>
                      <li>Access controls and authentication</li>
                      <li>Employee training on data protection</li>
                    </ul>
                  </div>

                  <div id="your-rights" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Your Rights</h2>
                    <p className="text-stone-700 mb-4">You have the right to:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Access your personal information</li>
                      <li>Correct inaccurate information</li>
                      <li>Request deletion of your information</li>
                      <li>Object to processing of your information</li>
                      <li>Withdraw consent at any time</li>
                      <li>Export your data</li>
                    </ul>
                    <p className="text-stone-700">
                      To exercise these rights, contact us at privacy@homesbymwema.com.
                    </p>
                  </div>

                  <div id="children" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Children's Privacy</h2>
                    <p className="text-stone-700">
                      Our services are not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
                    </p>
                  </div>

                  <div id="international" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">International Data Transfers</h2>
                    <p className="text-stone-700">
                      Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                    </p>
                  </div>

                  <div id="retention" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Data Retention</h2>
                    <p className="text-stone-700">
                      We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
                    </p>
                  </div>

                  <div id="contact-privacy" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Contact Us</h2>
                    <p className="text-stone-700 mb-4">
                      If you have questions about this Privacy Policy or our data practices, please contact us:
                    </p>
                    <ul className="list-none text-stone-700 space-y-2">
                      <li className="flex items-center gap-2"><FaEnvelope className="text-[#ED9B40]" /> privacy@homesbymwema.com</li>
                      <li className="flex items-center gap-2"><FaPhone className="text-[#ED9B40]" /> +25459170780</li>
                      <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-[#ED9B40]" /> Nairobi, Kenya</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Cookie Policy */}
              {activeSection === 'cookies' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-stone max-w-none"
                >
                  <div id="what-are-cookies" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">What Are Cookies?</h2>
                    <p className="text-stone-700 mb-4">
                      Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
                    </p>
                  </div>

                  <div id="how-we-use-cookies" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">How We Use Cookies</h2>
                    <p className="text-stone-700 mb-4">We use cookies to:</p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Keep you logged into your account</li>
                      <li>Remember your preferences and settings</li>
                      <li>Understand how you use our website</li>
                      <li>Improve site performance and user experience</li>
                      <li>Deliver relevant advertisements</li>
                      <li>Protect against fraud and security risks</li>
                    </ul>
                  </div>

                  <div id="types-of-cookies" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Types of Cookies We Use</h2>
                    
                    <h3 className="text-lg font-bold text-[#0F4C55] mt-4 mb-2">Essential Cookies</h3>
                    <p className="text-stone-700 mb-4">
                      These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
                    </p>

                    <h3 className="text-lg font-bold text-[#0F4C55] mt-4 mb-2">Performance Cookies</h3>
                    <p className="text-stone-700 mb-4">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our site.
                    </p>

                    <h3 className="text-lg font-bold text-[#0F4C55] mt-4 mb-2">Functional Cookies</h3>
                    <p className="text-stone-700 mb-4">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences and language settings.
                    </p>

                    <h3 className="text-lg font-bold text-[#0F4C55] mt-4 mb-2">Targeting Cookies</h3>
                    <p className="text-stone-700 mb-4">
                      These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant ads on other sites.
                    </p>
                  </div>

                  <div id="managing-cookies" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Managing Cookies</h2>
                    <p className="text-stone-700 mb-4">
                      Most web browsers allow you to control cookies through their settings. You can:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li>Delete all cookies from your browser</li>
                      <li>Block cookies from being set</li>
                      <li>Set preferences for certain websites</li>
                      <li>Receive notifications when cookies are set</li>
                    </ul>
                    <p className="text-stone-700">
                      To learn how to manage cookies in your specific browser, visit the browser's help pages. Please note that blocking cookies may affect your experience on our website.
                    </p>
                  </div>

                  <div id="third-party" className="mb-8 scroll-mt-32">
                    <h2 className="text-2xl font-bold text-[#0F4C55] mb-4 font-serif">Third-Party Cookies</h2>
                    <p className="text-stone-700 mb-4">
                      Some cookies are placed by third-party services that appear on our pages. These may include:
                    </p>
                    <ul className="list-disc pl-6 text-stone-700 space-y-2 mb-4">
                      <li><span className="font-bold">Analytics:</span> Google Analytics to help us understand website traffic</li>
                      <li><span className="font-bold">Advertising:</span> Facebook, Google Ads for marketing purposes</li>
                      <li><span className="font-bold">Payment:</span> Payment processors for secure transactions</li>
                      <li><span className="font-bold">Social Media:</span> Social sharing buttons</li>
                    </ul>
                    <p className="text-stone-700">
                      We do not control these third-party cookies. You should check the respective privacy policies of these third parties for more information.
                    </p>
                  </div>

                  <div className="mt-8 p-4 bg-[#f5f2ee] border border-stone-200 rounded-sm">
                    <h3 className="text-lg font-bold text-[#0F4C55] mb-2 flex items-center gap-2">
                      <MdUpdate className="text-[#ED9B40]" /> Cookie Policy Updates
                    </h3>
                    <p className="text-stone-700 text-sm">
                      We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of our website after such changes constitutes your acceptance of the updated policy.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white border-t border-stone-200">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl text-center text-[#0F4C55] mb-8 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked <span className="italic">Questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-stone-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 bg-[#f5f2ee] flex justify-between items-center hover:bg-[#ebe5de] transition-colors"
                >
                  <span className="font-bold text-[#0F4C55]">{faq.q}</span>
                  <span className="text-[#ED9B40] text-xl">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white">
                    <p className="text-stone-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-[#f5f2ee]">
        <div className="max-w-[800px] mx-auto text-center">
          <FaShieldAlt className="text-4xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Still Have <span className="italic">Questions?</span>
          </h2>
          <p className="text-stone-600 mb-8">
            Our team is here to help you understand our policies and how we protect your information.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-[#0F4C55] hover:text-white transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/dashboard?tab=new-consultation"
              className="px-6 py-3 border border-[#0F4C55] text-[#0F4C55] font-bold uppercase tracking-widest text-xs hover:bg-[#0F4C55] hover:text-white transition-colors"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsAndPolicy;