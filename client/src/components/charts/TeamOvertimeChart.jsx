import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * @param {{ data: Array<{ date: string; label: string; overtime: number }> }} props
 */
export function TeamOvertimeChart({ data }) {
  return (
    <section className="card" aria-labelledby="team-ot-chart-title">
      <div className="card-body">
      <h2 id="team-ot-chart-title" className="section-title mb-4">
        Team overtime (this week)
      </h2>
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="h" />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}h`, 'Overtime']} />
            <Bar dataKey="overtime" name="Overtime" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </section>
  );
}
