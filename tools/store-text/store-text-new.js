/**
 * ProtectedText.com Enhanced - Secure Text Storage System
 * Features: Site/ID based notes, Multi-window support, Password protection, Auto-save
 */

class ProtectedTextApp {
    constructor() {
        this.currentSite = null;
        this.currentWindow = 1;
        this.windows = { 1: { content: '', title: 'Window 1' } };
        this.autoSaveInterval = null;
        this.isAutoSaveEnabled = true;
        this.unsavedChanges = false;
        this.isPasswordVisible = false;
        this.sitePasswords = {}; // Store encrypted passwords for sites
        
        this.initializeApp();
        this.bindEvents();
        this.startAutoSave();
        this.loadRecentSites();
        this.updateCharCount();
    }

    initializeApp() {
        // Load saved settings
        const autoSaveEnabled = localStorage.getItem('protectedtext-autosave');
        if (autoSaveEnabled !== null) {
            this.isAutoSaveEnabled = JSON.parse(autoSaveEnabled);
            document.getElementById('auto-save-toggle').checked = this.isAutoSaveEnabled;
        }

        // Initialize window tabs
        this.updateWindowTabs();
        this.loadWindowContent();
        
        // Set initial placeholder
        this.updateStatus();
    }

    bindEvents() {
        // Site navigation
        document.getElementById('site-url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.goToSite();
        });

        document.getElementById('go-to-site-btn').addEventListener('click', () => {
            this.goToSite();
        });

        document.getElementById('add-site-btn').addEventListener('click', () => {
            this.addNewSite();
        });

        document.getElementById('random-site-btn').addEventListener('click', () => {
            this.goToRandomSite();
        });

        document.getElementById('bookmark-site-btn').addEventListener('click', () => {
            this.bookmarkCurrentSite();
        });

        // Password controls
        document.getElementById('password-enabled').addEventListener('change', (e) => {
            this.togglePasswordProtection(e.target.checked);
        });

        document.getElementById('toggle-password-btn').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        document.getElementById('set-password-btn').addEventListener('click', () => {
            this.setPassword();
        });

        document.getElementById('change-password-btn').addEventListener('click', () => {
            this.changePassword();
        });

        // Window management
        document.getElementById('add-window-btn').addEventListener('click', () => {
            this.addWindow();
        });

        document.getElementById('new-window-btn').addEventListener('click', () => {
            this.openInNewTab();
        });

        // Text editor
        document.getElementById('main-textarea').addEventListener('input', () => {
            this.onContentChange();
        });

        // Site management
        document.getElementById('clear-site-btn').addEventListener('click', () => {
            this.clearCurrentSite();
        });

        document.getElementById('export-site-btn').addEventListener('click', () => {
            this.exportCurrentSite();
        });

        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('close-settings-modal').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('import-all-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Password modal
        document.getElementById('close-password-modal').addEventListener('click', () => {
            this.hidePasswordModal();
        });

        document.getElementById('unlock-note-btn').addEventListener('click', () => {
            this.unlockSite();
        });

        document.getElementById('cancel-unlock-btn').addEventListener('click', () => {
            this.hidePasswordModal();
        });

        document.getElementById('unlock-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.unlockSite();
        });

