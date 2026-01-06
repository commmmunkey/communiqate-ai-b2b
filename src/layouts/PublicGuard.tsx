import { Navigate } from "react-router";
import { type ReactNode } from "react";

interface PublicGuardProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

// Guard that redirects logged in users away from public pages
export default function PublicGuard({ isAuthenticated, children }: PublicGuardProps) {
  // If logged in, redirect to root (which then redirects to /dashboard)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

