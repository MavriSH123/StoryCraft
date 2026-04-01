/**
 * Generates a unique ID using crypto.randomUUID() with fallback
 * @returns A unique string identifier
 */
export const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};
