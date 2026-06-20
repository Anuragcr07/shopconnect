// src/lib/validation.ts
// SECURITY FIX: Centralised input validation and sanitisation

/**
 * Password strength rules:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter.",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character (!@#$%^&*).",
    };
  }
  return { valid: true, message: "OK" };
}

/**
 * Basic email format validation
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Sanitise a plain-text string:
 * - Trims whitespace
 * - Removes HTML tags (prevents stored XSS)
 * - Limits length
 */
export function sanitiseString(value: unknown, maxLength = 255): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .slice(0, maxLength);
}

/**
 * Validate user role — only allow known roles
 */
export function validateRole(role: unknown): role is "CUSTOMER" | "SHOPKEEPER" {
  return role === "CUSTOMER" || role === "SHOPKEEPER";
}

/**
 * Validate phone number — digits, spaces, +, -, (, ) only; 7-15 chars
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // phone is optional
  return /^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim());
}

/**
 * Encode a search query for safe URL embedding (prevents open redirect / injection)
 */
export function sanitiseSearchQuery(query: string): string {
  return encodeURIComponent(query.trim().slice(0, 200));
}