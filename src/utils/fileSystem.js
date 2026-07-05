const API_BASE = '/api/files';

export const fs = {
  async readFile(path) {
    const res = await fetch(`${API_BASE}/read?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to read file: ${path}`);
    }
    const data = await res.json();
    return data.content;
  },
  
  async writeFile(path, content) {
    const res = await fetch(`${API_BASE}/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path, content })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to write file: ${path}`);
    }
  },

  async createFolder(path) {
    const res = await fetch(`${API_BASE}/mkdir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to create folder: ${path}`);
    }
  },
  
  async listFiles() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to list files');
    }
    const files = await res.json();
    return files;
  },
  
  async deleteFile(path) {
    const res = await fetch(`${API_BASE}/delete?path=${encodeURIComponent(path)}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to delete file/folder: ${path}`);
    }
  }
};
