/**
 * Enhanced QR Code Scanner with Multiple Input Methods
 * Supports camera scanning, file upload, and drag & drop
 */

class EnhancedQRScanner {
    constructor() {
        this.stream = null;
        this.scanner = null;
        this.isScanning = false;
        this.scanHistory = [];
        this.codeReader = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadScanHistory();
        this.initializeScanner();
    }

    initializeScanner() {
        // Initialize ZXing browser code reader
        if (typeof ZXing !== 'undefined') {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
        } else {
            console.warn('ZXing library not loaded');
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.scanner-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Camera controls
        document.getElementById('start-camera').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera').addEventListener('click', () => this.stopCamera());
        document.getElementById('switch-camera').addEventListener('click', () => this.switchCamera());
        document.getElementById('toggle-flashlight').addEventListener('click', () => this.toggleFlashlight());

        // File upload
        document.getElementById('qr-file-input').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('qr-file-input').click();
        });

        // Drag and drop
        this.setupDragAndDrop();

        // URL input
        document.getElementById('image-url').addEventListener('input', () => this.handleURLInput());
        document.getElementById('scan-url-btn').addEventListener('click', () => this.scanFromURL());

        // History
        document.getElementById('clear-scan-history').addEventListener('click', () => this.clearHistory());

        // Settings
        document.getElementById('scan-format').addEventListener('change', () => this.updateScanSettings());
        document.getElementById('scan-area').addEventListener('change', () => this.updateScanArea());
        document.getElementById('beep-sound').addEventListener('change', () => this.updateSoundSettings());
        document.getElementById('auto-copy').addEventListener('change', () => this.updateAutoSettings());

