
// src/lib/authConstants.ts

// IMPORTANT: For production, this JWT_SECRET MUST be a strong, unique secret
// stored securely as an environment variable (e.g., in .env.local and on your server)
// and NOT hardcoded directly in the source code or committed to version control.
// Example: export const JWT_SECRET = process.env.JWT_SECRET;
// For development, you can use a placeholder, but ensure it's strong.

export const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_VERY_STRONG_AND_UNIQUE_SECRET_KEY_HERE_#*&@!^%_CHANGE_THIS';

if (process.env.NODE_ENV !== 'production' && JWT_SECRET === 'YOUR_VERY_VERY_STRONG_AND_UNIQUE_SECRET_KEY_HERE_#*&@!^%_CHANGE_THIS') {
  console.warn(
    "WARNING: You are using the default placeholder JWT_SECRET. " +
    "Please set a strong, unique secret in your environment variables (e.g., .env.local) " +
    "for JWT_SECRET, especially for production."
  );
}

if (!JWT_SECRET) {
  // This check is more relevant if you *only* rely on process.env.JWT_SECRET
  // and don't provide a fallback like the placeholder above.
  // For a real production build, you might want to throw an error here if JWT_SECRET is not found.
  console.error(
    "CRITICAL ERROR: JWT_SECRET is not defined. The application will not function securely. " +
    "Please set JWT_SECRET in your environment variables."
  );
  // throw new Error("JWT_SECRET is not defined."); // Uncomment to make it a hard fail
}
