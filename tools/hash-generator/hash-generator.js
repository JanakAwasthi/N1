// Hash Generator functionality
class HashGenerator {
    constructor() {
        this.hashHistory = JSON.parse(localStorage.getItem('hashHistory') || '[]');
        this.setupEventListeners();
        this.updateHistory();
        this.updateCharacterCount();
    }

    setupEventListeners() {
        // Text input character counting
        document.getElementById('textInput').addEventListener('input', () => {
            this.updateCharacterCount();
        });

        // Hash comparison inputs
        document.getElementById('hash1').addEventListener('input', () => {
            this.compareHashesRealtime();
        });

        document.getElementById('hash2').addEventListener('input', () => {
            this.compareHashesRealtime();
        });

        // File input handling
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    updateCharacterCount() {
        const input = document.getElementById('textInput').value;
        document.getElementById('inputLength').textContent = `${input.length} characters`;
    }

    switchTab(mode) {
        // Update tab appearance
        document.getElementById('textTab').className = mode === 'text' ? 
            'tab-active flex-1 py-4 px-6 text-center font-medium transition-colors' :
            'flex-1 py-4 px-6 text-center font-medium text-gray-600 hover:bg-gray-50 transition-colors';
        
        document.getElementById('fileTab').className = mode === 'file' ? 
            'tab-active flex-1 py-4 px-6 text-center font-medium transition-colors' :
            'flex-1 py-4 px-6 text-center font-medium text-gray-600 hover:bg-gray-50 transition-colors';

        // Show/hide content
        document.getElementById('textMode').classList.toggle('hidden', mode !== 'text');
        document.getElementById('fileMode').classList.toggle('hidden', mode !== 'file');
    }

    generateTextHashes() {
        const input = document.getElementById('textInput').value;
        if (!input.trim()) {
            showNotification('Please enter text to generate hashes', 'error');
            return;
        }

        const algorithms = {
            md5: document.getElementById('md5').checked,
            sha1: document.getElementById('sha1').checked,
            sha256: document.getElementById('sha256').checked,
            sha512: document.getElementById('sha512').checked
        };

        const selectedAlgorithms = Object.keys(algorithms).filter(alg => algorithms[alg]);
        
        if (selectedAlgorithms.length === 0) {
            showNotification('Please select at least one hash algorithm', 'error');
            return;
        }

        const hashes = {};
        
        try {
            if (algorithms.md5) {
                hashes.MD5 = CryptoJS.MD5(input).toString();
            }
            if (algorithms.sha1) {
                hashes['SHA-1'] = CryptoJS.SHA1(input).toString();
            }
            if (algorithms.sha256) {
                hashes['SHA-256'] = CryptoJS.SHA256(input).toString();
            }
            if (algorithms.sha512) {
                hashes['SHA-512'] = CryptoJS.SHA512(input).toString();
            }

            this.displayTextHashes(hashes, input);
            
            this.addToHistory({
                type: 'text',
                input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
                hashes: hashes,
                timestamp: new Date().toISOString()
            });

            showNotification('Hashes generated successfully', 'success');
        } catch (error) {
            showNotification('Error generating hashes: ' + error.message, 'error');
        }
    }

    displayTextHashes(hashes, originalText) {
        const container = document.getElementById('textHashResults');
        container.innerHTML = '';

        Object.entries(hashes).forEach(([algorithm, hash]) => {
            const hashCard = document.createElement('div');
            hashCard.className = 'hash-card bg-white border border-gray-200 rounded-lg p-4';

            hashCard.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-semibold text-gray-800">${algorithm}</h4>
                    <div class="flex space-x-2">
                        <button onclick="copyToClipboard('${hash}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                        <button onclick="downloadHash('${algorithm}', '${hash}', '${originalText.substring(0, 50).replace(/'/g, '\\\'')}')" 
                                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-download mr-1"></i>Download
                        </button>
                    </div>
                </div>
                <div class="bg-white rounded p-3 border-2 border-gray-200">
                    <code class="hash-output text-sm text-gray-800 font-mono">${hash}</code>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    Length: ${hash.length} characters
                </div>
            `;

            container.appendChild(hashCard);
        });
    }

    handleFiles(files) {
        const maxFileSize = 100 * 1024 * 1024; // 100MB
        
        Array.from(files).forEach(file => {
            if (file.size > maxFileSize) {
                showNotification(`File ${file.name} is too large (max 100MB)`, 'error');
                return;
            }

            this.hashFile(file);
        });
    }

    hashFile(file) {
        const reader = new FileReader();
        
        showNotification(`Processing ${file.name}...`, 'info');
        
        reader.onload = (e) => {
            try {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                
                const hashes = {
                    'MD5': CryptoJS.MD5(wordArray).toString(),
                    'SHA-1': CryptoJS.SHA1(wordArray).toString(),
                    'SHA-256': CryptoJS.SHA256(wordArray).toString(),
                    'SHA-512': CryptoJS.SHA512(wordArray).toString()
                };

                this.displayFileHash(file, hashes);
                
                this.addToHistory({
                    type: 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    hashes: hashes,
                    timestamp: new Date().toISOString()
                });

                showNotification(`${file.name} hashed successfully`, 'success');
            } catch (error) {
                showNotification(`Error hashing file ${file.name}: ${error.message}`, 'error');
            }
        };

        reader.onerror = () => {
            showNotification(`Error reading file ${file.name}`, 'error');
        };

        reader.readAsArrayBuffer(file);
    }

    displayFileHash(file, hashes) {
        const container = document.getElementById('fileHashResults');
        const fileCard = document.createElement('div');
        fileCard.className = 'hash-card bg-white border border-gray-200 rounded-lg p-6';

        const fileSize = this.formatFileSize(file.size);
        const timestamp = new Date().toLocaleString();

        fileCard.innerHTML = `
            <div class="border-b border-gray-200 pb-4 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-gray-800 text-lg">${file.name}</h4>
                        <p class="text-sm text-gray-600">${fileSize} • ${file.type || 'Unknown type'} • ${timestamp}</p>
                    </div>
                    <button onclick="downloadAllHashes('${file.name}', ${JSON.stringify(hashes).replace(/"/g, '&quot;')})" 
                            class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm transition-colors">
                        <i class="fas fa-download mr-1"></i>Download All
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
                ${Object.entries(hashes).map(([algorithm, hash]) => `
                    <div class="border border-gray-100 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium text-gray-800">${algorithm}</span>
                            <button onclick="copyToClipboard('${hash}')" 
                                    class="text-blue-500 hover:text-blue-700 text-sm">
                                <i class="fas fa-copy mr-1"></i>Copy
                            </button>
                        </div>
                        <div class="bg-white rounded p-2 border border-gray-300">
                            <code class="hash-output text-xs text-gray-800 font-mono">${hash}</code>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.appendChild(fileCard);
    }

    compareHashes() {
        const hash1 = document.getElementById('hash1').value.trim().toLowerCase();
        const hash2 = document.getElementById('hash2').value.trim().toLowerCase();
        
        if (!hash1 || !hash2) {
            showNotification('Please enter both hashes to compare', 'error');
            return;
        }

        this.displayComparisonResult(hash1, hash2);
    }

    compareHashesRealtime() {
        const hash1 = document.getElementById('hash1').value.trim().toLowerCase();
        const hash2 = document.getElementById('hash2').value.trim().toLowerCase();
        
        if (hash1 && hash2) {
            this.displayComparisonResult(hash1, hash2);
        } else {
            document.getElementById('comparisonResult').innerHTML = '';
        }
    }

    displayComparisonResult(hash1, hash2) {
        const resultContainer = document.getElementById('comparisonResult');
        const isMatch = hash1 === hash2;
        
        resultContainer.innerHTML = `
            <div class="p-4 rounded-lg ${isMatch ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}">
                <div class="flex items-center justify-center">
                    <i class="fas ${isMatch ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'} text-2xl mr-3"></i>
                    <span class="font-semibold ${isMatch ? 'text-green-800' : 'text-red-800'}">
                        ${isMatch ? 'Hashes Match!' : 'Hashes Do Not Match'}
                    </span>
                </div>
                ${!isMatch ? `
                    <div class="mt-2 text-sm text-red-700">
                        The hashes are different, indicating the data has been modified or is different.
                    </div>
                ` : `
                    <div class="mt-2 text-sm text-green-700">
                        The hashes are identical, indicating the data is the same.
                    </div>
                `}
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addToHistory(item) {
        this.hashHistory.unshift({
            ...item,
            id: Date.now()
        });
        
        this.hashHistory = this.hashHistory.slice(0, 20); // Keep last 20
        localStorage.setItem('hashHistory', JSON.stringify(this.hashHistory));
        this.updateHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('hashHistory');
        
        if (this.hashHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No hash history yet</p>';
            return;
        }

        historyContainer.innerHTML = this.hashHistory.map(item => {
            const hashCount = Object.keys(item.hashes).length;
            
            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="flex items-center space-x-2">
                                <i class="fas ${item.type === 'file' ? 'fa-file' : 'fa-text-height'} text-gray-500"></i>
                                <span class="font-medium">${item.type === 'file' ? item.fileName : 'Text Hash'}</span>
                                <span class="text-sm text-gray-500">${hashCount} algorithm${hashCount > 1 ? 's' : ''}</span>
                            </div>
                            ${item.type === 'file' ? 
                                `<p class="text-sm text-gray-500 mt-1">${this.formatFileSize(item.fileSize)}</p>` :
                                `<p class="text-sm text-gray-500 mt-1 truncate">${item.input}</p>`
                            }
                        </div>
                        <span class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    
                    <div class="space-y-2">
                        ${Object.entries(item.hashes).map(([algorithm, hash]) => `
                            <div class="flex justify-between items-center bg-white rounded p-2 border border-gray-300">
                                <span class="text-sm font-medium text-gray-800">${algorithm}:</span>
                                <div class="flex items-center space-x-2">
                                    <code class="text-xs text-gray-800 font-mono truncate max-w-xs">${hash.substring(0, 20)}...</code>
                                    <button onclick="copyToClipboard('${hash}')" 
                                            class="text-blue-500 hover:text-blue-700 text-xs">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the hash history?')) {
            this.hashHistory = [];
            localStorage.removeItem('hashHistory');
            this.updateHistory();
            showNotification('Hash history cleared successfully', 'success');
        }
    }

    clearTextInput() {
        document.getElementById('textInput').value = '';
        document.getElementById('textHashResults').innerHTML = '';
        this.updateCharacterCount();
    }
}

const hashGenerator = new HashGenerator();

// Global functions
function switchTab(mode) {
    hashGenerator.switchTab(mode);
}

function generateTextHashes() {
    hashGenerator.generateTextHashes();
}

function compareHashes() {
    hashGenerator.compareHashes();
}

function clearTextInput() {
    hashGenerator.clearTextInput();
}

function clearHistory() {
    hashGenerator.clearHistory();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Hash copied to clipboard', 'success');
    });
}

function downloadHash(algorithm, hash, originalText) {
    const content = `Original Text: ${originalText}\n${algorithm} Hash: ${hash}\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${algorithm.toLowerCase()}_hash.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadAllHashes(filename, hashes) {
    const hashObj = typeof hashes === 'string' ? JSON.parse(hashes) : hashes;
    let content = `File: ${filename}\nGenerated: ${new Date().toISOString()}\n\n`;
    
    Object.entries(hashObj).forEach(([algorithm, hash]) => {
        content += `${algorithm}: ${hash}\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_hashes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
