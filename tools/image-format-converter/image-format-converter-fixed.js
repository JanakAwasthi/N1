// Real-time Image Format Converter with Live Preview
class ImageFormatConverter {
    constructor() {
        this.selectedFiles = [];
        this.currentImageIndex = 0;
        this.selectedFormat = 'jpeg';
        this.quality = 90;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.selectFormat('jpeg'); // Default format
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Format selection buttons
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectFormat(e.currentTarget.dataset.format);
            });
        });

        // Quality slider - triggers real-time preview
        const qualitySlider = document.getElementById('quality-slider');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                this.quality = parseInt(e.target.value);
                const qualityValue = document.getElementById('quality-value');
                if (qualityValue) qualityValue.textContent = e.target.value + '%';
                
                // Update real-time preview immediately
                if (this.selectedFiles.length > 0) {
                    this.showLivePreview();
                }
            });
        }

        // Convert button
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.startConversion());
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlight drop area
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.processFiles(files);
            }
        });

        // Click to browse
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.click();
        });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        this.selectedFiles = files;
        this.currentImageIndex = 0;
        
        // Show the image queue if multiple files
        this.showImageQueue();
        
        // Show live preview immediately
        this.showLivePreview();
    }

    showImageQueue() {
        const imageQueue = document.getElementById('image-queue');
        const imageList = document.getElementById('image-list');
        
        if (!imageQueue || !imageList) return;

        if (this.selectedFiles.length > 1) {
            imageQueue.classList.remove('hidden');
            
            imageList.innerHTML = '';
            this.selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = `flex items-center justify-between p-2 rounded ${index === this.currentImageIndex ? 'bg-cyan-800' : 'bg-gray-700'} cursor-pointer`;
                item.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-image text-sm"></i>
                        <span class="text-sm">${file.name}</span>
                    </div>
                    <span class="text-xs text-gray-400">${this.formatFileSize(file.size)}</span>
                `;
                
                item.addEventListener('click', () => {
                    this.currentImageIndex = index;
                    this.showImageQueue(); // Refresh highlighting
                    this.showLivePreview(); // Update preview
                });
                
                imageList.appendChild(item);
            });
        } else {
            imageQueue.classList.add('hidden');
        }
    }

    selectFormat(format) {
        this.selectedFormat = format;
        
        // Update UI
        document.querySelectorAll('.format-option').forEach(option => {
            if (option.dataset.format === format) {
                option.classList.add('border-cyan-400', 'bg-cyan-900');
            } else {
                option.classList.remove('border-cyan-400', 'bg-cyan-900');
            }
        });
        
        // Update real-time preview if image is loaded
        if (this.selectedFiles.length > 0) {
            this.showLivePreview();
        }
    }

    showLivePreview() {
        const currentFile = this.selectedFiles[this.currentImageIndex];
        if (!currentFile) return;

        // Hide no-image state and show live preview
        const noImageState = document.getElementById('no-image-state');
        const livePreview = document.getElementById('live-preview');
        
        if (noImageState) noImageState.classList.add('hidden');
        if (livePreview) livePreview.classList.remove('hidden');

        // Show original image
        this.showOriginalImage(currentFile);
        
        // Show converted preview
        this.showConvertedPreview(currentFile);
    }

    showOriginalImage(file) {
        const originalContainer = document.getElementById('original-container');
        if (!originalContainer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            originalContainer.innerHTML = `
                <div class="space-y-3">
                    <img src="${e.target.result}" alt="Original Image" 
                         style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #00d4ff;">
                    <div class="text-sm space-y-1 text-left">
                        <div class="flex justify-between">
                            <span class="text-gray-400">File:</span>
                            <span class="text-white">${file.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Size:</span>
                            <span class="text-white">${this.formatFileSize(file.size)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Type:</span>
                            <span class="text-white">${file.type}</span>
                        </div>
                        <div class="flex justify-between" id="original-dimensions">
                            <span class="text-gray-400">Dimensions:</span>
                            <span class="text-white">Loading...</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Get and display dimensions
            const img = new Image();
            img.onload = () => {
                const dimensionsEl = document.getElementById('original-dimensions');
                if (dimensionsEl) {
                    dimensionsEl.innerHTML = `
                        <span class="text-gray-400">Dimensions:</span>
                        <span class="text-white">${img.width} × ${img.height}px</span>
                    `;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showConvertedPreview(file) {
        const convertedContainer = document.getElementById('converted-container');
        const conversionDetails = document.getElementById('conversion-details');
        
        if (!convertedContainer || !conversionDetails) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for conversion
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get converted image data
                let mimeType, quality;
                switch (this.selectedFormat) {
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        quality = this.quality / 100;
                        break;
                    case 'png':
                        mimeType = 'image/png';
                        quality = 1;
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        quality = this.quality / 100;
                        break;
                    default:
                        mimeType = 'image/jpeg';
                        quality = 0.9;
                }
                
                const convertedDataUrl = canvas.toDataURL(mimeType, quality);
                const estimatedSize = Math.round((convertedDataUrl.length * 3/4));
                const compressionRatio = file.size > estimatedSize ? 
                    Math.round(((file.size - estimatedSize) / file.size) * 100) : 0;
                
                // Show converted image
                convertedContainer.innerHTML = `
                    <img src="${convertedDataUrl}" alt="Converted Preview" 
                         style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #00ff88;">
                `;
                
                // Show conversion details
                conversionDetails.innerHTML = `
                    <div class="flex justify-between">
                        <span class="text-gray-400">Output Format:</span>
                        <span class="text-green-400">${this.selectedFormat.toUpperCase()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Quality:</span>
                        <span class="text-green-400">${this.quality}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Est. Size:</span>
                        <span class="text-green-400">${this.formatFileSize(estimatedSize)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Compression:</span>
                        <span class="text-green-400">${compressionRatio > 0 ? compressionRatio + '% smaller' : 'Similar size'}</span>
                    </div>
                    ${this.selectedFiles.length > 1 ? `
                    <div class="flex justify-between">
                        <span class="text-gray-400">Current:</span>
                        <span class="text-cyan-400">${this.currentImageIndex + 1} of ${this.selectedFiles.length}</span>
                    </div>
                    ` : ''}
                `;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async startConversion() {
        if (this.selectedFiles.length === 0) return;

        // Show progress
        this.showProgress();
        
        const convertedFiles = [];
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            this.updateProgress(`Converting ${file.name}...`, i, this.selectedFiles.length);
            
            try {
                const convertedBlob = await this.convertImage(file);
                const fileName = this.getConvertedFileName(file.name);
                convertedFiles.push({ blob: convertedBlob, name: fileName });
            } catch (error) {
                console.error('Conversion failed:', error);
            }
            
            // Small delay for UI updates
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Show results
        this.showResults(convertedFiles);
    }

    showProgress() {
        const progressSection = document.getElementById('progress-section');
        const resultsSection = document.getElementById('results-section');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
    }

    updateProgress(text, current, total) {
        const progressText = document.getElementById('progress-text');
        const progressBar = document.getElementById('progress-bar');
        
        if (progressText) progressText.textContent = text;
        if (progressBar) {
            const percentage = Math.round((current / total) * 100);
            progressBar.style.width = percentage + '%';
        }
    }

    async convertImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    let mimeType, quality;
                    switch (this.selectedFormat) {
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            quality = this.quality / 100;
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            quality = 1;
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            quality = this.quality / 100;
                            break;
                        default:
                            mimeType = 'image/jpeg';
                            quality = 0.9;
                    }
                    
                    canvas.toBlob(resolve, mimeType, quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getConvertedFileName(originalName) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
        const extension = this.selectedFormat === 'jpeg' ? 'jpg' : this.selectedFormat;
        return `${nameWithoutExt}_converted.${extension}`;
    }

    showResults(convertedFiles) {
        const progressSection = document.getElementById('progress-section');
        const resultsSection = document.getElementById('results-section');
        const resultsList = document.getElementById('results-list');
        const downloadAllBtn = document.getElementById('download-all-btn');
        
        if (progressSection) progressSection.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');
        
        if (resultsList) {
            resultsList.innerHTML = '';
            convertedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3 bg-gray-800 rounded-lg';
                item.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-file-image text-green-400"></i>
                        <span class="text-white">${file.name}</span>
                        <span class="text-gray-400 text-sm">${this.formatFileSize(file.blob.size)}</span>
                    </div>
                    <button onclick="window.formatConverter.downloadSingle(${index})" class="download-btn">
                        <i class="fas fa-download mr-1"></i>Download
                    </button>
                `;
                resultsList.appendChild(item);
            });
        }
        
        if (downloadAllBtn && convertedFiles.length > 1) {
            downloadAllBtn.classList.remove('hidden');
        }
        
        this.convertedFiles = convertedFiles;
        window.formatConverter = this; // Make accessible for download buttons
    }

    downloadSingle(index) {
        const file = this.convertedFiles[index];
        if (file) {
            const url = URL.createObjectURL(file.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    async downloadAll() {
        // Implementation for ZIP download would go here
        // For now, download files individually
        this.convertedFiles.forEach((file, index) => {
            setTimeout(() => this.downloadSingle(index), index * 200);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        // For values less than 1 MB, show KB with 1 decimal place
        // For values 1 MB and above, show MB with 2 decimal places
        if (i < 2) {
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        } else {
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.formatConverter = new ImageFormatConverter();
});