        // Result actions
        document.getElementById('copy-result').addEventListener('click', () => this.copyResult());
        document.getElementById('open-result').addEventListener('click', () => this.openResult());
        document.getElementById('share-result').addEventListener('click', () => this.shareResult());
        document.getElementById('search-result').addEventListener('click', () => this.searchResult());
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            this.processImageFile(imageFile);
        } else {
            this.showError('Please drop a valid image file');
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.scanner-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.scanner-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab content
        document.getElementById(`${tabName}-scanner`).classList.remove('hidden');

        // Add active class to clicked tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Stop camera if switching away from camera tab
        if (tabName !== 'camera' && this.isScanning) {
            this.stopCamera();
        }
    }

    async startCamera() {
        try {
            this.showLoading('Starting camera...');

            // Check camera permissions
            const permission = await navigator.permissions.query({ name: 'camera' });
            if (permission.state === 'denied') {
                throw new Error('Camera permission denied');
            }

            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                throw new Error('No camera found');
            }

            // Update camera selector
            this.updateCameraSelector(videoDevices);

            // Get preferred camera
            const selectedCamera = document.getElementById('camera-select').value || videoDevices[0].deviceId;

            // Start video stream
            const constraints = {
                video: {
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { ideal: 'environment' }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('camera-video');
            video.srcObject = this.stream;
            video.play();

            // Start scanning
            this.startScanning();

            // Update UI
            document.getElementById('camera-status').textContent = 'Camera active';
            document.getElementById('camera-status').className = 'text-green-500';
            document.getElementById('start-camera').classList.add('hidden');
            document.getElementById('stop-camera').classList.remove('hidden');
            document.getElementById('switch-camera').classList.remove('hidden');

            this.hideLoading();

        } catch (error) {
            console.error('Error starting camera:', error);
            this.hideLoading();
            this.showError(`Failed to start camera: ${error.message}`);
        }
    }

    async stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.codeReader) {
            this.codeReader.reset();
        }

        this.isScanning = false;

        // Update UI
        document.getElementById('camera-status').textContent = 'Camera stopped';
        document.getElementById('camera-status').className = 'text-gray-500';
        document.getElementById('start-camera').classList.remove('hidden');
        document.getElementById('stop-camera').classList.add('hidden');
        document.getElementById('switch-camera').classList.add('hidden');

        const video = document.getElementById('camera-video');
        video.srcObject = null;
    }

    async switchCamera() {
        const cameraSelect = document.getElementById('camera-select');
        const currentCamera = cameraSelect.value;
        
        // Get next camera
        const options = Array.from(cameraSelect.options);
        const currentIndex = options.findIndex(option => option.value === currentCamera);
        const nextIndex = (currentIndex + 1) % options.length;
        cameraSelect.value = options[nextIndex].value;

        // Restart camera with new selection
        await this.stopCamera();
        await this.startCamera();
    }

    async toggleFlashlight() {
        if (!this.stream) return;

        try {
            const videoTrack = this.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();

            if (capabilities.torch) {
                const settings = videoTrack.getSettings();
                const newTorchState = !settings.torch;
                
                await videoTrack.applyConstraints({
                    advanced: [{ torch: newTorchState }]
                });

                const flashBtn = document.getElementById('toggle-flashlight');
                flashBtn.textContent = newTorchState ? '🔦 Flashlight On' : '🔦 Flashlight Off';
                flashBtn.classList.toggle('bg-yellow-500', newTorchState);
            } else {
                this.showError('Flashlight not supported on this device');
            }
        } catch (error) {
            console.error('Error toggling flashlight:', error);
            this.showError('Failed to toggle flashlight');
        }
    }

    updateCameraSelector(devices) {
        const select = document.getElementById('camera-select');
        select.innerHTML = '';

        devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            select.appendChild(option);
        });
    }

    startScanning() {
        if (!this.codeReader) {
            this.showError('Scanner not initialized');
            return;
        }

        this.isScanning = true;
        const video = document.getElementById('camera-video');

        // Start continuous scanning
        this.codeReader.decodeFromVideoDevice(undefined, video, (result, error) => {
            if (result) {
                this.handleScanResult(result.text, 'camera');
                this.playBeepSound();
            }

            if (error && error.name !== 'NotFoundException') {
                console.error('Scan error:', error);
            }
        });

        // Draw scan overlay
        this.drawScanOverlay();
    }

    drawScanOverlay() {
        const video = document.getElementById('camera-video');
        const overlay = document.getElementById('scan-overlay');
        
        if (!overlay) return;

        const scanArea = document.getElementById('scan-area').value;
        let overlaySize = '200px';
        
        switch (scanArea) {
            case 'small': overlaySize = '150px'; break;
            case 'medium': overlaySize = '200px'; break;
            case 'large': overlaySize = '300px'; break;
            case 'full': overlaySize = '90%'; break;
        }

        overlay.style.width = overlaySize;
        overlay.style.height = overlaySize;
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        } else {
            this.showError('Please select a valid image file');
        }
    }

    async processImageFile(file) {
        try {
            this.showLoading('Scanning image...');

            const img = new Image();
            img.onload = async () => {
                try {
                    // Create canvas for processing
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);

                    // Show preview
                    document.getElementById('upload-preview').src = canvas.toDataURL();
                    document.getElementById('upload-preview').classList.remove('hidden');

                    // Scan for QR codes
                    if (this.codeReader) {
                        const result = await this.codeReader.decodeFromImageElement(img);
                        this.handleScanResult(result.text, 'upload');
                    } else {
                        // Fallback: try multiple scanning methods
                        await this.scanImageWithFallback(canvas);
                    }

                } catch (error) {
                    console.error('Error processing image:', error);
                    this.showError('No QR code found in image');
                }
                this.hideLoading();
            };

            img.onerror = () => {
                this.hideLoading();
                this.showError('Failed to load image');
            };

            img.src = URL.createObjectURL(file);

        } catch (error) {
            console.error('Error processing file:', error);
            this.hideLoading();
            this.showError('Failed to process image file');
        }
    }

    async scanImageWithFallback(canvas) {
        // Try different scanning libraries/methods as fallback
        try {
            // Method 1: Try with jsQR if available
            if (typeof jsQR !== 'undefined') {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    this.handleScanResult(code.data, 'upload');
                    return;
                }
            }

            // Method 2: Try different preprocessing
            await this.tryPreprocessedScanning(canvas);

        } catch (error) {
            throw new Error('No QR code detected');
        }
    }

    async tryPreprocessedScanning(canvas) {
        const ctx = canvas.getContext('2d');
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Try different image processing techniques
        const techniques = [
            { name: 'original', process: (data) => data },
            { name: 'contrast', process: (data) => this.adjustContrast(data, 1.5) },
            { name: 'brightness', process: (data) => this.adjustBrightness(data, 20) },
            { name: 'grayscale', process: (data) => this.toGrayscale(data) }
        ];

        for (const technique of techniques) {
            try {
                const processedData = technique.process(originalImageData);
                ctx.putImageData(processedData, 0, 0);

                if (this.codeReader) {
                    const result = await this.codeReader.decodeFromCanvas(canvas);
                    this.handleScanResult(result.text, 'upload');
                    return;
                }
            } catch (error) {
                // Continue to next technique
                console.log(`Technique ${technique.name} failed:`, error);
            }
        }

        throw new Error('No QR code found with any processing technique');
    }

    adjustContrast(imageData, contrast) {
        const data = new Uint8ClampedArray(imageData.data);
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // red
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // green
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // blue
        }

        return new ImageData(data, imageData.width, imageData.height);
    }

    adjustBrightness(imageData, brightness) {
        const data = new Uint8ClampedArray(imageData.data);

        for (let i = 0; i < data.length; i += 4) {
            data[i] += brightness;     // red
            data[i + 1] += brightness; // green
            data[i + 2] += brightness; // blue
        }

        return new ImageData(data, imageData.width, imageData.height);
    }

    toGrayscale(imageData) {
        const data = new Uint8ClampedArray(imageData.data);

        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // red
            data[i + 1] = gray; // green
            data[i + 2] = gray; // blue
        }

        return new ImageData(data, imageData.width, imageData.height);
    }

    handleURLInput() {
        const url = document.getElementById('image-url').value.trim();
        const scanBtn = document.getElementById('scan-url-btn');
        
        if (url && this.isValidImageURL(url)) {
            scanBtn.disabled = false;
            scanBtn.classList.remove('opacity-50');
        } else {
            scanBtn.disabled = true;
            scanBtn.classList.add('opacity-50');
        }
    }

    isValidImageURL(url) {
        try {
            new URL(url);
            return /\\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url) || url.includes('image');
        } catch {
            return false;
        }
    }

    async scanFromURL() {
        const url = document.getElementById('image-url').value.trim();
        
        if (!url) {
            this.showError('Please enter an image URL');
            return;
        }

        try {
            this.showLoading('Loading image from URL...');

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = async () => {
                try {
                    // Show preview
                    document.getElementById('url-preview').src = url;
                    document.getElementById('url-preview').classList.remove('hidden');

                    // Scan the image
                    if (this.codeReader) {
                        const result = await this.codeReader.decodeFromImageElement(img);
                        this.handleScanResult(result.text, 'url');
                    } else {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        await this.scanImageWithFallback(canvas);
                    }

                } catch (error) {
                    this.showError('No QR code found in the image');
                }
                this.hideLoading();
            };

            img.onerror = () => {
                this.hideLoading();
                this.showError('Failed to load image from URL');
            };

            img.src = url;

        } catch (error) {
            console.error('Error scanning from URL:', error);
            this.hideLoading();
            this.showError('Failed to scan image from URL');
        }
    }

    handleScanResult(data, source) {
        if (!data) return;

        // Show result
        this.displayResult(data, source);

        // Add to history
        this.addToHistory(data, source);

        // Auto-copy if enabled
        if (document.getElementById('auto-copy').checked) {
            this.copyToClipboard(data);
        }

        // Show success notification
        this.showSuccess('QR code scanned successfully!');
    }

    displayResult(data, source) {
        const resultSection = document.getElementById('scan-result');
        const resultText = document.getElementById('result-text');
        const resultType = document.getElementById('result-type');
        const resultSource = document.getElementById('result-source');

        resultText.textContent = data;
        resultType.textContent = this.detectDataType(data);
        resultSource.textContent = source.toUpperCase();

        resultSection.classList.remove('hidden');

        // Store current result for actions
        this.currentResult = data;
    }

    detectDataType(data) {
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
        } else if (data.startsWith('geo:')) {
            return 'Location';
        } else if (data.startsWith('BEGIN:VCARD')) {
            return 'Contact';
        } else if (data.startsWith('BEGIN:VEVENT')) {
            return 'Event';
        } else if (data.startsWith('bitcoin:')) {
            return 'Bitcoin';
        } else {
            return 'Text';
        }
    }

    addToHistory(data, source) {
        const item = {
            id: Date.now(),
            data: data,
            type: this.detectDataType(data),
            source: source,
            timestamp: new Date().toISOString()
        };

        this.scanHistory.unshift(item);

        // Keep only last 50 items
        if (this.scanHistory.length > 50) {
            this.scanHistory = this.scanHistory.slice(0, 50);
        }

        this.saveScanHistory();
        this.updateHistoryDisplay();
    }

    loadScanHistory() {
        const saved = localStorage.getItem('scanHistory');
        if (saved) {
            this.scanHistory = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    saveScanHistory() {
        localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
    }

    updateHistoryDisplay() {
        const container = document.getElementById('scan-history');
        container.innerHTML = '';

        this.scanHistory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item p-3 border rounded-lg hover:bg-gray-50';
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${item.type}</span>
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${item.source.toUpperCase()}</span>
                        </div>
                        <div class="text-sm text-gray-900 truncate mb-1">${item.data}</div>
                        <div class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="flex space-x-1 ml-2">
                        <button onclick="qrScanner.copyToClipboard('${item.data.replace(/'/g, "\\'")}')" 
                                class="text-xs text-blue-600 hover:text-blue-800">Copy</button>
                        <button onclick="qrScanner.deleteHistoryItem(${index})" 
                                class="text-xs text-red-600 hover:text-red-800">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    deleteHistoryItem(index) {
        this.scanHistory.splice(index, 1);
        this.saveScanHistory();
        this.updateHistoryDisplay();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all scan history?')) {
            this.scanHistory = [];
            this.saveScanHistory();
            this.updateHistoryDisplay();
        }
    }

    updateScanSettings() {
        // Update scanner settings based on format selection
        const format = document.getElementById('scan-format').value;
        
        if (this.codeReader && format !== 'all') {
            // Configure scanner for specific format
            console.log(`Scanner configured for: ${format}`);
        }
    }

    updateScanArea() {
        if (this.isScanning) {
            this.drawScanOverlay();
        }
    }

    updateSoundSettings() {
        // Sound settings updated
    }

    updateAutoSettings() {
        // Auto-copy settings updated
    }

    playBeepSound() {
        if (document.getElementById('beep-sound').checked) {
            // Create and play beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }

    // Result actions
    copyResult() {
        if (this.currentResult) {
            this.copyToClipboard(this.currentResult);
        }
    }

    openResult() {
        if (this.currentResult) {
            const type = this.detectDataType(this.currentResult);
            
            if (type === 'URL') {
                window.open(this.currentResult, '_blank');
            } else if (type === 'Email') {
                window.location.href = this.currentResult;
            } else if (type === 'Phone') {
                window.location.href = this.currentResult;
            } else {
                this.showError('Cannot open this type of content');
            }
        }
    }

    shareResult() {
        if (this.currentResult && navigator.share) {
            navigator.share({
                title: 'QR Code Result',
                text: this.currentResult
            }).catch(err => console.log('Error sharing:', err));
        } else {
            this.copyToClipboard(this.currentResult);
            this.showSuccess('Result copied to clipboard for sharing!');
        }
    }

    searchResult() {
        if (this.currentResult) {
            const searchURL = `https://www.google.com/search?q=${encodeURIComponent(this.currentResult)}`;
            window.open(searchURL, '_blank');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    showLoading(message) {
        const loading = document.getElementById('scanner-loading');
        loading.querySelector('p').textContent = message;
        loading.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('scanner-loading').classList.add('hidden');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.qrScanner = new EnhancedQRScanner();
});
