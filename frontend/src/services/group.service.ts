import { BASE_URL } from "./api.client";

export interface GroupMember {
  user_id: number;
  role: "ORGANIZER" | "MEMBER";
  joined_at: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface LearningPlanItem {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  parent_id: number | null;
  order_index: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  estimated_sessions: number | null;
  is_ai_generated: boolean;
  created_by: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  goal?: string | null;
  learning_plan?: LearningPlanItem[];
  invite_code: string;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  members?: GroupMember[];
}

class GroupService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  async getGroups(): Promise<Group[]> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch groups");
    }
    
    return json.data;
  }

  async getUpcomingSessions(groupId: number): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/sessions?upcoming=true&limit=3`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch upcoming sessions");
    }
    
    return json.data;
  }

  async getGroup(groupId: number): Promise<Group> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch group");
    }
    
    return json.data;
  }

  async createGroup(name: string, description?: string, goal?: string): Promise<Group> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ name, description, goal }),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to create group");
    }
    
    return json.data;
  }

  async joinGroup(inviteCode: string): Promise<Group> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/join`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ inviteCode }),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to join group");
    }
    
    return json.data;
  }

  async generateStudyPlan(groupId: number, targetDurationMinutes: number = 60): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/schedule-agent`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ target_duration_minutes: targetDurationMinutes })
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || json.detail || "Failed to generate study plan");
    }
    
    return json.data;
  }


  async leaveGroup(groupId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/leave`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to leave group");
    }
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to remove member");
    }
  }

  // --- Learning Plan Endpoints ---
  async addLearningPlanItem(groupId: number, data: { title: string, description?: string, estimated_sessions?: number }): Promise<LearningPlanItem> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/roadmap`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to add learning plan item");
    }
    return json.data;
  }

  async updateLearningPlanItem(groupId: number, itemId: number, data: { title?: string, description?: string, status?: string, estimated_sessions?: number }): Promise<LearningPlanItem> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/roadmap/${itemId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to update learning plan item");
    }
    return json.data;
  }

  async deleteLearningPlanItem(groupId: number, itemId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/roadmap/${itemId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to delete learning plan item");
    }
  }

  async reorderLearningPlanItems(groupId: number, items: { id: number, order: number }[]): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/roadmap/reorder`, {
      method: "PUT",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify(items),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to reorder learning plan items");
    }
  }

  async regenerateInviteCode(groupId: number): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${groupId}/invite-code`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to regenerate invite code");
    }
    
    return json.data.invite_code;
  }
}

export const groupService = new GroupService();
