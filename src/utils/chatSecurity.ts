/**
 * Chat Security Utilities
 * Prevents scams, spam, and malicious content in chat messages
 */

// Suspicious patterns to detect
const SUSPICIOUS_PATTERNS = [
  // Payment scams
  /(?:send|transfer|pay|give)\s+(?:me|us)\s+(?:money|payment|₹|rupees?|cash)/i,
  /(?:urgent|immediate|quick)\s+(?:payment|money|transfer)/i,
  /(?:click|visit|go to)\s+(?:this|that)\s+(?:link|url|website)/i,
  /(?:free|win|prize|lottery|reward)\s+(?:money|₹|cash|payment)/i,
  /(?:verify|confirm|update)\s+(?:your|account|bank|upi|payment)/i,
  
  // Phishing attempts
  /(?:verify|confirm|update)\s+(?:account|bank|upi|card|details)/i,
  /(?:suspended|blocked|locked)\s+(?:account|bank|upi)/i,
  /(?:click|visit)\s+(?:here|link|url)\s+(?:to|for)\s+(?:verify|unlock|activate)/i,
  
  // Spam patterns
  /(?:buy|sell|cheap|discount|offer)\s+(?:now|today|limited)/i,
  /(?:call|contact|whatsapp|telegram)\s+(?:me|us)\s+(?:at|on)\s+\d+/i,
  /(?:multiple|many|several)\s+(?:exclamation|question)\s+marks/i,
  
  // Suspicious links
  /(?:bit\.ly|tinyurl|short\.link|goo\.gl)/i,
  /(?:http|https):\/\/[^\s]+(?:\.exe|\.zip|\.rar|\.scr)/i,
];

// Safe domains (whitelist)
const SAFE_DOMAINS = [
  'github.com',
  'github.io',
  'codepen.io',
  'codesandbox.io',
  'stackoverflow.com',
  'youtube.com',
  'youtu.be',
  'google.com',
  'drive.google.com',
  'docs.google.com',
  'figma.com',
  'notion.so',
  'medium.com',
  'dev.to',
];

// Extract URLs from text
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.match(urlRegex) || [];
};

// Check if URL is suspicious
export const isSuspiciousUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a safe domain
    if (SAFE_DOMAINS.some(domain => hostname.includes(domain))) {
      return false;
    }
    
    // Check for suspicious patterns
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Check for suspicious file extensions
    if (/\.(exe|zip|rar|scr|bat|cmd|com|pif|vbs|js|jar)$/i.test(url)) {
      return true;
    }
    
    // Check for IP addresses (often suspicious)
    if (/^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
      return true;
    }
    
    // Check for very short domains (often URL shorteners used for scams)
    if (hostname.split('.').length === 2 && hostname.length < 10) {
      return true;
    }
    
    return false;
  } catch {
    return true; // Invalid URL is suspicious
  }
};

// Check if message contains suspicious content
export const isSuspiciousMessage = (message: string): { suspicious: boolean; reason?: string } => {
  const lowerMessage = message.toLowerCase();
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(message)) {
      return { 
        suspicious: true, 
        reason: 'Contains suspicious payment or phishing patterns' 
      };
    }
  }
  
  // Check URLs
  const urls = extractUrls(message);
  for (const url of urls) {
    if (isSuspiciousUrl(url)) {
      return { 
        suspicious: true, 
        reason: 'Contains suspicious link' 
      };
    }
  }
  
  // Check for excessive caps (spam indicator)
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.5 && message.length > 20) {
    return { 
      suspicious: true, 
      reason: 'Excessive capitalization (possible spam)' 
    };
  }
  
  // Check for excessive special characters
  const specialCharRatio = (message.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / message.length;
  if (specialCharRatio > 0.3) {
    return { 
      suspicious: true, 
      reason: 'Excessive special characters (possible spam)' 
    };
  }
  
  return { suspicious: false };
};

// Sanitize message content (remove potentially dangerous content)
export const sanitizeMessage = (message: string): string => {
  let sanitized = message;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (can be used for XSS)
  sanitized = sanitized.replace(/data:[^;]*;base64,[^\s]+/gi, '[removed data URL]');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

// Validate message before sending
export const validateMessage = (message: string): { valid: boolean; error?: string; warning?: string } => {
  // Check length
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 1000) {
    return { valid: false, error: 'Message is too long (max 1000 characters)' };
  }
  
  // Check for suspicious content
  const suspiciousCheck = isSuspiciousMessage(message);
  if (suspiciousCheck.suspicious) {
    return { 
      valid: false, 
      error: `Message blocked: ${suspiciousCheck.reason}. Please review your message and avoid sharing payment links or suspicious content.` 
    };
  }
  
  // Check URLs
  const urls = extractUrls(message);
  if (urls.length > 5) {
    return { 
      valid: false, 
      error: 'Too many links in message (max 5)' 
    };
  }
  
  // Warning for URLs
  if (urls.length > 0) {
    return { 
      valid: true, 
      warning: 'Make sure all links are safe before clicking. Only share links from trusted sources.' 
    };
  }
  
  return { valid: true };
};

// Check if message contains payment-related content
export const containsPaymentContent = (message: string): boolean => {
  const paymentKeywords = [
    'upi', 'payment', 'pay', 'transfer', 'money', '₹', 'rupee',
    'bank', 'account', 'transaction', 'paytm', 'phonepe', 'gpay'
  ];
  
  const lowerMessage = message.toLowerCase();
  return paymentKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Extract UPI ID from message (if present)
export const extractUpiId = (message: string): string | null => {
  const upiPattern = /([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/i;
  const match = message.match(upiPattern);
  return match ? match[1] : null;
};

// Rate limiting check (client-side, server should also enforce)
export const checkRateLimit = (
  lastMessageTime: number | null,
  minIntervalMs: number = 1000
): { allowed: boolean; waitTime?: number } => {
  if (!lastMessageTime) {
    return { allowed: true };
  }
  
  const timeSinceLastMessage = Date.now() - lastMessageTime;
  if (timeSinceLastMessage < minIntervalMs) {
    return { 
      allowed: false, 
      waitTime: Math.ceil((minIntervalMs - timeSinceLastMessage) / 1000) 
    };
  }
  
  return { allowed: true };
};
