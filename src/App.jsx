import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Hub from './pages/Hub';
import Laundry from './pages/Laundry';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/laundry" element={<Laundry />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
