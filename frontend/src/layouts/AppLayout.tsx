import { useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { SidebarProvider } from "../context/SidebarContext";
import { FloatingAI } from "../components/ai/FloatingAI";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.2, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.14, ease: "easeIn" as const } },
};

export function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden text-foreground font-[Inter,system-ui,sans-serif]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <FloatingAI />
      </div>
    </SidebarProvider>
  );
}

