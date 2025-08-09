/**
 * Enhanced Store Text Tool - Secure Text Storage with Multi-window Support
 * Features: Password protection, Auto-save, Multi-window editing, Enhanced scrolling
 */

// Global variables for the enhanced store text tool
let savedNotes = {};
let currentWindows = [{ id: 1, content: '', title: 'Window 1' }];
let activeWindow = 1;
let windowCounter = 1;

// Load saved notes from localStorage
function loadSavedNotes() {
    const saved = localStorage.getItem('textVaultNotes');
    if (saved) {
        savedNotes = JSON.parse(saved);
    }
}

// Save notes to localStorage
function saveNotesToStorage() {
    localStorage.setItem('textVaultNotes', JSON.stringify(savedNotes));
}

// Initialize enhanced features
function initializeEnhancedFeatures() {
    // Smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Auto-resize textareas
    autoResizeTextareas();
    
    // Add scroll-to-top button
    addScrollToTopButton();
    
    // Enhanced window management
    initializeWindowDocking();
}

// Auto-resize textareas
function autoResizeTextareas() {
    const textareas = document.querySelectorAll('.cyber-textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.max(this.scrollHeight, 400) + 'px';
        });
    });
}

// Add scroll-to-top button
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollButton.className = 'scroll-to-top-btn';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 120px;
        right: 30px;
        background: linear-gradient(45deg, #00d4ff, #ff0080);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        font-size: 16px;
    `;

    document.body.appendChild(scrollButton);

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize window docking
function initializeWindowDocking() {
    setupWindowDragAndDrop();
}

// Setup window drag and drop
function setupWindowDragAndDrop() {
    const windows = document.querySelectorAll('.editor-window');
    windows.forEach((window, index) => {
        const header = window.querySelector('.window-header') || window.querySelector('label');
        if (header) {
            header.style.cursor = 'move';
            header.title = 'Drag to move window';
        }
    });
}

// Password visibility toggle function
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(inputId + '-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show store text interface
function showStoreTool() {
    document.getElementById('tool-selection').classList.add('hidden');
    document.getElementById('store-interface').classList.remove('hidden');
    document.getElementById('find-interface').classList.add('hidden');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Initialize enhanced features
    initializeEnhancedFeatures();
}

// Show find text interface
function showFindTool() {
    document.getElementById('tool-selection').classList.add('hidden');
    document.getElementById('store-interface').classList.add('hidden');
    document.getElementById('find-interface').classList.remove('hidden');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Back to tool selection
function backToSelection() {
    document.getElementById('tool-selection').classList.remove('hidden');
    document.getElementById('store-interface').classList.add('hidden');
    document.getElementById('find-interface').classList.add('hidden');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Create new note
function createNewNote() {
    const noteName = document.getElementById('note-name').value.trim();
    const password = document.getElementById('note-password').value;
    
    if (!noteName) {
        alert('Please enter a note name');
        return;
    }
    
    if (!password) {
        alert('Please enter a password');
        return;
    }
    
    // Create a unique key for the note
    const noteKey = `${noteName}_${btoa(password)}`;
    
    if (savedNotes[noteKey]) {
        if (!confirm(`A note with this name and password already exists. Do you want to overwrite it?`)) {
            return;
        }
    }
    
    // Initialize the note with current window content
    const windowsData = currentWindows.map(window => ({
        id: window.id,
        title: window.title,
        content: document.getElementById(`editor-${window.id}`)?.value || ''
    }));
    
    savedNotes[noteKey] = {
        name: noteName,
        windows: windowsData,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    saveNotesToStorage();
    updateNotesList();
    
    // Clear form
    document.getElementById('note-name').value = '';
    document.getElementById('note-password').value = '';
    
    alert(`Note "${noteName}" saved successfully with ${windowsData.length} window(s)!`);
}

// Save current note
function saveCurrentNote() {
    const noteName = document.getElementById('note-name').value.trim();
    const password = document.getElementById('note-password').value;
    
    if (!noteName || !password) {
        alert('Please enter note name and password first');
        return;
    }
    
    createNewNote();
}

// Add new window
function addNewWindow() {
    windowCounter++;
    const newWindow = {
        id: windowCounter,
        title: `Window ${windowCounter}`,
        content: ''
    };
    
    currentWindows.push(newWindow);
    
    // Create HTML for new window
    const editorWindows = document.getElementById('editor-windows');
    const windowDiv = document.createElement('div');
    windowDiv.className = 'editor-window';
    windowDiv.setAttribute('data-window', windowCounter);
    
    windowDiv.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <label class="text-white font-semibold window-header">Window ${windowCounter}:</label>
            <button onclick="removeWindow(${windowCounter})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <textarea 
            id="editor-${windowCounter}" 
            class="cyber-textarea w-full h-40" 
            placeholder="Start typing in window ${windowCounter}..."
        ></textarea>
    `;
    
    editorWindows.appendChild(windowDiv);
    
    // Initialize enhanced features for new textarea
    autoResizeTextareas();
    
    // Focus on new window
    document.getElementById(`editor-${windowCounter}`).focus();
    
    // Smooth scroll to new window
    windowDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Remove window
function removeWindow(windowId) {
    if (currentWindows.length <= 1) {
        alert('Cannot remove the last window');
        return;
    }
    
    if (confirm('Are you sure you want to remove this window? Unsaved content will be lost.')) {
        // Remove from array
        currentWindows = currentWindows.filter(w => w.id !== windowId);
        
        // Remove from DOM
        const windowElement = document.querySelector(`[data-window="${windowId}"]`);
        if (windowElement) {
            windowElement.remove();
        }
    }
}

// Update notes list
function updateNotesList() {
    const notesList = document.getElementById('notes-list');
    
    if (Object.keys(savedNotes).length === 0) {
        notesList.innerHTML = '<p class="text-gray-400 text-sm">No notes created yet</p>';
        return;
    }
    
    notesList.innerHTML = '';
    
    Object.entries(savedNotes).forEach(([key, note]) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h5 class="font-semibold text-white">${note.name}</h5>
                    <p class="text-xs text-gray-400">${note.windows.length} window(s) • ${new Date(note.lastModified).toLocaleDateString()}</p>
                </div>
                <button onclick="deleteNoteFromList('${key}')" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        notesList.appendChild(noteDiv);
    });
}

