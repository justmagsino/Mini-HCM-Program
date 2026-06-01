import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from './ChartContainer.jsx';

/**
 * @param {{ days: Array<{ date: string; totalRegularHours?: number; totalOvertimeHours?: number }> }} props
 */
export function WeeklyHoursChart({ days }) {
  const data = days.map((day) => {
    const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
    });
    return {
      name: label,
      regular: day.totalRegularHours ?? 0,
      overtime: day.totalOvertimeHours ?? 0,
    };
  });

  return (
    <section className="card" aria-labelledby="weekly-hours-chart-title">
      <div className="card-body">
      <h2 id="weekly-hours-chart-title" className="section-title mb-4">
        Weekly hours
      </h2>
      <ChartContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0DCD0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}h`, '']} />
          <Legend />
          <Bar dataKey="regular" name="Regular" fill="#1A365D" radius={[4, 4, 0, 0]} />
          <Bar dataKey="overtime" name="Overtime" fill="#3E6D8E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
      </div>
    </section>
  );
}