        // File import
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Auto-save toggle
        document.getElementById('auto-save-toggle').addEventListener('change', (e) => {
            this.toggleAutoSave(e.target.checked);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges && this.currentSite) {
                this.saveCurrentSite();
            }
        });
    }

    // Site Management
    goToSite() {
        const siteId = document.getElementById('site-url').value.trim();
        if (!siteId) {
            this.showNotification('Please enter a site ID', 'error');
            return;
        }

        // Save current site before switching
        if (this.currentSite && this.unsavedChanges) {
            this.saveCurrentSite();
        }

        this.currentSite = siteId;
        this.loadSiteData(siteId);
        this.addToRecentSites(siteId);
        this.updateStatus();
        this.updateCurrentSiteDisplay();
        
        // Check if site is password protected
        const siteData = this.getSiteData(siteId);
        if (siteData && siteData.isPasswordProtected && !this.sitePasswords[siteId]) {
            this.showPasswordModal();
            return;
        }

        this.showNotification('Loaded site: ' + siteId, 'success');
    }

    addNewSite() {
        const siteName = prompt('Enter new site ID:', 'site-' + Date.now());
        if (siteName && siteName.trim()) {
            document.getElementById('site-url').value = siteName.trim();
            this.goToSite();
        }
    }

    goToRandomSite() {
        const randomSites = [
            'random-thoughts', 'daily-notes', 'project-ideas', 'personal-diary',
            'work-notes', 'todo-list', 'creative-writing', 'study-notes',
            'meeting-notes', 'brainstorm', 'quick-notes', 'drafts'
        ];
        const randomSite = randomSites[Math.floor(Math.random() * randomSites.length)] + '-' + Date.now().toString().slice(-4);
        document.getElementById('site-url').value = randomSite;
        this.goToSite();
    }

    loadSiteData(siteId) {
        const siteData = this.getSiteData(siteId);
        
        if (siteData) {
            // Load windows data
            this.windows = siteData.windows || { 1: { content: '', title: 'Window 1' } };
            this.currentWindow = siteData.currentWindow || 1;
            
            // Ensure current window exists
            if (!this.windows[this.currentWindow]) {
                this.currentWindow = 1;
                this.windows[1] = { content: '', title: 'Window 1' };
            }
        } else {
            // Initialize new site
            this.windows = { 1: { content: '', title: 'Window 1' } };
            this.currentWindow = 1;
        }

        this.updateWindowTabs();
        this.loadWindowContent();
        this.updatePasswordStatus();
        this.unsavedChanges = false;
    }

    getSiteData(siteId) {
        const data = localStorage.getItem('protectedtext-site-' + siteId);
        return data ? JSON.parse(data) : null;
    }

    saveCurrentSite() {
        if (!this.currentSite) return;

        // Save current window content
        const textarea = document.getElementById('main-textarea');
        this.windows[this.currentWindow].content = textarea.value;

        const siteData = {
            windows: this.windows,
            currentWindow: this.currentWindow,
            lastModified: new Date().toISOString(),
            isPasswordProtected: document.getElementById('password-enabled').checked,
            password: this.getSitePassword()
        };

        // Encrypt if password protected
        if (siteData.isPasswordProtected && siteData.password) {
            siteData.windows = this.encryptData(JSON.stringify(this.windows), siteData.password);
        }

        localStorage.setItem('protectedtext-site-' + this.currentSite, JSON.stringify(siteData));
        this.unsavedChanges = false;
        this.updateStatus();
        this.showAutoSaveIndicator();
    }

    // Window Management
    addWindow() {
        const windowKeys = Object.keys(this.windows).map(Number);
        const nextWindowId = Math.max(...windowKeys) + 1;
        
        this.windows[nextWindowId] = {
            content: '',
            title: 'Window ' + nextWindowId
        };

        this.updateWindowTabs();
        this.switchToWindow(nextWindowId);
    }

    switchToWindow(windowId) {
        // Save current window content
        if (this.currentWindow && this.windows[this.currentWindow]) {
            this.windows[this.currentWindow].content = document.getElementById('main-textarea').value;
        }

        this.currentWindow = windowId;
        this.loadWindowContent();
        this.updateWindowTabs();
        
        if (this.currentSite) {
            this.unsavedChanges = true;
            this.updateStatus();
        }
    }

    closeWindow(windowId) {
        if (Object.keys(this.windows).length <= 1) {
            this.showNotification('Cannot close the last window', 'error');
            return;
        }

        delete this.windows[windowId];

        // Switch to another window if current was closed
        if (this.currentWindow === windowId) {
            const remainingWindows = Object.keys(this.windows).map(Number);
            this.currentWindow = Math.min(...remainingWindows);
        }

        this.updateWindowTabs();
        this.loadWindowContent();
        
        if (this.currentSite) {
            this.unsavedChanges = true;
            this.updateStatus();
        }
    }

    updateWindowTabs() {
        const tabsContainer = document.getElementById('window-tabs');
        tabsContainer.innerHTML = '';

        Object.keys(this.windows).forEach(windowId => {
            const tab = document.createElement('div');
            tab.className = 'window-tab ' + (windowId == this.currentWindow ? 'active' : '');
            tab.style.cssText = 
                'background: ' + (windowId == this.currentWindow ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)') + ';' +
                'border: 1px solid ' + (windowId == this.currentWindow ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.1)') + ';' +
                'border-radius: 8px;' +
                'padding: 8px 16px;' +
                'cursor: pointer;' +
                'display: flex;' +
                'align-items: center;' +
                'color: white;' +
                'font-size: 14px;' +
                'transition: all 0.3s ease;';
            
            const closeBtn = Object.keys(this.windows).length > 1 ? 
                '<button class="ml-2 text-red-400 hover:text-red-300" onclick="app.closeWindow(' + windowId + ')">×</button>' : '';
            
            tab.innerHTML = 
                '<span onclick="app.switchToWindow(' + windowId + ')">' + this.windows[windowId].title + '</span>' +
                closeBtn;
            
            tabsContainer.appendChild(tab);
        });
    }

    loadWindowContent() {
        const textarea = document.getElementById('main-textarea');
        if (this.windows[this.currentWindow]) {
            textarea.value = this.windows[this.currentWindow].content || '';
            this.updateCharCount();
        }
    }

    openInNewTab() {
        if (this.currentSite) {
            const url = window.location.origin + window.location.pathname + '?site=' + encodeURIComponent(this.currentSite);
            window.open(url, '_blank');
        } else {
            window.open(window.location.href, '_blank');
        }
    }

    // Password Management
    togglePasswordProtection(enabled) {
        const passwordControls = document.getElementById('password-controls');
        const passwordStatus = document.getElementById('password-status');
        
        if (enabled) {
            passwordControls.classList.remove('hidden');
            if (this.currentSite && this.getSitePassword()) {
                passwordStatus.classList.remove('hidden');
            }
        } else {
            passwordControls.classList.add('hidden');
            passwordStatus.classList.add('hidden');
            
            // Remove password protection
            if (this.currentSite) {
                delete this.sitePasswords[this.currentSite];
                this.unsavedChanges = true;
            }
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('site-password');
        const toggleBtn = document.getElementById('toggle-password-btn');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    setPassword() {
        const password = document.getElementById('site-password').value;
        if (!password) {
            this.showNotification('Please enter a password', 'error');
            return;
        }

        if (!this.currentSite) {
            this.showNotification('Please load a site first', 'error');
            return;
        }

        this.sitePasswords[this.currentSite] = password;
        document.getElementById('password-status').classList.remove('hidden');
        document.getElementById('site-password').value = '';
        this.unsavedChanges = true;
        this.updateStatus();
        
        this.showNotification('Password protection enabled', 'success');
    }

    changePassword() {
        const newPassword = prompt('Enter new password for this site:');
        if (newPassword) {
            this.sitePasswords[this.currentSite] = newPassword;
            this.unsavedChanges = true;
            this.updateStatus();
            this.showNotification('Password changed successfully', 'success');
        }
    }

    getSitePassword() {
        return this.sitePasswords[this.currentSite] || null;
    }

    showPasswordModal() {
        document.getElementById('password-modal').classList.add('active');
        document.getElementById('unlock-password').focus();
    }

    hidePasswordModal() {
        document.getElementById('password-modal').classList.remove('active');
        document.getElementById('unlock-password').value = '';
    }

    unlockSite() {
        const password = document.getElementById('unlock-password').value;
        const siteData = this.getSiteData(this.currentSite);
        
        if (siteData && siteData.password === password) {
            this.sitePasswords[this.currentSite] = password;
            this.hidePasswordModal();
            
            // Decrypt and load site data
            try {
                const decryptedWindows = this.decryptData(siteData.windows, password);
                this.windows = JSON.parse(decryptedWindows);
                this.currentWindow = siteData.currentWindow || 1;
                this.updateWindowTabs();
                this.loadWindowContent();
                this.updatePasswordStatus();
                
                this.showNotification('Site unlocked: ' + this.currentSite, 'success');
            } catch (e) {
                this.showNotification('Failed to decrypt site data', 'error');
            }
        } else {
            this.showNotification('Incorrect password', 'error');
            document.getElementById('unlock-password').focus();
        }
    }

    updatePasswordStatus() {
        const siteData = this.getSiteData(this.currentSite);
        const isProtected = siteData && siteData.isPasswordProtected;
        
        document.getElementById('password-enabled').checked = isProtected;
        document.getElementById('password-controls').classList.toggle('hidden', !isProtected);
        document.getElementById('password-status').classList.toggle('hidden', !isProtected || !this.getSitePassword());
        
        // Update encryption status
        const encryptionStatus = document.getElementById('encryption-status');
        if (isProtected && this.getSitePassword()) {
            encryptionStatus.textContent = '🔐 Encrypted';
            encryptionStatus.className = 'text-green-400';
        } else {
            encryptionStatus.textContent = '🔓 Not encrypted';
            encryptionStatus.className = 'text-gray-400';
        }
    }

    // Content Management
    onContentChange() {
        this.unsavedChanges = true;
        this.updateStatus();
        this.updateCharCount();
    }

    updateCharCount() {
        const content = document.getElementById('main-textarea').value;
        document.getElementById('char-count-display').textContent = content.length;
    }

    clearCurrentSite() {
        if (!this.currentSite) return;

        if (confirm('Are you sure you want to clear all data for site "' + this.currentSite + '"? This action cannot be undone.')) {
            localStorage.removeItem('protectedtext-site-' + this.currentSite);
            delete this.sitePasswords[this.currentSite];
            
            // Reset interface
            this.windows = { 1: { content: '', title: 'Window 1' } };
            this.currentWindow = 1;
            this.updateWindowTabs();
            this.loadWindowContent();
            this.unsavedChanges = false;
            this.updateStatus();
            
            this.showNotification('Site "' + this.currentSite + '" cleared', 'success');
        }
    }

    exportCurrentSite() {
        if (!this.currentSite) {
            this.showNotification('No site loaded to export', 'error');
            return;
        }

        const siteData = this.getSiteData(this.currentSite);
        const exportData = {
            siteId: this.currentSite,
            data: siteData,
            exported: new Date().toISOString(),
            version: '1.0'
        };

        this.downloadJSON(exportData, 'protectedtext-' + this.currentSite + '-' + new Date().toISOString().split('T')[0] + '.json');
        this.showNotification('Site "' + this.currentSite + '" exported', 'success');
    }

    // Recent Sites Management
    addToRecentSites(siteId) {
        let recentSites = this.getRecentSites();
        recentSites = recentSites.filter(site => site !== siteId);
        recentSites.unshift(siteId);
        recentSites = recentSites.slice(0, 10); // Keep only 10 recent sites
        
        localStorage.setItem('protectedtext-recent-sites', JSON.stringify(recentSites));
        this.updateRecentSitesList();
    }

    getRecentSites() {
        const sites = localStorage.getItem('protectedtext-recent-sites');
        return sites ? JSON.parse(sites) : [];
    }

    loadRecentSites() {
        this.updateRecentSitesList();
    }

    updateRecentSitesList() {
        const recentSites = this.getRecentSites();
        const sitesList = document.getElementById('sites-list');
        
        if (recentSites.length === 0) {
            sitesList.innerHTML = 
                '<div class="text-center text-gray-400 py-4">' +
                    '<i class="fas fa-globe text-2xl mb-2 opacity-50"></i>' +
                    '<p class="text-sm">No sites visited yet</p>' +
                '</div>';
            return;
        }

        let sitesHTML = '';
        recentSites.forEach(siteId => {
            const siteData = this.getSiteData(siteId);
            const lastModified = siteData ? new Date(siteData.lastModified).toLocaleDateString() : 'Unknown';
            const isProtected = siteData && siteData.isPasswordProtected;
            
            sitesHTML +=
                '<div class="note-item" onclick="app.loadRecentSite(\'' + siteId + '\')">' +
                    '<div class="flex items-center justify-between">' +
                        '<div>' +
                            '<h4 class="font-semibold text-white">' + (isProtected ? '🔒' : '📄') + ' ' + siteId + '</h4>' +
                            '<p class="text-xs text-gray-400">Last modified: ' + lastModified + '</p>' +
                        '</div>' +
                        '<div class="flex space-x-2">' +
                            '<button onclick="event.stopPropagation(); app.bookmarkSite(\'' + siteId + '\')" class="text-yellow-400 hover:text-yellow-300">' +
                                '<i class="fas fa-bookmark"></i>' +
                            '</button>' +
                            '<button onclick="event.stopPropagation(); app.deleteSite(\'' + siteId + '\')" class="text-red-400 hover:text-red-300">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        });
        
        sitesList.innerHTML = sitesHTML;
    }

    loadRecentSite(siteId) {
        document.getElementById('site-url').value = siteId;
        this.goToSite();
    }

    bookmarkSite(siteId) {
        let bookmarks = this.getBookmarks();
        if (!bookmarks.includes(siteId)) {
            bookmarks.push(siteId);
            localStorage.setItem('protectedtext-bookmarks', JSON.stringify(bookmarks));
            this.showNotification('Bookmarked: ' + siteId, 'success');
        } else {
            this.showNotification(siteId + ' is already bookmarked', 'info');
        }
    }

    bookmarkCurrentSite() {
        if (this.currentSite) {
            this.bookmarkSite(this.currentSite);
        } else {
            this.showNotification('No site loaded to bookmark', 'error');
        }
    }

    getBookmarks() {
        const bookmarks = localStorage.getItem('protectedtext-bookmarks');
        return bookmarks ? JSON.parse(bookmarks) : [];
    }

    deleteSite(siteId) {
        if (confirm('Delete site "' + siteId + '" permanently?')) {
            localStorage.removeItem('protectedtext-site-' + siteId);
            
            // Remove from recent sites
            let recentSites = this.getRecentSites();
            recentSites = recentSites.filter(site => site !== siteId);
            localStorage.setItem('protectedtext-recent-sites', JSON.stringify(recentSites));
            
            // Remove from bookmarks
            let bookmarks = this.getBookmarks();
            bookmarks = bookmarks.filter(site => site !== siteId);
            localStorage.setItem('protectedtext-bookmarks', JSON.stringify(bookmarks));
            
            this.updateRecentSitesList();
            this.showNotification('Site "' + siteId + '" deleted', 'success');
            
            // If current site was deleted, reset
            if (this.currentSite === siteId) {
                this.currentSite = null;
                this.updateCurrentSiteDisplay();
            }
        }
    }

    // Auto-save
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        if (this.isAutoSaveEnabled) {
            this.autoSaveInterval = setInterval(() => {
                if (this.unsavedChanges && this.currentSite) {
                    this.saveCurrentSite();
                }
            }, 2000);
        }
    }

    toggleAutoSave(enabled) {
        this.isAutoSaveEnabled = enabled;
        localStorage.setItem('protectedtext-autosave', JSON.stringify(enabled));
        
        if (enabled) {
            this.startAutoSave();
            this.showNotification('Auto-save enabled', 'success');
        } else {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            this.showNotification('Auto-save disabled', 'info');
        }
    }

    showAutoSaveIndicator() {
        const indicator = document.getElementById('autosave-indicator');
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    }

    // Status Updates
    updateStatus() {
        const lastSaved = document.getElementById('last-saved');
        const activeSite = document.getElementById('active-site-display');
        
        if (this.currentSite) {
            activeSite.textContent = this.currentSite;
            if (this.unsavedChanges) {
                lastSaved.textContent = 'Unsaved changes';
                lastSaved.className = 'text-yellow-400';
            } else {
                lastSaved.textContent = new Date().toLocaleString();
                lastSaved.className = 'text-green-400';
            }
        } else {
            activeSite.textContent = 'None';
            lastSaved.textContent = 'Never';
            lastSaved.className = 'text-gray-400';
        }
    }

    updateCurrentSiteDisplay() {
        const siteName = document.getElementById('current-site-name');
        const urlDisplay = document.getElementById('current-url-display');
        
        if (this.currentSite) {
            siteName.textContent = this.currentSite;
            urlDisplay.textContent = 'protectedtext.com/' + this.currentSite;
        } else {
            siteName.textContent = 'protectedtext.com';
            urlDisplay.textContent = 'Click "GO" to load a site';
        }
    }

    // Settings and Data Management
    showSettingsModal() {
        document.getElementById('settings-modal').classList.add('active');
        this.updateStatistics();
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').classList.remove('active');
    }

    updateStatistics() {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('protectedtext-site-'));
        const totalNotes = allKeys.length;
        
        let storageUsed = 0;
        allKeys.forEach(key => {
            storageUsed += localStorage.getItem(key).length;
        });
        
        const storageUsedKB = (storageUsed / 1024).toFixed(2);
        
        const recentSites = this.getRecentSites();
        const lastActivity = recentSites.length > 0 ? 
            this.getSiteData(recentSites[0])?.lastModified || 'Never' : 'Never';
        
        document.getElementById('total-notes-stat').textContent = totalNotes;
        document.getElementById('storage-used-stat').textContent = storageUsedKB + ' KB';
        document.getElementById('last-activity-stat').textContent = 
            lastActivity !== 'Never' ? new Date(lastActivity).toLocaleDateString() : 'Never';
    }

    exportAllData() {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('protectedtext-'));
        const exportData = {
            sites: {},
            recentSites: this.getRecentSites(),
            bookmarks: this.getBookmarks(),
            settings: {
                autoSave: this.isAutoSaveEnabled
            },
            exported: new Date().toISOString(),
            version: '1.0'
        };

        allKeys.forEach(key => {
            if (key.startsWith('protectedtext-site-')) {
                const siteId = key.replace('protectedtext-site-', '');
                exportData.sites[siteId] = JSON.parse(localStorage.getItem(key));
            }
        });

        this.downloadJSON(exportData, 'protectedtext-full-backup-' + new Date().toISOString().split('T')[0] + '.json');
        this.showNotification('All data exported successfully', 'success');
    }

    handleFileImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.sites) {
                    // Import sites
                    Object.keys(importData.sites).forEach(siteId => {
                        localStorage.setItem('protectedtext-site-' + siteId, JSON.stringify(importData.sites[siteId]));
                    });
                }

                if (importData.recentSites) {
                    localStorage.setItem('protectedtext-recent-sites', JSON.stringify(importData.recentSites));
                }

                if (importData.bookmarks) {
                    localStorage.setItem('protectedtext-bookmarks', JSON.stringify(importData.bookmarks));
                }

                if (importData.settings) {
                    this.isAutoSaveEnabled = importData.settings.autoSave !== false;
                    localStorage.setItem('protectedtext-autosave', JSON.stringify(this.isAutoSaveEnabled));
                    document.getElementById('auto-save-toggle').checked = this.isAutoSaveEnabled;
                }

                this.updateRecentSitesList();
                this.updateStatistics();
                this.showNotification('Data imported successfully', 'success');
                
            } catch (error) {
                this.showNotification('Failed to import data: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete ALL stored data? This action cannot be undone!')) {
            const keysToDelete = Object.keys(localStorage).filter(key => key.startsWith('protectedtext-'));
            keysToDelete.forEach(key => localStorage.removeItem(key));
            
            // Reset state
            this.currentSite = null;
            this.windows = { 1: { content: '', title: 'Window 1' } };
            this.currentWindow = 1;
            this.sitePasswords = {};
            this.unsavedChanges = false;
            
            // Update UI
            this.updateRecentSitesList();
            this.updateWindowTabs();
            this.loadWindowContent();
            this.updateCurrentSiteDisplay();
            this.updateStatus();
            document.getElementById('site-url').value = '';
            
            this.showNotification('All data cleared', 'success');
        }
    }

    // Utility Functions
    encryptData(data, password) {
        return CryptoJS.AES.encrypt(data, password).toString();
    }

    decryptData(encryptedData, password) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, password);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform translate-x-full';
        
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(45deg, #00ff88, #00cc6a)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(45deg, #ff0040, #cc0033)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(45deg, #ffaa00, #cc8800)';
                break;
            default:
                notification.style.background = 'linear-gradient(45deg, #00d4ff, #0099cc)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+S: Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.currentSite) {
                this.saveCurrentSite();
                this.showNotification('Site saved manually', 'success');
            }
        }
        
        // Ctrl+N: New window
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.addWindow();
        }
        
        // Ctrl+W: Close window (if more than 1)
        if (e.ctrlKey && e.key === 'w') {
            if (Object.keys(this.windows).length > 1) {
                e.preventDefault();
                this.closeWindow(this.currentWindow);
            }
        }
        
        // Ctrl+Tab: Next window
        if (e.ctrlKey && e.key === 'Tab') {
            e.preventDefault();
            const windowIds = Object.keys(this.windows).map(Number).sort();
            const currentIndex = windowIds.indexOf(this.currentWindow);
            const nextIndex = (currentIndex + 1) % windowIds.length;
            this.switchToWindow(windowIds[nextIndex]);
        }
    }
}

// Global close window function for HTML onclick
window.closeWindow = function(windowId) {
    if (window.app) {
        window.app.closeWindow(windowId);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProtectedTextApp();
    
    // Check for site parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const siteParam = urlParams.get('site');
    if (siteParam) {
        document.getElementById('site-url').value = siteParam;
        window.app.goToSite();
    }
});
