import type { Audience } from "../types";

/** User-facing nouns. Students and professionals see the same product in their own words. */
export interface Terms {
  group: string; groups: string; groupLower: string; groupsLower: string;
  session: string; sessions: string; sessionLower: string; sessionsLower: string;
  learningPath: string; topic: string; quiz: string; quizzes: string;
  flashcards: string; library: string; organizer: string; member: string;
  planNext: string; sessionNotes: string; minutes: string; uploadNotes: string; notesUploaded: string; newGroup: string; joinGroup: string; newSession: string; createGroup: string;
  emptyGroupsTitle: string; emptyGroupsBody: string; askPlaceholder: string; groupNameExample: string;
}

export const TERMS: Record<Audience, Terms> = {
  student: {
    group: "Study group", groups: "Groups", groupLower: "study group", groupsLower: "groups",
    session: "Session", sessions: "Sessions", sessionLower: "session", sessionsLower: "sessions",
    learningPath: "Learning path", topic: "Topic", quiz: "Quiz", quizzes: "Quizzes",
    flashcards: "Flashcards", library: "Library", organizer: "Organizer", member: "Member",
    planNext: "Plan next session", sessionNotes: "Session notes", minutes: "Session summary",
    uploadNotes: "Upload notes", notesUploaded: "Notes uploaded", newGroup: "New group", joinGroup: "Join group", createGroup: "Create group", newSession: "New session",
    emptyGroupsTitle: "You're not in a study group yet",
    emptyGroupsBody: "Groups hold your notes, sessions and AI chats. Invite classmates with a code.",
    askPlaceholder: "Ask about your study materials…",
    groupNameExample: "e.g. Advanced Calculus Study Group",
  },
  professional: {
    group: "Team", groups: "Teams", groupLower: "team", groupsLower: "teams",
    session: "Meeting", sessions: "Meetings", sessionLower: "meeting", sessionsLower: "meetings",
    learningPath: "Roadmap", topic: "Milestone", quiz: "Knowledge check", quizzes: "Knowledge checks",
    flashcards: "Key-point cards", library: "Documents", organizer: "Owner", member: "Member",
    planNext: "Plan next meeting", sessionNotes: "Meeting transcript", minutes: "Minutes of meeting",
    uploadNotes: "Upload documents", notesUploaded: "Documents uploaded", newGroup: "New team", joinGroup: "Join team", createGroup: "Create team", newSession: "New meeting",
    emptyGroupsTitle: "You're not in a team yet",
    emptyGroupsBody: "Teams hold your documents, meetings and AI chats. Invite colleagues with a code.",
    askPlaceholder: "Ask about your team's documents…",
    groupNameExample: "e.g. Platform Team",
  },
};
