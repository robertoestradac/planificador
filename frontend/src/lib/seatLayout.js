/**
 * Calculate seat positions around a table center.
 * @param {number} N - number of seats
 * @param {number} R - radius in pixels
 * @param {number} cx - center x relative to table div
 * @param {number} cy - center y relative to table div
 * @returns {{ x: number, y: number }[]}
 */
export function calcSeatPositions(N, R, cx, cy) {
  const positions = [];
  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    positions.push({
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    });
  }
  return positions;
}

/**
 * Derive seat status from RSVP response and assignment.
 * @param {object|null} assignment
 * @returns {'occupied'|'pending'|'free'}
 */
export function getSeatStatus(assignment) {
  if (!assignment) return 'free';
  if (assignment.rsvp_status === 'confirmed') return 'occupied';
  if (assignment.rsvp_status === 'declined') return 'free';
  return 'pending'; // maybe, null, pending
}

export const SEAT_COLORS = {
  occupied: '#22c55e',
  pending:  '#f59e0b',
  free:     '#d1d5db',
};
