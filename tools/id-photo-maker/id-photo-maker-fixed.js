// Real-time ID Photo Maker with Live Preview
class IDPhotoMaker {
    constructor() {
        this.currentImage = null;
        this.originalDimensions = { width: 0, height: 0 };
        this.selectedSize = { width: 35, height: 45 }; // Default passport size
        this.backgroundColor = 'white';
        this.position = { x: 50, y: 30 };
        this.zoom = 100;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.selectSizePreset(35, 45); // Default to passport
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Size presets
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const width = parseInt(e.currentTarget.dataset.width);
                const height = parseInt(e.currentTarget.dataset.height);
                this.selectSizePreset(width, height);
            });
        });

        // Custom size inputs
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        
        if (customWidth) {
            customWidth.addEventListener('input', (e) => this.updateCustomSize());
        }
        if (customHeight) {
            customHeight.addEventListener('input', (e) => this.updateCustomSize());
        }

        // Background options
        document.querySelectorAll('.bg-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectBackground(e.currentTarget.dataset.bg);
            });
        });

        // Position and zoom controls - trigger real-time preview
        const positionX = document.getElementById('position-x');
        const positionY = document.getElementById('position-y');
        const zoomLevel = document.getElementById('zoom-level');
        
        if (positionX) {
            positionX.addEventListener('input', (e) => {
                this.position.x = parseInt(e.target.value);
                const posXValue = document.getElementById('pos-x-value');
                if (posXValue) posXValue.textContent = e.target.value;
                this.updateLivePreview();
            });
        }
        
        if (positionY) {
            positionY.addEventListener('input', (e) => {
                this.position.y = parseInt(e.target.value);
                const posYValue = document.getElementById('pos-y-value');
                if (posYValue) posYValue.textContent = e.target.value;
                this.updateLivePreview();
            });
        }
        
        if (zoomLevel) {
            zoomLevel.addEventListener('input', (e) => {
                this.zoom = parseInt(e.target.value);
                const zoomValue = document.getElementById('zoom-value');
                if (zoomValue) zoomValue.textContent = e.target.value;
                this.updateLivePreview();
            });
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
                this.processFile(files[0]);
            }
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

    selectSizePreset(width, height) {
        this.selectedSize = { width, height };
        
        // Update UI
        document.querySelectorAll('.size-preset').forEach(preset => {
            if (parseInt(preset.dataset.width) === width && parseInt(preset.dataset.height) === height) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
        
        // Update custom inputs
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        if (customWidth) customWidth.value = width;
        if (customHeight) customHeight.value = height;
        
        // Update preview if image is loaded
        if (this.currentImage) {
            this.updateLivePreview();
        }
    }

    updateCustomSize() {
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        
        const width = parseInt(customWidth?.value) || this.selectedSize.width;
        const height = parseInt(customHeight?.value) || this.selectedSize.height;
        
        this.selectedSize = { width, height };
        
        // Remove active class from presets
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        
        // Update preview if image is loaded
        if (this.currentImage) {
            this.updateLivePreview();
        }
    }

    selectBackground(color) {
        this.backgroundColor = color;
        
        // Update UI
        document.querySelectorAll('.bg-option').forEach(option => {
            if (option.dataset.bg === color) {
                option.classList.add('border-purple-600', 'border-4');
            } else {
                option.classList.remove('border-purple-600', 'border-4');
            }
        });
        
        // Update preview if image is loaded
        if (this.currentImage) {
            this.updateLivePreview();
        }
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
        
        // Show download options
        const downloadOptions = document.getElementById('download-options');
        if (downloadOptions) downloadOptions.classList.remove('hidden');
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
                
                // Show original image
                originalContainer.innerHTML = `
                    <div class="space-y-3">
                        <img src="${e.target.result}" alt="Original Image" 
                             style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #8b5cf6;">
                        <div class="text-sm space-y-1 text-left">
                            <div class="flex justify-between">
                                <span class="text-gray-600">File:</span>
                                <span class="text-gray-800">${this.currentImage.name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Size:</span>
                                <span class="text-gray-800">${this.formatFileSize(this.currentImage.size)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Dimensions:</span>
                                <span class="text-gray-800">${img.width} × ${img.height}px</span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Show ID photo preview
                this.updateLivePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(this.currentImage);
    }

    updateLivePreview() {
        if (!this.currentImage) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.renderIDPhoto(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(this.currentImage);
    }

    renderIDPhoto(img) {
        const canvas = document.getElementById('photo-canvas');
        const photoDetails = document.getElementById('photo-details');
        
        if (!canvas || !photoDetails) return;

        const ctx = canvas.getContext('2d');
        
        // Calculate canvas size based on photo dimensions (300 DPI)
        const dpi = 300;
        const mmToInch = 0.0393701;
        const widthInches = this.selectedSize.width * mmToInch;
        const heightInches = this.selectedSize.height * mmToInch;
        
        const canvasWidth = Math.round(widthInches * dpi);
        const canvasHeight = Math.round(heightInches * dpi);
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Set display size (scaled down for preview)
        const maxDisplaySize = 250;
        const aspectRatio = canvasWidth / canvasHeight;
        let displayWidth, displayHeight;
        
        if (aspectRatio > 1) {
            displayWidth = Math.min(maxDisplaySize, canvasWidth);
            displayHeight = displayWidth / aspectRatio;
        } else {
            displayHeight = Math.min(maxDisplaySize, canvasHeight);
            displayWidth = displayHeight * aspectRatio;
        }
        
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // Fill background
        ctx.fillStyle = this.getBackgroundColor();
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate image positioning and scaling
        const zoomFactor = this.zoom / 100;
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight;
        if (imgAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas
            drawHeight = canvasHeight * zoomFactor;
            drawWidth = drawHeight * imgAspectRatio;
        } else {
            // Image is taller than canvas
            drawWidth = canvasWidth * zoomFactor;
            drawHeight = drawWidth / imgAspectRatio;
        }
        
        const offsetX = (canvasWidth - drawWidth) * (this.position.x / 100);
        const offsetY = (canvasHeight - drawHeight) * (this.position.y / 100);
        
        // Draw image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Store canvas data for download
        this.idPhotoData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Update photo details
        const estimatedSize = Math.round((this.idPhotoData.length * 3/4));
        photoDetails.innerHTML = `
            <div class="flex justify-between">
                <span class="text-gray-600">Size:</span>
                <span class="text-purple-600">${this.selectedSize.width} × ${this.selectedSize.height}mm</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Resolution:</span>
                <span class="text-purple-600">${canvasWidth} × ${canvasHeight}px</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">DPI:</span>
                <span class="text-purple-600">300</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Background:</span>
                <span class="text-purple-600">${this.backgroundColor}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Est. Size:</span>
                <span class="text-purple-600">${this.formatFileSize(estimatedSize)}</span>
            </div>
        `;
    }

    getBackgroundColor() {
        switch (this.backgroundColor) {
            case 'white': return '#ffffff';
            case 'blue': return '#3b82f6';
            case 'red': return '#ef4444';
            case 'gray': return '#6b7280';
            default: return '#ffffff';
        }
    }

    generatePrintLayout(count) {
        if (!this.idPhotoData) return;
        
        // Create a new canvas for print layout
        const printCanvas = document.createElement('canvas');
        const ctx = printCanvas.getContext('2d');
        
        // Standard 4x6 inch print size at 300 DPI
        const printWidth = 4 * 300; // 1200px
        const printHeight = 6 * 300; // 1800px
        printCanvas.width = printWidth;
        printCanvas.height = printHeight;
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, printWidth, printHeight);
        
        // Load the ID photo
        const img = new Image();
        img.onload = () => {
            // Calculate layout
            const cols = count === 1 ? 1 : (count <= 4 ? 2 : 3);
            const rows = Math.ceil(count / cols);
            
            const photoWidth = Math.floor(printWidth / cols * 0.8); // 80% of available space
            const photoHeight = Math.floor(printHeight / rows * 0.8);
            
            const spacingX = (printWidth - (photoWidth * cols)) / (cols + 1);
            const spacingY = (printHeight - (photoHeight * rows)) / (rows + 1);
            
            // Draw photos
            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                const x = spacingX + col * (photoWidth + spacingX);
                const y = spacingY + row * (photoHeight + spacingY);
                
                ctx.drawImage(img, x, y, photoWidth, photoHeight);
            }
            
            // Download print layout
            const printDataUrl = printCanvas.toDataURL('image/jpeg', 0.95);
            this.downloadImage(printDataUrl, `id_photos_${count}_layout.jpg`);
        };
        img.src = this.idPhotoData;
    }

    downloadPhoto(quality) {
        if (!this.idPhotoData) return;
        
        const fileName = `id_photo_${this.selectedSize.width}x${this.selectedSize.height}mm_${quality}.jpg`;
        
        if (quality === 'high') {
            // High quality (already at 300 DPI)
            this.downloadImage(this.idPhotoData, fileName);
        } else {
            // Web quality (72 DPI)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Scale down to 72 DPI
            const scaleFactor = 72 / 300;
            const originalCanvas = document.getElementById('photo-canvas');
            canvas.width = originalCanvas.width * scaleFactor;
            canvas.height = originalCanvas.height * scaleFactor;
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const webDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                this.downloadImage(webDataUrl, fileName);
            };
            img.src = this.idPhotoData;
        }
    }

    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
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

// Initialize the ID Photo Maker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.idPhotoMaker = new IDPhotoMaker();
});
