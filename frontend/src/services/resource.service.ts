export interface Resource {
  id: number;
  group_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_path: string;
  created_at: string;
}

class ResourceService {
  private getHeaders() {
    const token = localStorage.getItem("sf_token");
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async uploadResource(groupId: number, file: File): Promise<Resource> {
    const formData = new FormData();
    formData.append("group_id", groupId.toString());
    formData.append("file", file);

    const res = await fetch("/resources/upload", {
      method: "POST",
      headers: this.getHeaders(),
      body: formData,
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to upload resource");
    }
    
    return json.data;
  }

  async getResources(groupId: number): Promise<Resource[]> {
    const res = await fetch(`/resources/?group_id=${groupId}`, {
      method: "GET",
      headers: { ...this.getHeaders(), "Content-Type": "application/json" },
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch resources");
    }
    
    return json.data;
  }

  async deleteResource(resourceId: number): Promise<void> {
    const res = await fetch(`/resources/${resourceId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to delete resource");
    }
  }

  getDownloadUrl(resourceId: number): string {
    return `/resources/download/${resourceId}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIconType(mimeType: string, filename: string): string {
    if (filename.endsWith('.pdf')) return 'PDF';
    if (filename.endsWith('.docx')) return 'DOCX';
    if (filename.endsWith('.pptx')) return 'PPTX';
    if (filename.endsWith('.md')) return 'MD';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'DOCX';
    if (mimeType.includes('presentation')) return 'PPTX';
    return 'FILE';
  }
}

export const resourceService = new ResourceService();
