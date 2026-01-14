/**
 * Parse creator profile/bio text to extract contact information
 */

// Email regex patterns
const EMAIL_PATTERNS = [
  // Standard email
  /[\w.-]+@[\w.-]+\.\w+/gi,
  // "email: xxx" format
  /(?:email|e-mail|mail|contact|business|enquiries|inquiries)[:\s]+([^\s<>,]+@[^\s<>,]+\.[^\s<>,]+)/gi,
  // "xxx (at) xxx (dot) com" format
  /[\w.-]+\s*\(?(?:at|@)\)?\s*[\w.-]+\s*\(?(?:dot|\.)\)?\s*\w+/gi,
];

// Social media patterns
const SOCIAL_PATTERNS = {
  youtube: [
    /(?:youtube\.com\/(?:c\/|channel\/|user\/|@)?)([\w-]+)/gi,
    /(?:yt\.be\/)([\w-]+)/gi,
  ],
  instagram: [
    /(?:instagram\.com\/)([\w.]+)/gi,
    /(?:ig|insta|instagram)[:\s@]+@?([\w.]+)/gi,
  ],
  tiktok: [
    /(?:tiktok\.com\/@?)([\w.]+)/gi,
    /(?:tiktok|tt)[:\s@]+@?([\w.]+)/gi,
  ],
  twitter: [
    /(?:twitter\.com\/|x\.com\/)([\w]+)/gi,
    /(?:twitter|x)[:\s@]+@?([\w]+)/gi,
  ],
  twitch: [
    /(?:twitch\.tv\/)([\w]+)/gi,
  ],
};

// Linktree/hub patterns
const HUB_PATTERNS = [
  /(?:linktr\.ee|linktree\.com)\/([\w.-]+)/gi,
  /(?:beacons\.ai)\/([\w.-]+)/gi,
  /(?:stan\.store)\/([\w.-]+)/gi,
  /(?:bio\.link)\/([\w.-]+)/gi,
  /(?:allmylinks\.com)\/([\w.-]+)/gi,
  /(?:linkpop\.com)\/([\w.-]+)/gi,
  /(?:tap\.bio)\/@?([\w.-]+)/gi,
  /(?:solo\.to)\/([\w.-]+)/gi,
  /(?:campsite\.bio)\/([\w.-]+)/gi,
];

interface ParsedContact {
  emails: Array<{
    email: string;
    confidence: number;
    source: string;
  }>;
  socialLinks: {
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    twitch?: string;
  };
  hubUrl?: string;
}

export function parseCreatorContact(
  text: string,
  sourceName: string = 'unknown'
): ParsedContact {
  const result: ParsedContact = {
    emails: [],
    socialLinks: {},
  };

  if (!text) return result;

  // Normalize text
  const normalizedText = text.toLowerCase();

  // Find emails
  for (const pattern of EMAIL_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const email = match[1] || match[0];
      const cleanEmail = email.toLowerCase().trim();
      
      // Skip if already found or looks invalid
      if (
        result.emails.some(e => e.email === cleanEmail) ||
        cleanEmail.includes('example') ||
        cleanEmail.includes('email@') ||
        cleanEmail.length < 5
      ) {
        continue;
      }

      // Determine confidence
      let confidence = 0.5;
      if (normalizedText.includes('business') || normalizedText.includes('inquir')) {
        confidence = 0.9;
      } else if (normalizedText.includes('contact') || normalizedText.includes('email')) {
        confidence = 0.8;
      } else if (normalizedText.includes('collab') || normalizedText.includes('partner')) {
        confidence = 0.7;
      }

      result.emails.push({
        email: cleanEmail,
        confidence,
        source: sourceName,
      });
    }
  }

  // Sort emails by confidence
  result.emails.sort((a, b) => b.confidence - a.confidence);

  // Find social links
  for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const username = match[1].replace(/^@/, '');
        if (username.length > 1 && !username.includes('.com')) {
          result.socialLinks[platform as keyof typeof result.socialLinks] = username;
          break;
        }
      }
    }
  }

  // Find hub URL
  for (const pattern of HUB_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      result.hubUrl = match[0];
      break;
    }
  }

  return result;
}

/**
 * Fetch and parse a Linktree/hub page for additional links
 */
export async function fetchHubPageLinks(hubUrl: string): Promise<ParsedContact> {
  const result: ParsedContact = {
    emails: [],
    socialLinks: {},
  };

  try {
    const response = await fetch(hubUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RisingCreatorsBot/1.0)',
      },
    });

    if (!response.ok) {
      return result;
    }

    const html = await response.text();
    return parseCreatorContact(html, 'hub_page');
  } catch (error) {
    console.error('Error fetching hub page:', error);
    return result;
  }
}
