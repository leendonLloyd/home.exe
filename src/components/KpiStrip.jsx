const GROUPS = [
  { id: 'color', label: 'Color' },
  { id: 'owner', label: 'Owner' },
  { id: 'type', label: 'Type' },
];

export default function KpiStrip({ total, pieces, breakdowns }) {
  return (
    <section className="kpi">
      <div className="kpi-total">
        <div>
          <span className="kpi-total-value">{total}</span>
          <span className="kpi-total-label">pieces in bulk</span>
        </div>
        <div className="kpi-total-meta">
          <span>{pieces.types} types</span>
          <span>{pieces.owners} owners</span>
        </div>
      </div>

      <div className="kpi-panel">
        {GROUPS.map((group) => {
          const rows = breakdowns[group.id];
          return (
            <div className="kpi-col" key={group.id}>
              <span className="kpi-col-label">{group.label}</span>
              <div className="kpi-col-list">
                {rows.length === 0 ? (
                  <span className="kpi-empty">—</span>
                ) : (
                  rows.map((row) => (
                    <div className="kpi-row" key={row.key} style={{ '--tint': row.tint }}>
                      <span className="dot" />
                      <span className="kpi-row-label">{row.label}</span>
                      <span className="kpi-row-value">{row.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
