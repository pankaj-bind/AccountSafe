// Brand Search Service using Brandfetch API
// Provides brand logo and metadata search functionality

export interface BrandSearchResult {
  name: string;
  domain: string;
  icon?: string;
  logo?: string;
  website_link?: string;
  isFallback?: boolean;
}

const BRANDFETCH_API_KEY = process.env.REACT_APP_BRANDFETCH_API_KEY || '';

/**
 * Search for brands using the Hybrid API (Local DB + Clearbit)
 * Falls back to local patterns if API fails
 */
export const searchBrands = async (query: string): Promise<BrandSearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Use the hybrid search API (Local Database + Clearbit)
    const response = await fetch(
      `http://localhost:8000/api/organizations/search/?q=${encodeURIComponent(query)}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.name,
        domain: item.domain,
        logo: item.logo,
        website_link: item.website_link,
        isFallback: item.source === 'local' ? false : true
      }));
    }

    // Fallback to local patterns if API fails
    return createFallbackSuggestions(query);
  } catch (error) {
    console.error('Brand search error:', error);
    return createFallbackSuggestions(query);
  }
};

/**
 * Get brand logo URL from domain
 */
export const getBrandLogoUrl = (domain: string, size: number = 512): string => {
  return `https://cdn.brandfetch.io/${domain}/w/${size}/h/${size}`;
};

/**
 * Get fallback favicon URL
 */
export const getFallbackLogoUrl = (domain: string): string => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

/**
 * Create fallback suggestions based on common domain patterns
 */
const createFallbackSuggestions = (query: string): BrandSearchResult[] => {
  const normalized = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Brand variations for better matching
  const brandVariations: { [key: string]: BrandSearchResult[] } = {
    'geeks': [
      { name: 'GeeksforGeeks', domain: 'geeksforgeeks.org', website_link: 'https://geeksforgeeks.org', isFallback: true },
      { name: 'GeeksforGeeks Practice', domain: 'practice.geeksforgeeks.org', website_link: 'https://practice.geeksforgeeks.org', isFallback: true },
    ],
    'google': [
      { name: 'Google', domain: 'google.com', website_link: 'https://google.com', isFallback: true },
      { name: 'Gmail', domain: 'gmail.com', website_link: 'https://gmail.com', isFallback: true },
      { name: 'Google Drive', domain: 'drive.google.com', website_link: 'https://drive.google.com', isFallback: true },
    ],
    'github': [
      { name: 'GitHub', domain: 'github.com', website_link: 'https://github.com', isFallback: true },
      { name: 'GitHub Gist', domain: 'gist.github.com', website_link: 'https://gist.github.com', isFallback: true },
    ],
    'facebook': [
      { name: 'Facebook', domain: 'facebook.com', website_link: 'https://facebook.com', isFallback: true },
      { name: 'Meta', domain: 'meta.com', website_link: 'https://meta.com', isFallback: true },
    ],
    'microsoft': [
      { name: 'Microsoft', domain: 'microsoft.com', website_link: 'https://microsoft.com', isFallback: true },
      { name: 'Outlook', domain: 'outlook.com', website_link: 'https://outlook.com', isFallback: true },
      { name: 'Office 365', domain: 'office.com', website_link: 'https://office.com', isFallback: true },
    ],
    'amazon': [
      { name: 'Amazon', domain: 'amazon.com', website_link: 'https://amazon.com', isFallback: true },
      { name: 'AWS', domain: 'aws.amazon.com', website_link: 'https://aws.amazon.com', isFallback: true },
    ],
  };

  // Check for brand variations first
  for (const [key, variations] of Object.entries(brandVariations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return variations;
    }
  }

  // Common single brands
  const commonDomains = [
    { pattern: /^(twitter|x)$/, domain: 'twitter.com', name: 'Twitter/X' },
    { pattern: /^(instagram|ig|insta)/, domain: 'instagram.com', name: 'Instagram' },
    { pattern: /^(linkedin|li)/, domain: 'linkedin.com', name: 'LinkedIn' },
    { pattern: /^(apple|icloud)/, domain: 'apple.com', name: 'Apple' },
    { pattern: /^(netflix)/, domain: 'netflix.com', name: 'Netflix' },
    { pattern: /^(spotify)/, domain: 'spotify.com', name: 'Spotify' },
    { pattern: /^(discord)/, domain: 'discord.com', name: 'Discord' },
    { pattern: /^(slack)/, domain: 'slack.com', name: 'Slack' },
    { pattern: /^(notion)/, domain: 'notion.so', name: 'Notion' },
    { pattern: /^(reddit)/, domain: 'reddit.com', name: 'Reddit' },
    { pattern: /^(youtube|yt)/, domain: 'youtube.com', name: 'YouTube' },
    { pattern: /^(twitch)/, domain: 'twitch.tv', name: 'Twitch' },
    { pattern: /^(paypal)/, domain: 'paypal.com', name: 'PayPal' },
    { pattern: /^(dropbox)/, domain: 'dropbox.com', name: 'Dropbox' },
    { pattern: /^(zoom)/, domain: 'zoom.us', name: 'Zoom' },
  ];

  const results: BrandSearchResult[] = [];

  // Check for exact matches and add all matching ones
  for (const { pattern, domain, name } of commonDomains) {
    if (pattern.test(normalized)) {
      results.push({
        name,
        domain,
        website_link: `https://${domain}`,
        isFallback: true
      });
    }
  }

  // Add a generic suggestion as last resort
  if (results.length === 0) {
    const domain = `${normalized}.com`;
    results.push({
      name: query,
      domain,
      website_link: `https://${domain}`,
      isFallback: true
    });
  }

  return results;
};

/**
 * Fetch brand details by domain
 */
export const getBrandDetails = async (domain: string): Promise<BrandSearchResult | null> => {
  try {
    if (BRANDFETCH_API_KEY) {
      const response = await fetch(
        `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`,
        {
          headers: {
            'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          name: data.name,
          domain: data.domain,
          icon: data.icon,
          logo: data.logo,
          website_link: `https://${data.domain}`,
          isFallback: false
        };
      }
    }

    return {
      name: domain.split('.')[0],
      domain,
      website_link: `https://${domain}`,
      isFallback: true
    };
  } catch (error) {
    console.error('Failed to fetch brand details:', error);
    return null;
  }
};
