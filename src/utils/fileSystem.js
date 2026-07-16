// File system API utility - connects to backend server

const API_BASE = '/api/files';

export const fs = {
  async readFile(filePath) {
    // Ensure path starts with /
    const path = filePath.startsWith('/') ? filePath : '/' + filePath;
    const res = await fetch(`${API_BASE}/read?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to read file: ${path}`);
    }
    const data = await res.json();
    return data.content;
  },
  
  async writeFile(filePath, content) {
    // Ensure path starts with /
    const path = filePath.startsWith('/') ? filePath : '/' + filePath;
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

  async createFolder(filePath) {
    // Ensure path starts with /
    const path = filePath.startsWith('/') ? filePath : '/' + filePath;
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
  
  async deleteFile(filePath) {
    // Ensure path starts with /
    const path = filePath.startsWith('/') ? filePath : '/' + filePath;
    const res = await fetch(`${API_BASE}/delete?path=${encodeURIComponent(path)}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Failed to delete file/folder: ${path}`);
    }
  },

  async uploadFile(file, destination = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (destination) {
      formData.append('destination', destination.startsWith('/') ? destination : '/' + destination);
    }
    
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }
    
    return await res.json();
  },

  async checkConnection() {
    try {
      const res = await fetch(API_BASE);
      return res.ok;
    } catch (e) {
      return false;
    }
  }
};
