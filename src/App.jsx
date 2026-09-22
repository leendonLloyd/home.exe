import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Bills from './pages/Bills';
import Hub from './pages/Hub';
import Laundry from './pages/Laundry';
import Payments from './pages/Payments';
import Todo from './pages/Todo';
import LaundryCheck from './pages/LaundryCheck';
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
        <Route path="/laundry/check/:sessionId" element={<LaundryCheck />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/workout/log" element={<WorkoutLog />} />
        <Route path="/workout/notes" element={<WorkoutNotes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
