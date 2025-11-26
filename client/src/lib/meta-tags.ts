/**
 * Utility for managing Open Graph meta tags for social sharing
 */

export interface MetaTagConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

/**
 * Strip HTML tags and decode HTML entities from text
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove HTML tags
  const cleaned = decoded.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace and trim
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Update Open Graph meta tags for proper social sharing
 */
export function updateMetaTags(config: MetaTagConfig): void {
  const { title, description, image, url, type = 'article' } = config;
  
  // Sanitize text inputs to remove HTML
  const sanitizedTitle = sanitizeText(title);
  const sanitizedDescription = sanitizeText(description);

  // Update og:title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', sanitizedTitle);

  // Update og:description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute('content', sanitizedDescription);

  // Update og:image
  let ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.setAttribute('content', image);

  // Update og:url
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', url);

  // Update og:type
  let ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) {
    ogType = document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    document.head.appendChild(ogType);
  }
  ogType.setAttribute('content', type);

  // Update twitter:card
  let twitterCard = document.querySelector('meta[name="twitter:card"]');
  if (!twitterCard) {
    twitterCard = document.createElement('meta');
    twitterCard.setAttribute('name', 'twitter:card');
    document.head.appendChild(twitterCard);
  }
  twitterCard.setAttribute('content', 'summary_large_image');

  // Update twitter:title
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twitterTitle) {
    twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    document.head.appendChild(twitterTitle);
  }
  twitterTitle.setAttribute('content', sanitizedTitle);

  // Update twitter:description
  let twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (!twitterDescription) {
    twitterDescription = document.createElement('meta');
    twitterDescription.setAttribute('name', 'twitter:description');
    document.head.appendChild(twitterDescription);
  }
  twitterDescription.setAttribute('content', sanitizedDescription);

  // Update twitter:image
  let twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (!twitterImage) {
    twitterImage = document.createElement('meta');
    twitterImage.setAttribute('name', 'twitter:image');
    document.head.appendChild(twitterImage);
  }
  twitterImage.setAttribute('content', image);
}

/**
 * Reset meta tags to default
 */
export function resetMetaTags(): void {
  const ogTags = [
    'og:title',
    'og:description',
    'og:image',
    'og:url',
    'og:type',
  ];

  const twitterTags = [
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
  ];

  ogTags.forEach((tag) => {
    const element = document.querySelector(`meta[property="${tag}"]`);
    if (element) {
      element.remove();
    }
  });

  twitterTags.forEach((tag) => {
    const element = document.querySelector(`meta[name="${tag}"]`);
    if (element) {
      element.remove();
    }
  });
}
