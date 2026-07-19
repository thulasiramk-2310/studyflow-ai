import { BASE_URL } from "./api.client";

export interface Resource {
  id: number;
  group_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  uploader_name?: string;
  created_at: string;
}

class ResourceService {
  private getHeaders() {
    return {};
  }

  async uploadResource(groupId: number, file: File): Promise<Resource> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("group_id", groupId.toString());

    const res = await fetch(`${BASE_URL}/api/v1/resources/upload`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: formData,
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to upload resource");
    }
    
    return json.data;
  }

  async getResources(groupId: number): Promise<Resource[]> {
    const res = await fetch(`${BASE_URL}/api/v1/resources/?group_id=${groupId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch resources");
    }
    
    return json.data;
  }

  async deleteResource(resourceId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/resources/${resourceId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to delete resource");
    }
  }

  async downloadResource(resourceId: number, filename: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/resources/${resourceId}/download-url`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch download URL");
    const json = await res.json();
    if (!json.success || !json.data?.url) throw new Error("Failed to get download URL");
    
    const url = json.data.url;
    
    const fetchOpts: RequestInit = {
      method: "GET"
    };
    if (url.startsWith("http") && !url.includes(window.location.hostname)) {
      fetchOpts.credentials = "omit"; 
    } else {
      fetchOpts.credentials = "include"; 
    }
    
    const downloadRes = await fetch(url, fetchOpts);
    if (!downloadRes.ok) throw new Error("Failed to download resource");
    
    const blob = await downloadRes.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIconType(mimeType: string | null, filename: string | null): string {
    const fn = filename || "";
    const mt = mimeType || "";
    if (fn.toLowerCase().endsWith('.pdf')) return 'PDF';
    if (fn.toLowerCase().endsWith('.docx')) return 'DOCX';
    if (fn.toLowerCase().endsWith('.pptx')) return 'PPTX';
    if (fn.toLowerCase().endsWith('.md')) return 'MD';
    if (mt.toLowerCase().includes('pdf')) return 'PDF';
    if (mt.toLowerCase().includes('word')) return 'DOCX';
    if (mt.toLowerCase().includes('presentation')) return 'PPTX';
    return 'FILE';
  }
}

export const resourceService = new ResourceService();
