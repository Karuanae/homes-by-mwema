import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://homesbymwema.com";

const DEFAULT_META = {
  title: "Homes by Mwema | Interior Design, Airport Transfers, Airbnb Services Kenya",
  description:
    "Homes by Mwema offers interior design, Airbnb setup, airport and SGR transfers, and short stay property marketing across Nairobi, Mombasa, and Diani.",
  keywords:
    "homes Kenya, short stay Kenya, Airbnb Kenya, interior designers Nairobi, home interior design Kenya, Nairobi airport transfers, SGR station transfers Nairobi",
  image: `${SITE_URL}/og-image2.png`,
  schema: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Homes by Mwema",
    url: SITE_URL,
    image: `${SITE_URL}/og-image2.png`,
    telephone: "+254720108914",
    areaServed: ["Nairobi", "Mombasa", "Diani", "Kileleshwa", "Kilimani", "Westlands"],
    sameAs: [
      "https://www.instagram.com/homes_bymwema",
      "https://www.tiktok.com/@homesby_mwema",
      "https://youtube.com/@annmwema",
      "https://www.facebook.com/profile.php?id=100089293815433"
    ],
    serviceType: [
      "Interior design services",
      "Airbnb setup services",
      "Airport transfer services",
      "SGR transfer services",
      "Short stay property marketing"
    ]
  }
};

const PAGE_META = {
  "/": {
    title: "Homes by Mwema | Homes, Airbnb, Short Stay, Interior Design Kenya",
    description:
      "Book premium homes and short stay properties in Kenya. Get Airbnb setup, interior design, airport transfers, and social media property marketing.",
    keywords:
      "homes Kenya, airbnb Kenya, short stay Kenya, homes Nairobi, interior designers Nairobi, airport transfers Nairobi, property marketing Kenya",
    schema: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Homes by Mwema",
      url: SITE_URL,
      image: `${SITE_URL}/og-image2.png`,
      telephone: "+254720108914",
      address: {
        "@type": "PostalAddress",
        addressCountry: "KE",
        addressLocality: "Nairobi"
      },
      areaServed: ["Nairobi", "Mombasa", "Diani"],
      openingHours: "Mo-Su 00:00-23:59"
    }
  },
  "/interior-design": {
    title: "Interior Designers Nairobi | Airbnb Interior Design Kenya | Homes by Mwema",
    description:
      "Professional interior designers in Nairobi for homes and Airbnbs. Furniture sourcing, space planning, and complete setup for short stay success.",
    keywords:
      "interior designers Nairobi, home interior design Kenya, Airbnb interior design Kenya, affordable interior design Nairobi, house interior designers near me",
    schema: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Homes by Mwema Interior Design",
      url: `${SITE_URL}/interior-design`,
      areaServed: ["Nairobi", "Mombasa", "Diani"],
      priceRange: "KES 150,000+",
      serviceType: "Interior design and Airbnb setup"
    }
  },
  "/airport-transfers": {
    title: "Nairobi Airport Transfers | JKIA & SGR Transfers | Homes by Mwema",
    description:
      "24/7 airport and SGR transfers from JKIA, Wilson, and Nairobi SGR. Reliable rides to Westlands, CBD, Karen, Mombasa, and Diani.",
    keywords:
      "Nairobi airport transfers, JKIA to Nairobi CBD transfer, SGR station transfers Nairobi, airport pickup service Nairobi, 24/7 airport transfers Kenya",
    schema: {
      "@context": "https://schema.org",
      "@type": "TaxiService",
      name: "Homes by Mwema Airport and SGR Transfers",
      url: `${SITE_URL}/airport-transfers`,
      areaServed: ["Nairobi", "Mombasa", "Diani"],
      availableLanguage: ["English", "Swahili"],
      openingHours: "Mo-Su 00:00-23:59"
    }
  },
  "/social-media-marketing": {
    title: "Airbnb Promotion Services Nairobi | Property Marketing Kenya | Homes by Mwema",
    description:
      "Promote your Airbnb and short stay property with social media marketing in Kenya. Reach more guests on Instagram, TikTok, Facebook, and YouTube.",
    keywords:
      "property management social media Kenya, Airbnb promotion services Nairobi, property listing marketing Kenya, short stay marketing Kenya",
    schema: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Homes by Mwema Property Social Media Marketing",
      url: `${SITE_URL}/social-media-marketing`,
      areaServed: ["Nairobi", "Mombasa", "Diani"],
      serviceType: "Property social media promotion"
    }
  },
  "/properties": {
    title: "Homes and Short Stay Properties in Kenya | Homes by Mwema",
    description:
      "Discover homes, Airbnb units, and short stay properties in Nairobi and beyond. View available listings and reserve directly.",
    keywords:
      "homes Nairobi, short stay properties Kenya, airbnb homes Kenya, furnished apartments Nairobi"
  }
};

const NO_INDEX_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/admin",
  "/payment"
];

function upsertMeta(attr, key, value) {
  if (!value) return;
  let element = document.head.querySelector(`meta[${attr}='${key}']`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

function upsertLink(rel, href) {
  if (!href) return;
  let element = document.head.querySelector(`link[rel='${rel}']`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function getMetaForPath(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];

  if (pathname.startsWith("/interior-design")) return PAGE_META["/interior-design"];
  if (pathname.startsWith("/airport-transfers")) return PAGE_META["/airport-transfers"];
  if (pathname.startsWith("/social-media-marketing")) return PAGE_META["/social-media-marketing"];
  if (pathname.startsWith("/properties")) return PAGE_META["/properties"];

  return DEFAULT_META;
}

function shouldNoIndex(pathname) {
  return NO_INDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function ensureGtag(trackingIds) {
  if (!trackingIds.length) return;

  const srcId = trackingIds[0];
  if (!document.getElementById("hbm-gtag-script")) {
    const script = document.createElement("script");
    script.id = "hbm-gtag-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(srcId)}`;
    document.head.appendChild(script);
  }

  if (!window.dataLayer) window.dataLayer = [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
  }

  trackingIds.forEach((id) => {
    window.gtag("config", id, { anonymize_ip: true });
  });
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    const adsId = import.meta.env.VITE_GOOGLE_ADS_ID;
    const trackingIds = [ga4Id, adsId].filter(Boolean);
    ensureGtag(trackingIds);
  }, []);

  useEffect(() => {
    const { pathname } = location;
    const meta = getMetaForPath(pathname);
    const merged = { ...DEFAULT_META, ...meta };
    const noIndex = shouldNoIndex(pathname);

    const canonicalUrl = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

    document.title = merged.title;
    upsertMeta("name", "description", merged.description);
    upsertMeta("name", "keywords", merged.keywords);
    upsertMeta(
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large"
    );

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", merged.title);
    upsertMeta("property", "og:description", merged.description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", merged.image || DEFAULT_META.image);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", merged.title);
    upsertMeta("name", "twitter:description", merged.description);
    upsertMeta("name", "twitter:image", merged.image || DEFAULT_META.image);

    const siteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
    if (siteVerification) {
      upsertMeta("name", "google-site-verification", siteVerification);
    }

    upsertLink("canonical", canonicalUrl);

    let schemaElement = document.getElementById("hbm-json-ld");
    if (!schemaElement) {
      schemaElement = document.createElement("script");
      schemaElement.id = "hbm-json-ld";
      schemaElement.type = "application/ld+json";
      document.head.appendChild(schemaElement);
    }
    schemaElement.textContent = JSON.stringify(merged.schema || DEFAULT_META.schema);
  }, [location]);

  return null;
}
