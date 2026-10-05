import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Hub from './pages/Hub';
import Payments from './pages/Payments';
import Todo from './pages/Todo';
import Workout from './pages/Workout';
import WorkoutLog from './pages/WorkoutLog';
import WorkoutNotes from './pages/WorkoutNotes';

// Laundry is the only part that talks to Firestore, and the SDK is roughly
// twice the weight of everything else here put together. Loading it on demand
// keeps the hub and the other apps as light as they were before.
const Bills = lazy(() => import('./pages/Bills'));
const CloudGate = lazy(() => import('./components/CloudGate'));
const Grocery = lazy(() => import('./pages/Grocery'));
const Laundry = lazy(() => import('./pages/Laundry'));
const LaundryCheck = lazy(() => import('./pages/LaundryCheck'));
const LaundrySummary = lazy(() => import('./pages/LaundrySummary'));

const loading = (
  <div className="screen">
    <main className="scroll">
      <p className="empty">Loading…</p>
    </main>
  </div>
);

const cloud = (title, element) => (
  <Suspense fallback={loading}>
    <CloudGate title={title}>{element}</CloudGate>
  </Suspense>
);

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/laundry" element={cloud('Laundry', <Laundry />)} />
        <Route path="/laundry/summary" element={cloud('Laundry', <LaundrySummary />)} />
        <Route path="/laundry/check/:sessionId" element={cloud('Laundry', <LaundryCheck />)} />
        <Route path="/bills" element={cloud('Bills', <Bills />)} />
        <Route path="/grocery" element={cloud('Groceries', <Grocery />)} />
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
