export interface GroupMember {
  user_id: number;
  role: "ORGANIZER" | "MEMBER";
  joined_at: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  members?: GroupMember[];
}

class GroupService {
  private getHeaders() {
    const token = localStorage.getItem("sf_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async getGroups(): Promise<Group[]> {
    const res = await fetch("/api/v1/groups/", {
      method: "GET",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch groups");
    }
    
    return json.data;
  }

  async getGroup(groupId: number): Promise<Group> {
    const res = await fetch(`/api/v1/groups/${groupId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch group");
    }
    
    return json.data;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const res = await fetch("/api/v1/groups/", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to create group");
    }
    
    return json.data;
  }

  async joinGroup(inviteCode: string): Promise<Group> {
    const res = await fetch("/api/v1/groups/join", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ inviteCode }),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to join group");
    }
    
    return json.data;
  }

  async generateStudyPlan(groupId: number): Promise<any> {
    const res = await fetch(`/api/v1/groups/${groupId}/schedule-agent`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || json.detail || "Failed to generate study plan");
    }
    
    return json.data;
  }


  async leaveGroup(groupId: number): Promise<void> {
    const res = await fetch(`/api/v1/groups/${groupId}/leave`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to leave group");
    }
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    const res = await fetch(`/api/v1/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to remove member");
    }
  }

  async regenerateInviteCode(groupId: number): Promise<string> {
    const res = await fetch(`/api/v1/groups/${groupId}/invite-code`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to regenerate invite code");
    }
    
    return json.data.invite_code;
  }
}

export const groupService = new GroupService();
