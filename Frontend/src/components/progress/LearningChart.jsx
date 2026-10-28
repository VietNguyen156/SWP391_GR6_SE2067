import { formatDate } from "../../utils/format";
function shortDate(value) {
  return formatDate(value).slice(0, 5);
}

export default function LearningChart({ data = [] }) {
  const recent = data.slice(-7);
  const maxMinutes = Math.max(1, ...recent.map((item) => item.learningMinutes));
  const width = 620,
    height = 180,
    padding = 22;
  const points = recent.map((item, index) => {
    const x =
      recent.length === 1
        ? width / 2
        : padding + index * ((width - padding * 2) / (recent.length - 1));
    const y = height - padding - (item.learningMinutes / maxMinutes) * (height - padding * 2);
    return { x, y, item };
  });
  return (
    <article className="learning-chart-card">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <span>7 ngày gần nhất</span>
          <h2>Thời gian học tập</h2>
        </div>
        <small>Phút / ngày</small>
      </div>
      <svg
        className="learning-line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Biểu đồ thời gian học 7 ngày"
      >
        {[0, 1, 2, 3].map((row) => (
          <line
            key={row}
            x1={padding}
            x2={width - padding}
            y1={padding + row * ((height - padding * 2) / 3)}
            y2={padding + row * ((height - padding * 2) / 3)}
          />
        ))}
        {points.length > 1 && (
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        )}
        {points.map((point) => (
          <g key={point.item.date}>
            <circle cx={point.x} cy={point.y} r="5" />
            <title>
              {shortDate(point.item.date)}: {point.item.learningMinutes} phút
            </title>
          </g>
        ))}
      </svg>
      <div className="learning-chart-labels">
        {recent.map((item) => (
          <span key={item.date}>{shortDate(item.date)}</span>
        ))}
      </div>
      <div className="learning-bar-chart">
        {recent.map((item) => (
          <div key={item.date}>
            <span
              className="bar lessons"
              style={{ height: `${Math.max(3, item.lessonsCompleted * 18)}px` }}
              title={`${item.lessonsCompleted} bài học`}
            />
            <span
              className="bar tests"
              style={{ height: `${Math.max(3, item.testCompleted * 18)}px` }}
              title={`${item.testCompleted} Test`}
            />
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span>
          <i className="lessons" /> Bài học
        </span>
        <span>
          <i className="tests" /> Test
        </span>
      </div>
    </article>
  );
}
