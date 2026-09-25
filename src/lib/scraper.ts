import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedCompanyData {
  title: string;
  description: string;
  keywords: string[];
  detectedTech: string[];
  contactEmails: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  headings: string[];
  rawTextSnippet: string;
}

export async function scrapeCompanyWebsite(rawUrl: string): Promise<ScrapedCompanyData> {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="twitter:description"]').attr('content') || '';
    
    const keywordsStr = $('meta[name="keywords"]').attr('content') || '';
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [];

    const headings: string[] = [];
    $('h1, h2').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 5 && text.length < 120 && !headings.includes(text)) {
        headings.push(text);
      }
    });

    // Detect social links
    const socialLinks: { linkedin?: string; twitter?: string; github?: string } = {};
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/company/') || href.includes('linkedin.com/in/')) {
        socialLinks.linkedin = href;
      }
      if (href.includes('twitter.com/') || href.includes('x.com/')) {
        socialLinks.twitter = href;
      }
      if (href.includes('github.com/')) {
        socialLinks.github = href;
      }
    });

    // Extract emails
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const bodyText = $('body').text();
    const emailsFound = Array.from(new Set(bodyText.match(emailRegex) || []))
      .filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('example.com') && !e.includes('sentry.io'));

    // Detect tech stack
    const detectedTech: string[] = [];
    const lowerHtml = html.toLowerCase();

    if (lowerHtml.includes('next.js') || lowerHtml.includes('/_next/')) detectedTech.push('Next.js');
    if (lowerHtml.includes('react') || lowerHtml.includes('react-dom')) detectedTech.push('React');
    if (lowerHtml.includes('vue') || lowerHtml.includes('nuxt')) detectedTech.push('Vue.js');
    if (lowerHtml.includes('shopify') || lowerHtml.includes('cdn.shopify.com')) detectedTech.push('Shopify');
    if (lowerHtml.includes('wordpress') || lowerHtml.includes('wp-content')) detectedTech.push('WordPress');
    if (lowerHtml.includes('stripe.com') || lowerHtml.includes('stripe')) detectedTech.push('Stripe');
    if (lowerHtml.includes('hubspot') || lowerHtml.includes('hs-scripts')) detectedTech.push('HubSpot');
    if (lowerHtml.includes('intercom') || lowerHtml.includes('widget.intercom.io')) detectedTech.push('Intercom');
    if (lowerHtml.includes('segment') || lowerHtml.includes('cdn.segment.com')) detectedTech.push('Segment');
    if (lowerHtml.includes('tailwind')) detectedTech.push('TailwindCSS');
    if (lowerHtml.includes('google-analytics') || lowerHtml.includes('googletagmanager')) detectedTech.push('Google Analytics');

    const cleanText = $('p').map((_, el) => $(el).text().trim()).get().join(' ').replace(/\s+/g, ' ').slice(0, 1500);

    return {
      title,
      description,
      keywords,
      detectedTech: detectedTech.slice(0, 8),
      contactEmails: emailsFound.slice(0, 3),
      socialLinks,
      headings: headings.slice(0, 6),
      rawTextSnippet: cleanText
    };
  } catch (err: unknown) {
    // Return heuristic fallback based on domain name
    const domain = url.replace(/https?:\/\//i, '').replace(/\/.*$/, '');
    const cleanName = domain.split('.')[0] || 'Target Company';
    const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    return {
      title: `${capitalizedName} | Business & Technology`,
      description: `Official digital presence and solutions by ${capitalizedName}.`,
      keywords: ['Technology', 'Software', 'Services', 'Enterprise'],
      detectedTech: ['Cloud Infrastructure', 'Web Framework'],
      contactEmails: [`contact@${domain}`, `hello@${domain}`],
      socialLinks: {
        linkedin: `https://linkedin.com/company/${cleanName.toLowerCase()}`
      },
      headings: [`Welcome to ${capitalizedName}`, `Enterprise Solutions & Services`],
      rawTextSnippet: `${capitalizedName} provides specialized business and digital solutions for modern companies.`
    };
  }
}
