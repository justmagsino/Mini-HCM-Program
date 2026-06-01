import { StatCard } from '../ui/StatCard.jsx';
import { formatHours, formatMinutes } from '../../utils/format.js';

/**
 * @param {{ totals?: object | null; title?: string }} props
 */
export function WeeklyAnalyticsCards({ totals, title }) {
  if (!totals) {
    return null;
  }

  return (
    <section>
      {title ? <h3 className="section-title mb-3 text-base">{title}</h3> : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Regular" value={formatHours(totals.totalRegularHours)} variant="accent" />
        <StatCard label="Overtime" value={formatHours(totals.totalOvertimeHours)} />
        <StatCard label="Night diff." value={formatHours(totals.totalNightDifferentialHours)} />
        <StatCard label="Late" value={formatMinutes(totals.totalLateMinutes)} />
        <StatCard label="Undertime" value={formatMinutes(totals.totalUndertimeMinutes)} />
      </div>
    </section>
  );
}
