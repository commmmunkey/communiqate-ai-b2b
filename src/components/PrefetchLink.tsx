import { Link, type LinkProps } from "react-router";

// Map routes that should be prefetched
const prefetchRoutes: Record<string, () => Promise<unknown>> = {
  "/ai-interview": () => import("@/pages/AIInterview"),
  "/assessment": () => import("@/pages/Assessment"),
};

interface PrefetchLinkProps extends LinkProps {
  to: string;
  children: React.ReactNode;
}

export default function PrefetchLink({
  to,
  children,
  ...props
}: PrefetchLinkProps) {
  const handleMouseEnter = () => {
    const preload = prefetchRoutes[to];
    if (preload) preload();
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}
