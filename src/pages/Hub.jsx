import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const APPS = [
  { to: '/laundry', name: 'Laundry', description: 'Count clothes per bulk before the laundromat run', icon: 'basket' },
  { to: '/workout', name: 'Workout', description: 'Log sets against the dumbbell plan and read the trend', icon: 'dumbbell' },
  { to: '/bills', name: 'Bills', description: 'Track recurring bills and see what is due', icon: 'receipt' },
];

export default function Hub() {
  return (
    <div className="screen">
      <header className="app-bar">
        <div>
          <h1>home.exe</h1>
          <p className="muted">Mini apps for the house</p>
        </div>
      </header>

      <main className="scroll">
        <div className="hub-grid">
          {APPS.map((app) => (
            <Link key={app.to} to={app.to} className="hub-card">
              <span className="hub-icon">
                <Icon name={app.icon} size={24} />
              </span>
              <strong>{app.name}</strong>
              <span className="muted">{app.description}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