// Delete note from list
function deleteNoteFromList(noteKey) {
    const note = savedNotes[noteKey];
    if (confirm(`Are you sure you want to delete "${note.name}"? This action cannot be undone.`)) {
        delete savedNotes[noteKey];
        saveNotesToStorage();
        updateNotesList();
        alert('Note deleted successfully!');
    }
}

// Find note
function findNote() {
    const noteName = document.getElementById('search-note-name').value.trim();
    const password = document.getElementById('search-password').value;
    
    if (!noteName || !password) {
        alert('Please enter both note name and password');
        return;
    }
    
    const noteKey = `${noteName}_${btoa(password)}`;
    const note = savedNotes[noteKey];
    
    if (!note) {
        alert('Note not found. Please check your note name and password.');
        return;
    }
    
    // Display found note
    displayFoundNote(note);
}

// Display found note
function displayFoundNote(note) {
    // Create result display
    let resultHtml = `
        <div class="mt-8 cyber-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-xl font-bold text-white orbitron">📄 ${note.name}</h4>
                <div class="space-x-2">
                    <button onclick="editFoundNote()" class="cyber-button secondary">
                        <i class="fas fa-edit mr-2"></i>EDIT
                    </button>
                    <button onclick="deleteFoundNote()" class="cyber-button danger">
                        <i class="fas fa-trash mr-2"></i>DELETE
                    </button>
                </div>
            </div>
            <p class="text-gray-400 mb-4">
                Created: ${new Date(note.created).toLocaleString()} • 
                Modified: ${new Date(note.lastModified).toLocaleString()}
            </p>
    `;
    
    // Add windows content
    note.windows.forEach((window, index) => {
        resultHtml += `
            <div class="mb-6">
                <h5 class="text-white font-semibold mb-2">${window.title}:</h5>
                <div class="cyber-textarea bg-gray-900 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre class="whitespace-pre-wrap text-white">${window.content || 'Empty window'}</pre>
                </div>
            </div>
        `;
    });
    
    resultHtml += '</div>';
    
    // Remove existing result
    const existingResult = document.getElementById('search-result');
    if (existingResult) {
        existingResult.remove();
    }
    
    // Add new result
    const resultDiv = document.createElement('div');
    resultDiv.id = 'search-result';
    resultDiv.innerHTML = resultHtml;
    
    document.querySelector('#find-interface .cyber-card').appendChild(resultDiv);
    
    // Smooth scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Edit found note
function editFoundNote() {
    const noteName = document.getElementById('search-note-name').value.trim();
    const password = document.getElementById('search-password').value;
    
    // Switch to store interface
    showStoreTool();
    
    // Load note data into editor
    setTimeout(() => {
        document.getElementById('note-name').value = noteName;
        document.getElementById('note-password').value = password;
        loadNote(noteName);
    }, 100);
}

// Load note into editor
function loadNote(noteName) {
    const password = document.getElementById('note-password').value;
    const noteKey = `${noteName}_${btoa(password)}`;
    const note = savedNotes[noteKey];
    
    if (!note) return;
    
    // Clear existing windows
    const editorWindows = document.getElementById('editor-windows');
    editorWindows.innerHTML = '';
    
    currentWindows = [];
    windowCounter = 0;
    
    // Recreate windows from saved note
    note.windows.forEach((window, index) => {
        windowCounter++;
        currentWindows.push({
            id: windowCounter,
            title: window.title,
            content: window.content
        });
        
        const windowDiv = document.createElement('div');
        windowDiv.className = 'editor-window';
        windowDiv.setAttribute('data-window', windowCounter);
        
        windowDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <label class="text-white font-semibold window-header">${window.title}:</label>
                <button onclick="removeWindow(${windowCounter})" class="text-red-400 hover:text-red-300" ${windowCounter === 1 ? 'style="display: none;"' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <textarea 
                id="editor-${windowCounter}" 
                class="cyber-textarea w-full h-40" 
                placeholder="Start typing in ${window.title}..."
            >${window.content}</textarea>
        `;
        
        editorWindows.appendChild(windowDiv);
    });
    
    // Initialize enhanced features
    autoResizeTextareas();
}

// Delete found note
function deleteFoundNote() {
    const noteName = document.getElementById('search-note-name').value.trim();
    const password = document.getElementById('search-password').value;

    if (!noteName || !password) return;

    if (!confirm(`Are you sure you want to delete the note "${noteName}"? This action cannot be undone.`)) {
        return;
    }

    const noteKey = `${noteName}_${btoa(password)}`;
    delete savedNotes[noteKey];
    saveNotesToStorage();

    clearSearchResult();
    updateNotesList();
    alert(`Note "${noteName}" deleted successfully!`);
}

// Clear search result
function clearSearchResult() {
    const existingResult = document.getElementById('search-result');
    if (existingResult) {
        existingResult.remove();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSavedNotes();
    updateNotesList();
    initializeEnhancedFeatures();
    
    // Initialize AdSense
    if (typeof adsbygoogle !== 'undefined') {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
});
