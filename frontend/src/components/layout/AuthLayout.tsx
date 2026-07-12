import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <Outlet />
    </div>
  );
}
