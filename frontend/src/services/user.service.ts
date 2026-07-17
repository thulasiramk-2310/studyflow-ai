import { apiClient } from "./api.client";

export interface UserProfileStats {
  name: string;
  email: string;
  joinedAt: string;
  groupsJoined: number;
  resourcesShared: number;
  sessionsHosted: number;
  aiConversations: number;
  aiQuestionsAsked: number;
}

export const userService = {
  getProfileStats: async (): Promise<UserProfileStats> => {
    return await apiClient.get<UserProfileStats>("/api/v1/users/profile");
  },

  getDashboardStats: async (): Promise<DashboardResponse> => {
    return await apiClient.get<DashboardResponse>("/api/v1/users/dashboard");
  },
};

export interface DashboardStats {
  groups: number;
  resources: number;
  sessions: number;
  conversations: number;
  quizzes: number;
  flashcards: number;
}

export interface RecentActivityItem {
  type: string;
  title: string;
  time: string;
}

export interface UpcomingSessionItem {
  id: number;
  title: string;
  group_name: string;
  scheduled_at: string;
}

export interface RecentResourceItem {
  id: number;
  title: string;
  group_name: string;
  time: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  upcoming_sessions: UpcomingSessionItem[];
  recent_resources: RecentResourceItem[];
  recent_activity: RecentActivityItem[];
}
