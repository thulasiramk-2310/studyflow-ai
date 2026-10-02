const KEY = "sf_intro_seen";
let seenThisLoad = false;

/** True once the visitor has finished or skipped the intro. Survives blocked storage for the current page load. */
export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(KEY) === "1" || seenThisLoad;
  } catch {
    return seenThisLoad;
  }
}

export function markIntroSeen(): void {
  seenThisLoad = true;
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked: remembered for this page load only */
  }
}
