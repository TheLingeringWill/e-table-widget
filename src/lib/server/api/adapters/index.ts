// Server-only. DTO ↔ widget-state adapters.
// Responsibilities (PRD §6.2):
//   - Date/time normalization (REST 'YYYY-MM-DD' + 'HH:MM' ↔ widget Date in restaurant tz).
//   - Slot semantic-state derivation (closed/markedAsFull/pax math → AVAILABLE | ALMOST_FULL | FULL | CLOSED).
//   - Translation-array stripping (now a no-op — REST returns plain strings).
//   - Pax filtering for availabilities (REST has no pax filter; the widget filters client-side).

export * from './slot-state.js';
export * from './booking.js';
export * from './service.js';
