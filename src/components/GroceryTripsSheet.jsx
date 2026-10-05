import { useState } from 'react';
import Sheet from './Sheet';

export default function GroceryTripsSheet({ open, trips, onClose, onDelete, onRepeat, onExport }) {
  const [openId, setOpenId] = useState(null);

  return (
    <Sheet
      open={open}
      title="Past shops"
      onClose={onClose}
      footer={
        <button type="button" className="btn block" onClick={onExport}>
          Export JSON
        </button>
      }
    >
      <ul className="stack-list">
        {trips.map((trip) => (
          <li key={trip.id} className="session">
            <button type="button" className="session-head" onClick={() => setOpenId(openId === trip.id ? null : trip.id)}>
              <span>
                <strong>{trip.date}</strong>
                {trip.note ? <span className="muted"> · {trip.note}</span> : null}
                {trip.picked < trip.total ? (
                  <span className="muted small"> · {trip.total - trip.picked} not picked up</span>
                ) : null}
              </span>
              <span className="badge">{trip.total}</span>
            </button>
            {openId === trip.id ? (
              <>
                <ul className="stack-list compact">
                  {trip.lines.map((line) => (
                    <li key={line.itemId}>
                      <span className={line.got ? '' : 'muted'}>
                        {line.name}
                        {line.got ? '' : ' · missed'}
                      </span>
                      <strong>{line.qty}</strong>
                    </li>
                  ))}
                </ul>
                <div className="row-form">
                  <button type="button" className="btn block" onClick={() => { onRepeat(trip); onClose(); }}>
                    Shop this again
                  </button>
                  <button type="button" className="btn danger block" onClick={() => onDelete(trip.id)}>
                    Delete
                  </button>
                </div>
              </>
            ) : null}
          </li>
        ))}
        {trips.length === 0 ? <li className="muted">No shops saved yet</li> : null}
      </ul>
    </Sheet>
  );
}
