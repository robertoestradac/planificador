/**
 * Plan Helper Functions
 * Centralized utilities for plan duration and expiration calculations
 */

/**
 * Calculate expiration date based on plan duration
 * @param {Date} startDate - Start date
 * @param {number} durationMonths - Duration in months from plan
 * @returns {Date} Expiration date
 */
function calculateExpirationDate(startDate, durationMonths) {
  const expirationDate = new Date(startDate);
  expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
  return expirationDate;
}

/**
 * Get expiration date for a plan
 * @param {Object} plan - Plan object with duration_months
 * @param {Date} startDate - Optional start date (defaults to now)
 * @returns {Date} Expiration date
 */
function getPlanExpirationDate(plan, startDate = new Date()) {
  const durationMonths = plan.duration_months || 1;
  return calculateExpirationDate(startDate, durationMonths);
}

/**
 * Check if a subscription is expired
 * @param {Date|string} expiresAt - Expiration date
 * @returns {boolean} True if expired
 */
function isSubscriptionExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Get days until expiration
 * @param {Date|string} expiresAt - Expiration date
 * @returns {number} Days until expiration (negative if expired)
 */
function getDaysUntilExpiration(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if subscription is expiring soon (within 7 days)
 * @param {Date|string} expiresAt - Expiration date
 * @returns {boolean} True if expiring soon
 */
function isExpiringSoon(expiresAt) {
  const daysLeft = getDaysUntilExpiration(expiresAt);
  return daysLeft > 0 && daysLeft <= 7;
}

module.exports = {
  calculateExpirationDate,
  getPlanExpirationDate,
  isSubscriptionExpired,
  getDaysUntilExpiration,
  isExpiringSoon,
};
