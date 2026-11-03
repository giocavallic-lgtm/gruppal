import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import GroupDetail from './pages/GroupDetail';
import PlanDetail from './pages/PlanDetail';
import Bets from './pages/Bets';
import BetDetail from './pages/BetDetail';
import Profile from './pages/Profile';

export default function App() {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/plans/:id" element={<PlanDetail />} />
        <Route path="/groups/:id/bets" element={<Bets />} />
        <Route path="/bets/:id" element={<BetDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}