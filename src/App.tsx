import { Navigate, Route, Routes } from "react-router";
import { lazy, Suspense, useState } from "react";
import ErrorBoundary from './layouts/ErrorBoundary';
import PublicGuard from './layouts/PublicGuard';
import Loading from './components/Loading';
import './index.css';

// Lazy load routes
const Login = lazy(() => import("./features/auth/login"));
const ProtectedLayout = lazy(() => import('./layouts/ProtectedLayout'));
const AIInterview = lazy(() => import("./pages/AIInterview"));

function App() {
  const [token, setToken] = useState(localStorage.getItem('TOKEN_ID'));

  const updateAuth = () => {
    setToken(localStorage.getItem('TOKEN_ID'));
  };

  const isAuthenticated = !!token;

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Wrap the Login route with the PublicGuard */}
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
      </Suspense>
    </ErrorBoundary>
  )
}

export default App