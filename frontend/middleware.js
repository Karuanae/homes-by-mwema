export const config = {
  // Only run middleware on these specific routes
  matcher: ['/safari-tours', '/sales-and-marketing', '/properties'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Fetch your standard index.html from Vercel
  const response = await fetch(new URL('/', request.url));
  let html = await response.text();

  // 2. Define the images, titles, and descriptions for your specific pages
  let ogImage = 'https://homesbymwema.com/default-homepage-image.jpg';
  let ogTitle = 'Homes by Mwema';
  let ogDescription = 'Premium properties and tours in Kenya.';

  if (path === '/safari-tours') {
    ogImage = 'https://homesbymwema.com/images/safari-tours-preview.jpg'; // <-- Replace with your actual image URL
    ogTitle = 'Safari Tours | Homes by Mwema';
    ogDescription = 'Experience the ultimate Kenyan safari with our exclusive tour packages.';
  } else if (path === '/sales-and-marketing') {
    ogImage = 'https://homesbymwema.com/images/sales-marketing-preview.jpg'; // <-- Replace with your actual image URL
    ogTitle = 'Sales & Marketing | Homes by Mwema';
    ogDescription = 'Expert real estate sales and marketing services in Kenya.';
  }

  // 3. Inject the specific Open Graph tags into the HTML <head>
  const ogTags = `
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${request.url}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${ogImage}" />
  `;

  // Insert the tags right before the closing </head> tag
  html = html.replace('</head>', `${ogTags}</head>`);

  // 4. Return the modified HTML to WhatsApp
  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  });
}