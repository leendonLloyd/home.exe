import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Bills from './pages/Bills';
import Hub from './pages/Hub';
import Laundry from './pages/Laundry';
import LaundrySummary from './pages/LaundrySummary';
import Workout from './pages/Workout';
import WorkoutLog from './pages/WorkoutLog';
import WorkoutNotes from './pages/WorkoutNotes';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/laundry" element={<Laundry />} />
        <Route path="/laundry/summary" element={<LaundrySummary />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/workout/log" element={<WorkoutLog />} />
        <Route path="/workout/notes" element={<WorkoutNotes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
