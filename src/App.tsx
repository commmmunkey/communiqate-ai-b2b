import { Navigate, Route, Routes } from "react-router";
import Login from "./features/auth/login"
import ProtectedLayout from './ProtectedLayout';
import { useState, type ReactNode } from "react";
import AIInterview from "./pages/AIInterview";
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('TOKEN_ID'));

  const updateAuth = () => {
    setToken(localStorage.getItem('TOKEN_ID'));
  };

  const isAuthenticated = !!token;

  return (
    <Routes>
      {/* 2. Wrap the Login route with the PublicGuard */}
      <Route path="/login" element={
        <PublicGuard isAuthenticated={isAuthenticated}>
          <Login onAuthChange={updateAuth} />
        </PublicGuard>
      } />

      {/* Protected Routes (Only accessible if logged in) */}
      <Route element={<ProtectedLayout isAuthenticated={isAuthenticated} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<>dashboard</>} />
        <Route path="/ai-interview" element={<AIInterview />} />
        <Route path="/profile" element={<>profile</>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App


// Guard that redirects logged in users away from public pages
const PublicGuard = ({ isAuthenticated, children }: {
  children: ReactNode;
  isAuthenticated: boolean;
}) => {

  // If logged in, redirect to root (which then redirects to /dashboard)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};