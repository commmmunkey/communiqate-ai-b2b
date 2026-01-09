import { Navigate, Route, Routes } from "react-router";
import { lazy, Suspense, useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./layouts/ErrorBoundary";
import PublicGuard from "./layouts/PublicGuard";
import Loading from "./components/Loading";
import "./index.css";

// Lazy load routes
const Login = lazy(() => import("./features/auth/login"));
const ProtectedLayout = lazy(() => import("./layouts/ProtectedLayout"));

const AIInterview = lazy(() => import("./pages/AIInterview"));

const Assessment = lazy(() => import("./pages/Assessment"));
const AssessmentWritingModule = lazy(
  () => import("./features/assessment/AssessmentWritingModule"),
);
const AssessmentSpeakingModule = lazy(
  () => import("./features/assessment/AssessmentSpeakingModule"),
);
const AssessmentWritingResult = lazy(
  () => import("./features/assessment/AssessmentWritingResult"),
);
const AssessmentSpeakingResult = lazy(
  () => import("./features/assessment/AssessmentSpeakingResult"),
);
const NewHome = lazy(() => import("./pages/NewHome"));
const LUTest = lazy(() => import("./pages/LUTest"));
const LUResult = lazy(() => import("./pages/LUResult"));
const ViewResult = lazy(() => import("./pages/ViewResult"));
const WritingModule = lazy(() => import("./pages/WritingModule"));
const SpeakingModule = lazy(() => import("./pages/SpeakingModule"));
const WritingResult = lazy(() => import("./pages/WritingResult"));
const SpeakingResult = lazy(() => import("./pages/SpeakingResult"));
const ExamList = lazy(() => import("./pages/ExamList"));

function App() {
  const [token, setToken] = useState(localStorage.getItem("TOKEN_ID"));

  // Listen for auth changes (e.g., from logout)
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem("TOKEN_ID"));
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const updateAuth = () => {
    setToken(localStorage.getItem("TOKEN_ID"));
    // Dispatch event for consistency (in case other components need to know)
    window.dispatchEvent(new Event("auth-change"));
  };

  const isAuthenticated = !!token;

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Wrap the Login route with the PublicGuard */}
          <Route
            path="/login"
            element={
              <PublicGuard isAuthenticated={isAuthenticated}>
                <Login onAuthChange={updateAuth} />
              </PublicGuard>
            }
          />

          {/* Protected Routes (Only accessible if logged in) */}
          <Route
            element={<ProtectedLayout isAuthenticated={isAuthenticated} />}
          >
            <Route path="/" element={<NewHome />} />
            <Route path="/ai-interview" element={<AIInterview />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route
              path="/assessment/writing"
              element={<AssessmentWritingModule />}
            />
            <Route
              path="/assessment/speaking"
              element={<AssessmentSpeakingModule />}
            />
            <Route
              path="/assessment/writing-result"
              element={<AssessmentWritingResult />}
            />
            <Route
              path="/assessment/speaking-result"
              element={<AssessmentSpeakingResult />}
            />
            <Route path="/test" element={<LUTest />} />
            <Route path="/result" element={<LUResult />} />
            <Route path="/answers" element={<ViewResult />} />
            <Route path="/writing" element={<WritingModule />} />
            <Route path="/SpeakingModule" element={<SpeakingModule />} />
            <Route path="/WritingResult" element={<WritingResult />} />
            <Route path="/SpeakingResult" element={<SpeakingResult />} />
            <Route path="/examList" element={<ExamList />} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ErrorBoundary>
  );
}

export default App;
