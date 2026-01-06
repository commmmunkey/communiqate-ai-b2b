import { Navigate, Route, Routes } from "react-router";
import Login from "./features/auth/login"
import ProtectedLayout from './ProtectedLayout';
import { useState, type ReactNode } from "react";
import SpeechToText from "./pages/SpeechToText";
import CertificateInstructions from "./pages/CertificateInstructions";
import AssessmentCompletion from "./pages/AssessmentCompletion";
import Chat from "./pages/Chat";
import KnowledgeHub from "./pages/KnowledgeHub";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import Share from "./pages/Share";
import MoreInfo from "./pages/MoreInfo";
import AIAssistant from "./pages/AIAssistant";


// 1. Create a Guard that redirects LOGGED IN users away from public pages
const PublicGuard = ({ isAuthenticated, children }: {
  children: ReactNode;
}) => {


  if (isAuthenticated) {
    // If logged in, redirect to root (which then redirects to /dashboard)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

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
        <Route path="/speech-to-text" element={<SpeechToText />} />
        <Route path="/profile" element={<>profile</>} />
        <Route path="/certificateInstructions" element={<CertificateInstructions />} />
        <Route path="/assessmentCompletion" element={<AssessmentCompletion />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/knowledgeHub" element={<KnowledgeHub />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/share" element={<Share />} />
        <Route path="/moreinfo" element={<MoreInfo />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App