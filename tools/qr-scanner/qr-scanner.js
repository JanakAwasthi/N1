/**
 * Advanced QR Code Scanner
 * Camera scanning and image upload scanning with full QR type support
 */

class QRCodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.isScanning = false;
        this.scanHistory = this.loadHistory();
        this.currentCameraIndex = 0;
        this.availableCameras = [];
        this.frameCount = 0;
        this.scanCount = 0;
        this.lastScanTime = Date.now();
        
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        const uploadZone = document.getElementById('upload-zone');
        uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        // Get available cameras
        this.getCameraDevices();
    }

    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            
            // Show/hide switch camera button
            const switchBtn = document.getElementById('switch-camera-btn');
            if (this.availableCameras.length <= 1) {
                switchBtn.style.display = 'none';
            }
        } catch (error) {
            console.warn('Could not enumerate camera devices:', error);
        }
    }

    async startCamera() {
        try {
            this.updateCameraStatus('connecting', 'Connecting to camera...');
            
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            // If specific camera selected
            if (this.availableCameras.length > 0 && this.currentCameraIndex < this.availableCameras.length) {
                constraints.video.deviceId = this.availableCameras[this.currentCameraIndex].deviceId;
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.video = document.getElementById('video-element');
            this.canvas = document.getElementById('scanner-canvas');
            this.context = this.canvas.getContext('2d');
            
            this.video.srcObject = this.stream;
            
            // Setup canvas
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            };

            // Show camera UI
            document.getElementById('camera-placeholder').classList.add('hidden');
            document.getElementById('camera-container').classList.remove('hidden');
            document.getElementById('camera-preview').classList.add('camera-ready');

            this.updateCameraStatus('active', 'Camera active');
            this.startScanning();

        } catch (error) {
            console.error('Camera access error:', error);
            this.updateCameraStatus('error', 'Camera access denied');
            this.showError('Camera access denied. Please allow camera access and try again.');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.stopScanning();
        
        // Hide camera UI
        document.getElementById('camera-placeholder').classList.remove('hidden');
        document.getElementById('camera-container').classList.add('hidden');
        document.getElementById('camera-preview').classList.remove('camera-ready');

        this.updateCameraStatus('inactive', 'Camera stopped');
        this.updateScannerStatus('inactive', 'Scanner stopped');
    }

    async switchCamera() {
        if (this.availableCameras.length <= 1) return;

        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.availableCameras.length;
        
        // Restart camera with new device
        this.stopCamera();
        await this.startCamera();
    }

    toggleFlashlight() {
        if (!this.stream) return;

        const track = this.stream.getVideoTracks()[0];
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            const currentSettings = track.getSettings();
            track.applyConstraints({
                advanced: [{ torch: !currentSettings.torch }]
            }).catch(err => {
                console.warn('Flashlight not supported:', err);
            });
        } else {
            alert('Flashlight not supported on this device');
        }
    }

    startScanning() {
        this.isScanning = true;
        this.updateScannerStatus('scanning', 'Scanning for QR codes...');
        this.scanFrame();
    }

    stopScanning() {
        this.isScanning = false;
        this.updateScannerStatus('inactive', 'Scanner inactive');
    }

    scanFrame() {
        if (!this.isScanning || !this.video || !this.canvas) return;

        this.frameCount++;
        
        // Calculate FPS
        const now = Date.now();
        if (now - this.lastScanTime >= 1000) {
            document.getElementById('fps-counter').textContent = `FPS: ${this.frameCount}`;
            this.frameCount = 0;
            this.lastScanTime = now;
        }

        // Draw video frame to canvas
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Scan for QR code
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode) {
            this.handleQRDetected(qrCode);
        }

        // Continue scanning
        requestAnimationFrame(() => this.scanFrame());
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('upload-zone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('upload-zone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('upload-zone').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.scanImageData(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    scanImageData(imageSrc) {
        const img = new Image();
        img.onload = () => {
            // Create temporary canvas
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempContext.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Scan for QR code
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (qrCode) {
                this.handleQRDetected(qrCode);
            } else {
                this.showError('No QR code found in the image');
            }
        };
        img.src = imageSrc;
    }

    handleQRDetected(qrCode) {
        this.scanCount++;
        document.getElementById('scans-count').textContent = `Scans: ${this.scanCount}`;
        
        // Add to history
        this.addToHistory(qrCode.data);
        
        // Display result
        this.displayQRResult(qrCode);
        
        // Analyze QR type and show actions
        this.analyzeQRType(qrCode.data);
    }

    displayQRResult(qrCode) {
        const resultDiv = document.getElementById('scan-result');
        const qrData = qrCode.data;
        
        resultDiv.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <i class="fas fa-qrcode text-2xl text-green-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-gray-900 mb-2">QR Code Detected</h3>
                        <div class="p-3 bg-gray-50 rounded-lg">
                            <p class="text-sm text-gray-800 break-all">${this.escapeHtml(qrData)}</p>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="copyToClipboard('${this.escapeHtml(qrData)}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all">
                                <i class="fas fa-copy mr-1"></i>Copy
                            </button>
                            <button onclick="shareQRData('${this.escapeHtml(qrData)}')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-all">
                                <i class="fas fa-share mr-1"></i>Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultDiv.classList.remove('text-center', 'text-gray-500');
        
        // Show QR info
        this.showQRInfo(qrCode);
    }

    showQRInfo(qrCode) {
        const qrInfo = document.getElementById('qr-info');
        
        // Detect QR type
        const qrType = this.detectQRType(qrCode.data);
        
        document.getElementById('qr-type-info').textContent = qrType;
        document.getElementById('qr-size-info').textContent = `${qrCode.location ? 
            Math.abs(qrCode.location.topRightCorner.x - qrCode.location.topLeftCorner.x) : 'Unknown'}px`;
        document.getElementById('qr-version-info').textContent = qrCode.version || 'Unknown';
        document.getElementById('qr-error-info').textContent = qrCode.errorCorrectionLevel || 'Unknown';
        document.getElementById('qr-data-length').textContent = qrCode.data.length;
        
        qrInfo.classList.remove('hidden');
    }

    detectQRType(data) {
        if (data.startsWith('http://') || data.startsWith('https://')) {
            return 'URL';
        } else if (data.startsWith('mailto:')) {
            return 'Email';
        } else if (data.startsWith('tel:')) {
            return 'Phone';
        } else if (data.startsWith('sms:')) {
            return 'SMS';
        } else if (data.startsWith('WIFI:')) {
            return 'WiFi';
        } else if (data.startsWith('BEGIN:VCARD')) {
            return 'vCard';
        } else if (data.startsWith('geo:')) {
            return 'Location';
        } else {
            return 'Text';
        }
    }

    analyzeQRType(data) {
        const actionsContainer = document.getElementById('action-buttons-container');
        const actionsDiv = document.getElementById('action-buttons');
        
        let actions = [];
        
        if (data.startsWith('http://') || data.startsWith('https://')) {
            actions.push({
                icon: 'fas fa-external-link-alt',
                text: 'Open URL',
                action: `window.open('${data}', '_blank')`
            });
        } else if (data.startsWith('mailto:')) {
            actions.push({
                icon: 'fas fa-envelope',
                text: 'Send Email',
                action: `window.open('${data}')`
            });
        } else if (data.startsWith('tel:')) {
            actions.push({
                icon: 'fas fa-phone',
                text: 'Call Number',
                action: `window.open('${data}')`
            });
        } else if (data.startsWith('sms:')) {
            actions.push({
                icon: 'fas fa-sms',
                text: 'Send SMS',
                action: `window.open('${data}')`
            });
        } else if (data.startsWith('WIFI:')) {
            actions.push({
                icon: 'fas fa-wifi',
                text: 'Show WiFi Info',
                action: `showWiFiInfo('${this.escapeHtml(data)}')`
            });
        } else if (data.startsWith('geo:')) {
            const coords = data.replace('geo:', '').split(',');
            if (coords.length >= 2) {
                actions.push({
                    icon: 'fas fa-map-marker-alt',
                    text: 'Open in Maps',
                    action: `window.open('https://maps.google.com/?q=${coords[0]},${coords[1]}', '_blank')`
                });
            }
        }

        // Common actions
        actions.push({
            icon: 'fas fa-search',
            text: 'Search Google',
            action: `window.open('https://www.google.com/search?q=${encodeURIComponent(data)}', '_blank')`
        });

        // Render actions
        actionsContainer.innerHTML = '';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm';
            button.innerHTML = `<i class="${action.icon} mr-2"></i>${action.text}`;
            button.onclick = () => eval(action.action);
            actionsContainer.appendChild(button);
        });

        actionsDiv.classList.remove('hidden');
    }

    addToHistory(data) {
        const historyItem = {
            id: Date.now(),
            data: data,
            type: this.detectQRType(data),
            timestamp: new Date().toLocaleString()
        };

        // Add to beginning of array
        this.scanHistory.unshift(historyItem);
        
        // Limit history to 20 items
        if (this.scanHistory.length > 20) {
            this.scanHistory = this.scanHistory.slice(0, 20);
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        const historySection = document.getElementById('scan-history');

        if (this.scanHistory.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyList.innerHTML = '';

        this.scanHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50';
            historyItem.onclick = () => this.displayHistoryItem(item.data);
            
            historyItem.innerHTML = `
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${this.escapeHtml(item.data)}</p>
                    <p class="text-xs text-gray-500">${item.type} • ${item.timestamp}</p>
                </div>
                <button onclick="event.stopPropagation(); removeHistoryItem(${item.id})" class="ml-2 text-red-600 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    displayHistoryItem(data) {
        // Create a mock QR code object for displaying history item
        const mockQR = {
            data: data,
            version: 'History',
            errorCorrectionLevel: 'Unknown'
        };
        this.displayQRResult(mockQR);
        this.analyzeQRType(data);
    }

    removeHistoryItem(id) {
        this.scanHistory = this.scanHistory.filter(item => item.id !== id);
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.scanHistory = [];
        this.saveHistory();
        document.getElementById('scan-history').classList.add('hidden');
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('qr-scanner-history');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('qr-scanner-history', JSON.stringify(this.scanHistory));
        } catch (error) {
            console.warn('Could not save scan history:', error);
        }
    }

    updateCameraStatus(status, text) {
        const statusIndicator = document.getElementById('camera-status');
        const statusText = document.getElementById('camera-status-text');
        
        statusIndicator.className = 'w-3 h-3 rounded-full ' + 
            (status === 'active' ? 'bg-green-400' : 
             status === 'connecting' ? 'bg-yellow-400' : 
             status === 'error' ? 'bg-red-400' : 'bg-gray-400');
        
        statusText.textContent = text;
    }

    updateScannerStatus(status, text) {
        const statusIndicator = document.getElementById('scanner-status');
        const statusText = document.getElementById('scanner-status-text');
        
        statusIndicator.className = 'w-3 h-3 rounded-full ' + 
            (status === 'scanning' ? 'bg-green-400' : 
             status === 'error' ? 'bg-red-400' : 'bg-gray-400');
        
        statusText.textContent = text;
    }

    updateUI() {
        this.renderHistory();
    }

    showError(message) {
        const resultDiv = document.getElementById('scan-result');
        resultDiv.innerHTML = `
            <div class="text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>${message}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for HTML onclick handlers
function startCamera() {
    qrScanner.startCamera();
}

function stopCamera() {
    qrScanner.stopCamera();
}

function switchCamera() {
    qrScanner.switchCamera();
}

function toggleFlashlight() {
    qrScanner.toggleFlashlight();
}

function clearHistory() {
    qrScanner.clearHistory();
}

function removeHistoryItem(id) {
    qrScanner.removeHistoryItem(id);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.warn('Could not copy text:', err);
        });
    }
}

function shareQRData(data) {
    if (navigator.share) {
        navigator.share({
            title: 'QR Code Data',
            text: data
        }).catch(err => console.warn('Could not share:', err));
    } else {
        copyToClipboard(data);
    }
}

function showWiFiInfo(wifiData) {
    // Parse WiFi QR data
    const parts = wifiData.split(';');
    let ssid = '', password = '', security = '';
    
    parts.forEach(part => {
        if (part.startsWith('S:')) ssid = part.substring(2);
        if (part.startsWith('P:')) password = part.substring(2);
        if (part.startsWith('T:')) security = part.substring(2);
    });
    
    alert(`WiFi Information:\nNetwork: ${ssid}\nPassword: ${password}\nSecurity: ${security}`);
}

// Initialize when DOM is loaded
let qrScanner;
document.addEventListener('DOMContentLoaded', () => {
    qrScanner = new QRCodeScanner();
});
