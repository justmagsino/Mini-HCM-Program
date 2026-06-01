/** Match server defaults in server/.env (LATE_ALERT_MINUTES, UNDERTIME_ALERT_MINUTES). */
export const LATE_ALERT_MINUTES = Number(import.meta.env.VITE_LATE_ALERT_MINUTES) || 15;
export const UNDERTIME_ALERT_MINUTES = Number(import.meta.env.VITE_UNDERTIME_ALERT_MINUTES) || 30;
