import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { IntroStage } from "./IntroStage";
import { hasSeenIntro, markIntroSeen } from "./introStorage";
import type { Audience } from "../../types";

/** Plays the intro on a logged-out visitor's first visit to "/", and whenever "sf:play-intro" fires. */
export function IntroExperience({ initialAudience = "student" }: { initialAudience?: Audience }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [audience, setAudience] = useState<Audience>(initialAudience);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasSeenIntro()) setPlaying(true);
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const replay = (e: Event) => {
      const detail = (e as CustomEvent<Audience | undefined>).detail;
      if (detail) setAudience(detail);
      setPlaying(true);
    };
    window.addEventListener("sf:play-intro", replay);
    return () => window.removeEventListener("sf:play-intro", replay);
  }, []);

  const done = useCallback(() => {
    markIntroSeen();
    setPlaying(false);
  }, []);

  return (
    <AnimatePresence>
      {playing && (
        <motion.div key="intro" className="fixed inset-0 z-[60]" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <IntroStage key={audience} audience={audience} onDone={done} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
