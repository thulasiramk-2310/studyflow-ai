import { Routes, Route } from "react-router-dom";

// Layouts
import { AuthLayout } from "../layouts/AuthLayout";
import { AppLayout } from "../layouts/AppLayout";

// Guards
import { ProtectedRoute } from "./ProtectedRoute";

// Auth & Public Pages
import { Landing } from "../pages/public/Landing";
import { Login } from "../pages/auth/Login";
import { SignUp } from "../pages/auth/SignUp";

// App Pages
import { Dashboard }      from "../pages/app/Dashboard";
import { Groups }         from "../pages/app/Groups";
import { GroupWorkspace } from "../pages/app/GroupWorkspace";
import { Resources }      from "../pages/app/Resources";
import { Sessions }       from "../pages/app/Sessions";
import { SessionDetails } from "../pages/app/SessionDetails";
import { Quiz }           from "../pages/app/Quiz";
import { AIAssistant }    from "../pages/app/AIAssistant";
import { Notifications }  from "../pages/app/Notifications";
import { Profile }        from "../pages/app/Profile";
import { Settings }       from "../pages/app/Settings";

// Error Pages
import { NotFound, Forbidden, ServerError } from "../pages/errors/ErrorPages";

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Public / Auth ── */}
      <Route path="/" element={<Landing />} />
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<SignUp />} />
      </Route>

      {/* ── Error pages (standalone, no app shell) ── */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="/500" element={<ServerError />} />

      {/* ── Protected app routes ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/groups"                 element={<Groups />} />
          <Route path="/groups/:groupId"        element={<GroupWorkspace />} />
          <Route path="/resources"              element={<Resources />} />
          <Route path="/sessions"               element={<Sessions />} />
          <Route path="/sessions/:sessionId"    element={<SessionDetails />} />
          <Route path="/sessions/:sessionId/quiz" element={<Quiz />} />
          <Route path="/ai"                     element={<AIAssistant />} />
          <Route path="/notifications"          element={<Notifications />} />
          <Route path="/profile"               element={<Profile />} />
          <Route path="/settings"              element={<Settings />} />
        </Route>
      </Route>

      {/* ── 404 catch-all ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
