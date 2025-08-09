// Real-time Image Resizer with Live Preview
class ImageResizer {
    constructor() {
        this.currentImage = null;
        this.originalDimensions = { width: 0, height: 0 };
        this.quality = 90;
        this.maintainAspect = true;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('image-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Dimension inputs - trigger real-time preview
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        
        if (widthInput) {
            widthInput.addEventListener('input', (e) => this.handleDimensionChange('width', e.target.value));
        }
        
        if (heightInput) {
            heightInput.addEventListener('input', (e) => this.handleDimensionChange('height', e.target.value));
        }

        // Maintain aspect ratio checkbox
        const maintainAspectCheckbox = document.getElementById('maintain-aspect');
        if (maintainAspectCheckbox) {
            maintainAspectCheckbox.addEventListener('change', (e) => {
                this.maintainAspect = e.target.checked;
                if (this.currentImage) {
                    this.updateLivePreview();
                }
            });
        }

        // Quality slider - triggers real-time preview
        const qualitySlider = document.getElementById('quality');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                this.quality = parseInt(e.target.value);
                const qualityValue = document.getElementById('quality-value');
                if (qualityValue) qualityValue.textContent = e.target.value + '%';
                
                // Update real-time preview immediately
                if (this.currentImage) {
                    this.updateLivePreview();
                }
            });
        }

        // Apply resize button
        const resizeBtn = document.getElementById('resize-btn');
        if (resizeBtn) {
            resizeBtn.addEventListener('click', () => this.applyResize());
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropzone');
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
                this.processFile(files[0]);
            }
        });

        // Click to browse
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('image-input');
            if (fileInput) fileInput.click();
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processFile(file);
        }
    }

    processFile(file) {
        this.currentImage = file;
        this.showLivePreview();
    }

    showLivePreview() {
        if (!this.currentImage) return;

        // Hide no-image state and show live preview
        const noImageState = document.getElementById('no-image-state');
        const livePreview = document.getElementById('live-preview');
        
        if (noImageState) noImageState.classList.add('hidden');
        if (livePreview) livePreview.classList.remove('hidden');

        // Show original image
        this.showOriginalImage();
    }

    showOriginalImage() {
        const originalContainer = document.getElementById('original-container');
        if (!originalContainer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Store original dimensions
                this.originalDimensions = { width: img.width, height: img.height };
                
                // Set default values in input fields
                const widthInput = document.getElementById('width');
                const heightInput = document.getElementById('height');
                if (widthInput) widthInput.value = img.width;
                if (heightInput) heightInput.value = img.height;
                
                // Show original image
                originalContainer.innerHTML = `
                    <div class="space-y-3">
                        <img src="${e.target.result}" alt="Original Image" 
                             style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #00d4ff;">
                        <div class="text-sm space-y-1 text-left">
                            <div class="flex justify-between">
                                <span class="text-gray-400">File:</span>
                                <span class="text-white">${this.currentImage.name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Size:</span>
                                <span class="text-white">${this.formatFileSize(this.currentImage.size)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Type:</span>
                                <span class="text-white">${this.currentImage.type}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Dimensions:</span>
                                <span class="text-white">${img.width} × ${img.height}px</span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Show initial resized preview
                this.updateLivePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(this.currentImage);
    }

    handleDimensionChange(dimension, value) {
        if (!this.currentImage || !this.maintainAspect) {
            this.updateLivePreview();
            return;
        }

        // Calculate aspect ratio and update the other dimension
        const aspectRatio = this.originalDimensions.width / this.originalDimensions.height;
        
        if (dimension === 'width' && value) {
            const newHeight = Math.round(value / aspectRatio);
            const heightInput = document.getElementById('height');
            if (heightInput) heightInput.value = newHeight;
        } else if (dimension === 'height' && value) {
            const newWidth = Math.round(value * aspectRatio);
            const widthInput = document.getElementById('width');
            if (widthInput) widthInput.value = newWidth;
        }
        
        this.updateLivePreview();
    }

    updateLivePreview() {
        if (!this.currentImage) return;

        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        
        const targetWidth = parseInt(widthInput?.value) || this.originalDimensions.width;
        const targetHeight = parseInt(heightInput?.value) || this.originalDimensions.height;
        
        this.showResizedPreview(targetWidth, targetHeight);
    }

    showResizedPreview(targetWidth, targetHeight) {
        const resizedContainer = document.getElementById('resized-container');
        const resizeDetails = document.getElementById('resize-details');
        
        if (!resizedContainer || !resizeDetails) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                // Get resized image data
                const resizedDataUrl = canvas.toDataURL('image/jpeg', this.quality / 100);
                const estimatedSize = Math.round((resizedDataUrl.length * 3/4));
                
                // Calculate compression and scaling info
                const scaleX = ((targetWidth / this.originalDimensions.width) * 100).toFixed(1);
                const scaleY = ((targetHeight / this.originalDimensions.height) * 100).toFixed(1);
                const sizeReduction = this.currentImage.size > estimatedSize ? 
                    ((this.currentImage.size - estimatedSize) / this.currentImage.size * 100).toFixed(1) : 0;
                
                // Show resized image
                resizedContainer.innerHTML = `
                    <img src="${resizedDataUrl}" alt="Resized Preview" 
                         style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #00ff88;">
                `;
                
                // Show resize details
                resizeDetails.innerHTML = `
                    <div class="flex justify-between">
                        <span class="text-gray-400">New Dimensions:</span>
                        <span class="text-green-400">${targetWidth} × ${targetHeight}px</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Scale Factor:</span>
                        <span class="text-green-400">${scaleX}% × ${scaleY}%</span>
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
                        <span class="text-gray-400">Size Reduction:</span>
                        <span class="text-green-400">${sizeReduction > 0 ? sizeReduction + '% smaller' : 'Similar size'}</span>
                    </div>
                `;
                
                // Store resized data for download
                this.resizedImageData = resizedDataUrl;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(this.currentImage);
    }

    applyResize() {
        if (!this.currentImage) return;

        // Show progress
        this.showProgress();
        
        // Perform the actual resize (same as preview)
        this.updateLivePreview();
        
        // Show download option
        setTimeout(() => {
            this.showDownloadOption();
        }, 500);
    }

    showProgress() {
        const progressSection = document.getElementById('progress-section');
        const progressText = document.getElementById('progress-text');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (progressText) progressText.textContent = 'Applying resize...';
        
        // Simulate progress
        setTimeout(() => {
            if (progressSection) progressSection.classList.add('hidden');
        }, 500);
    }

    showDownloadOption() {
        const downloadSection = document.getElementById('download-section');
        if (downloadSection) downloadSection.classList.remove('hidden');
        
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadResizedImage();
        }
    }

    downloadResizedImage() {
        if (!this.resizedImageData) return;
        
        // Convert data URL to blob
        const arr = this.resizedImageData.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        const blob = new Blob([u8arr], { type: mime });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getResizedFileName();
        a.click();
        URL.revokeObjectURL(url);
    }

    getResizedFileName() {
        if (!this.currentImage) return 'resized_image.jpg';
        
        const nameWithoutExt = this.currentImage.name.replace(/\.[^/.]+$/, "");
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        const width = widthInput?.value || this.originalDimensions.width;
        const height = heightInput?.value || this.originalDimensions.height;
        
        return `${nameWithoutExt}_${width}x${height}.jpg`;
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

// Initialize the resizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.imageResizer = new ImageResizer();
});
