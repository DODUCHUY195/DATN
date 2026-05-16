/**
 * Validates URLs to prevent XSS and injection attacks
 */
const validateUrl = (url, allowedProtocols = ['http:', 'https:']) => {
  if (!url) return true; // Optional URLs are ok
  
  // Check if string contains suspicious patterns
  if (typeof url !== 'string') return false;
  if (url.includes('javascript:') || url.includes('data:')) return false;
  if (url.trim() === '') return true;

  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
};

module.exports = { validateUrl };
