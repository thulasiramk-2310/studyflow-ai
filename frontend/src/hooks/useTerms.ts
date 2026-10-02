import { useAuth } from "./useAuth";
import { TERMS, type Terms } from "../constants/terms";
import { audienceOf, type Audience } from "../types";

/** Wording for the signed-in user's account type. */
export function useTerms(): Terms & { audience: Audience } {
  const { user } = useAuth();
  const audience = audienceOf(user?.accountType);
  return { ...TERMS[audience], audience };
}

/** Inside a group, wording follows the group's audience, not the viewer's. */
export function useGroupTerms(group?: { audience?: Audience | null } | null): Terms & { audience: Audience } {
  const mine = useTerms();
  const audience = group?.audience ?? mine.audience;
  return { ...TERMS[audience], audience };
}
