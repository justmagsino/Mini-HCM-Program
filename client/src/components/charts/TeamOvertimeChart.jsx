import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from './ChartContainer.jsx';

/**
 * @param {{ data: Array<{ date: string; label: string; overtime: number }> }} props
 */
export function TeamOvertimeChart({ data }) {
  return (
    <section className="card" aria-labelledby="team-ot-chart-title">
      <div className="card-body">
      <h2 id="team-ot-chart-title" className="section-title mb-4">
        Overtime (this week)
      </h2>
      <ChartContainer className="h-72 w-full min-w-0 sm:h-80">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0DCD0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}h`, 'Overtime']} />
          <Bar dataKey="overtime" name="Overtime" fill="#3E6D8E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
      </div>
    </section>
  );
}
