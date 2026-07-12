import { Outlet, Link } from "react-router-dom";
import { Logo } from "../Icons";

export function LandingLayout() {
  return (
    <div className="min-h-screen bg-background overflow-auto flex flex-col">
      <div className="max-w-[1120px] mx-auto px-8 w-full flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center py-5">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-base tracking-tight text-foreground">
            <Logo className="w-5 h-5 text-primary" /> StudyFlow AI
          </Link>
          <div className="flex-1"></div>
          <div className="hidden md:flex items-center gap-6 text-[13.5px] font-semibold text-muted-foreground mr-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg border border-border text-[13px] font-semibold text-foreground hover:bg-surface transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20">
              Get started
            </Link>
          </div>
        </nav>
        
        {/* Page Content */}
        <main className="flex-1 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
