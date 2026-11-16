import Icon from "../common/Icon";

const toneIcon = { blue: "dashboard", green: "book", purple: "grammar", orange: "results" };
export default function StatisticCard({ label, value, unit, tone = "blue" }) {
  return (
    <article className={`dashboard-stat-card ${tone}`}>
      <div className="dashboard-stat-head">
        <span>{label}</span>
        <i>
          <Icon name={toneIcon[tone] || "dashboard"} size={17} />
        </i>
      </div>
      <strong>
        {value ?? 0}
        {unit && <small>{unit}</small>}
      </strong>
    </article>
  );
}
