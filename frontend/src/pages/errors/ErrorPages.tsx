import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  code: 403 | 404 | 500;
  title: string;
  description: string;
}

function ErrorPage({ code, title, description }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-20 h-20 rounded-3xl bg-primary-soft flex items-center justify-center mx-auto mb-6 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-primary opacity-70" />
        </div>
        <div className="text-[80px] font-extrabold tracking-tighter text-border leading-none">{code}</div>
        <h1 className="mt-2 text-[22px] font-extrabold text-foreground">{title}</h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/dashboard"
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-primary-hover transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-surface border border-border text-foreground rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-background transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return <ErrorPage code={404} title="Page not found" description="The page you're looking for doesn't exist or has been moved. Check the URL or head back to your dashboard." />;
}

export function Forbidden() {
  return <ErrorPage code={403} title="Access denied" description="You don't have permission to view this page. If you think this is a mistake, contact your group organizer." />;
}

export function ServerError() {
  return <ErrorPage code={500} title="Something went wrong" description="An unexpected error occurred on our end. We've been notified. Please try again in a moment." />;
}
