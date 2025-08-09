// Cloud-based Store Text Tool - Cross-device access like ProtectedText.com
class CloudStoreText {
  constructor() {
    this.currentSite = null;
    this.isAuthenticated = false;
    this.saveTimeout = null;
    this.apiBase = 'https://linktoqr-nexus-api.vercel.app/api'; // Your backend API
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadFromURL();
    this.setupAutoSave();
  }

  setupEventListeners() {
    const siteNameInput = document.getElementById('site-name');
    const passwordInput = document.getElementById('password');
    const openSiteBtn = document.getElementById('open-site');
    const createSiteBtn = document.getElementById('create-site');
    const textEditor = document.getElementById('text-editor');
    const savingIndicator = document.getElementById('saving-indicator');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    
    // Site access events
    openSiteBtn.addEventListener('click', () => this.openSite());
    createSiteBtn.addEventListener('click', () => this.createSite());
    
    // Editor events
    textEditor.addEventListener('input', () => this.handleTextChange());
    textEditor.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Export/Import events
    exportBtn.addEventListener('click', () => this.exportText());
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => this.importText(e));
    
    // Enter key support for site access
    siteNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') passwordInput.focus();
    });
    
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.openSite();
    });
  }

  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const siteName = urlParams.get('site');
    
    if (siteName) {
      document.getElementById('site-name').value = siteName;
      document.getElementById('password').focus();
    }
  }

  async openSite() {
    const siteName = document.getElementById('site-name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!siteName || !password) {
      this.showError('Please enter both site name and password');
      return;
    }
    
    this.showLoading('Opening site...');
    
    try {
      const response = await this.makeRequest('POST', '/sites/open', {
        siteName: siteName,
        password: password
      });
      
      if (response.success) {
        this.currentSite = {
          name: siteName,
          password: password,
          token: response.token
        };
        
        this.isAuthenticated = true;
        this.showEditor();
        this.loadText(response.content || '');
        this.updateURL(siteName);
        this.showSuccess('Site opened successfully!');
      } else {
        this.showError(response.message || 'Failed to open site');
      }
    } catch (error) {
      console.error('Error opening site:', error);
      this.showError('Network error. Please check your connection.');
    }
    
    this.hideLoading();
  }

  async createSite() {
    const siteName = document.getElementById('site-name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!siteName || !password) {
      this.showError('Please enter both site name and password');
      return;
    }
    
    if (password.length < 6) {
      this.showError('Password must be at least 6 characters long');
      return;
    }
    
    this.showLoading('Creating site...');
    
    try {
      const response = await this.makeRequest('POST', '/sites/create', {
        siteName: siteName,
        password: password
      });
      
      if (response.success) {
        this.currentSite = {
          name: siteName,
          password: password,
          token: response.token
        };
        
        this.isAuthenticated = true;
        this.showEditor();
        this.loadText('');
        this.updateURL(siteName);
        this.showSuccess('Site created successfully!');
      } else {
        this.showError(response.message || 'Failed to create site');
      }
    } catch (error) {
      console.error('Error creating site:', error);
      this.showError('Network error. Please check your connection.');
    }
    
    this.hideLoading();
  }

  showEditor() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('editor-section').classList.remove('hidden');
    document.getElementById('current-site-name').textContent = this.currentSite.name;
  }

  loadText(content) {
    const textEditor = document.getElementById('text-editor');
    textEditor.value = content;
    this.updateWordCount();
  }

  handleTextChange() {
    if (!this.isAuthenticated) return;
    
    this.updateWordCount();
    this.showSavingIndicator();
    
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Auto-save after 2 seconds of inactivity
    this.saveTimeout = setTimeout(() => {
      this.saveText();
    }, 2000);
  }

  handleKeyDown(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.saveText();
    }
    
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      e.target.value = e.target.value.substring(0, start) + '\\t' + e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 1;
    }
  }

  async saveText() {
    if (!this.isAuthenticated) return;
    
    const content = document.getElementById('text-editor').value;
    
    try {
      const response = await this.makeRequest('POST', '/sites/save', {
        siteName: this.currentSite.name,
        token: this.currentSite.token,
        content: content
      });
      
      if (response.success) {
        this.hideSavingIndicator();
        this.showSavedIndicator();
      } else {
        this.showError('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving text:', error);
      this.showError('Network error while saving.');
    }
  }

  setupAutoSave() {
    // Save every 30 seconds if there are changes
    setInterval(() => {
      if (this.isAuthenticated) {
        this.saveText();
      }
    }, 30000);
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      if (this.isAuthenticated) {
        this.saveText();
      }
    });
  }

  updateWordCount() {
    const text = document.getElementById('text-editor').value;
    const wordCount = text.trim() ? text.trim().split(/\\s+/).length : 0;
    const charCount = text.length;
    
    document.getElementById('word-count').textContent = `${wordCount} words, ${charCount} characters`;
  }

  showSavingIndicator() {
    const indicator = document.getElementById('saving-indicator');
    indicator.textContent = 'Saving...';
    indicator.className = 'text-yellow-500';
  }

  hideSavingIndicator() {
    const indicator = document.getElementById('saving-indicator');
    indicator.textContent = '';
  }

  showSavedIndicator() {
    const indicator = document.getElementById('saving-indicator');
    indicator.textContent = 'Saved';
    indicator.className = 'text-green-500';
    
    setTimeout(() => {
      this.hideSavingIndicator();
    }, 2000);
  }

  updateURL(siteName) {
    const newURL = `${window.location.pathname}?site=${encodeURIComponent(siteName)}`;
    window.history.replaceState({}, '', newURL);
  }

  exportText() {
    const content = document.getElementById('text-editor').value;
    const siteName = this.currentSite.name;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteName}-export.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showSuccess('Text exported successfully!');
  }

  importText(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      document.getElementById('text-editor').value = content;
      this.handleTextChange();
      this.showSuccess('Text imported successfully!');
    };
    
    reader.readAsText(file);
  }

  async makeRequest(method, endpoint, data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(this.apiBase + endpoint, options);
    return await response.json();
  }

  showLoading(message) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = `
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
        <p>${message}</p>
      </div>
    `;
    loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new CloudStoreText();
});
