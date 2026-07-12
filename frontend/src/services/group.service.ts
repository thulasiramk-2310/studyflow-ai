export interface GroupMember {
  user_id: number;
  role: "ORGANIZER" | "MEMBER";
  joined_at: string;
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
    const res = await fetch("/groups/", {
      method: "GET",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch groups");
    }
    
    return json.data;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const res = await fetch("/groups/", {
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
    const res = await fetch("/groups/join", {
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
}

export const groupService = new GroupService();
