// Enhanced ID Photo Maker with Advanced Features
class AdvancedIDPhotoMaker {
    constructor() {
        this.currentImage = null;
        this.originalDimensions = { width: 0, height: 0 };
        this.selectedSize = { width: 35, height: 45, name: 'Passport' };
        this.backgroundColor = '#ffffff';
        this.position = { x: 50, y: 30 };
        this.zoom = 100;
        this.brightness = 0;
        this.contrast = 0;
        this.saturation = 0;
        this.photoCount = 1;
        this.orientation = 'portrait';
        this.borderWidth = 0;
        this.borderColor = '#000000';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.selectSizePreset(35, 45, 'Passport');
        this.initializeCanvas();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial canvas size
        this.updateCanvasSize();
    }

    setupEventListeners() {
        // File input and click to browse
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-btn');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        if (browseBtn) {
            browseBtn.addEventListener('click', () => fileInput.click());
        }

        // Size presets
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const width = parseInt(e.currentTarget.dataset.width);
                const height = parseInt(e.currentTarget.dataset.height);
                const name = e.currentTarget.dataset.name;
                this.selectSizePreset(width, height, name);
            });
        });

        // Custom size inputs
        this.setupCustomSizeListeners();

        // Background options
        this.setupBackgroundListeners();

        // Position and adjustment controls
        this.setupAdjustmentListeners();

        // Photo options
        this.setupPhotoOptionsListeners();

        // Action buttons
        this.setupActionButtons();

        // Orientation toggle
        document.getElementById('orientation-toggle')?.addEventListener('click', () => {
            this.toggleOrientation();
        });
    }

    setupCustomSizeListeners() {
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        const unit = document.getElementById('size-unit');
        
        [customWidth, customHeight, unit].forEach(element => {
            if (element) {
                element.addEventListener('input', () => this.updateCustomSize());
            }
        });
    }

    setupBackgroundListeners() {
        // Preset backgrounds
        document.querySelectorAll('.bg-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectBackground(e.currentTarget.dataset.bg);
            });
        });

        // Custom color picker
        const customBgColor = document.getElementById('custom-bg-color');
        if (customBgColor) {
            customBgColor.addEventListener('input', (e) => {
                this.backgroundColor = e.target.value;
                this.updateLivePreview();
            });
        }

        // Background image upload
        const bgImageInput = document.getElementById('bg-image-input');
        if (bgImageInput) {
            bgImageInput.addEventListener('change', (e) => this.handleBackgroundImage(e));
        }
    }

    setupAdjustmentListeners() {
        // Position controls
        const positionX = document.getElementById('position-x');
        const positionY = document.getElementById('position-y');
        const zoomLevel = document.getElementById('zoom-level');
        
        if (positionX) {
            positionX.addEventListener('input', (e) => {
                this.position.x = parseInt(e.target.value);
                document.getElementById('pos-x-value').textContent = e.target.value + '%';
                this.updateLivePreview();
            });
        }
        
        if (positionY) {
            positionY.addEventListener('input', (e) => {
                this.position.y = parseInt(e.target.value);
                document.getElementById('pos-y-value').textContent = e.target.value + '%';
                this.updateLivePreview();
            });
        }
        
        if (zoomLevel) {
            zoomLevel.addEventListener('input', (e) => {
                this.zoom = parseInt(e.target.value);
                document.getElementById('zoom-value').textContent = e.target.value + '%';
                this.updateLivePreview();
            });
        }

        // Image enhancement controls
        const brightness = document.getElementById('brightness');
        const contrast = document.getElementById('contrast');
        const saturation = document.getElementById('saturation');
        
        if (brightness) {
            brightness.addEventListener('input', (e) => {
                this.brightness = parseInt(e.target.value);
                document.getElementById('brightness-value').textContent = e.target.value;
                this.updateLivePreview();
            });
        }
        
        if (contrast) {
            contrast.addEventListener('input', (e) => {
                this.contrast = parseInt(e.target.value);
                document.getElementById('contrast-value').textContent = e.target.value;
                this.updateLivePreview();
            });
        }
        
        if (saturation) {
            saturation.addEventListener('input', (e) => {
                this.saturation = parseInt(e.target.value);
                document.getElementById('saturation-value').textContent = e.target.value;
                this.updateLivePreview();
            });
        }

        // Border controls
        const borderWidth = document.getElementById('border-width');
        const borderColor = document.getElementById('border-color');
        
        if (borderWidth) {
            borderWidth.addEventListener('input', (e) => {
                this.borderWidth = parseInt(e.target.value);
                document.getElementById('border-width-value').textContent = e.target.value + 'px';
                this.updateLivePreview();
            });
        }
        
        if (borderColor) {
            borderColor.addEventListener('input', (e) => {
                this.borderColor = e.target.value;
                this.updateLivePreview();
            });
        }
    }

    setupPhotoOptionsListeners() {
        const photoCount = document.getElementById('photo-count');
        const photoLayout = document.getElementById('photo-layout');
        
        if (photoCount) {
            photoCount.addEventListener('input', (e) => {
                this.photoCount = parseInt(e.target.value);
                document.getElementById('photo-count-value').textContent = e.target.value;
                this.updateLivePreview();
            });
        }
        
        if (photoLayout) {
            photoLayout.addEventListener('change', () => {
                this.updateLivePreview();
            });
        }
    }

    setupActionButtons() {
        // Reset button
        document.getElementById('reset-adjustments')?.addEventListener('click', () => {
            this.resetAdjustments();
        });

        // Download buttons
        document.getElementById('download-jpg')?.addEventListener('click', () => {
            this.downloadPhoto('jpeg');
        });
        
        document.getElementById('download-png')?.addEventListener('click', () => {
            this.downloadPhoto('png');
        });
        
        document.getElementById('download-pdf')?.addEventListener('click', () => {
            this.downloadPhotoPDF();
        });

        // Print button
        document.getElementById('print-photo')?.addEventListener('click', () => {
            this.printPhoto();
        });

        // Auto-enhance button
        document.getElementById('auto-enhance')?.addEventListener('click', () => {
            this.autoEnhance();
        });
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
        dropZone.addEventListener('click', () => document.getElementById('file-input').click());
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

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        } else {
            this.showError('Please select a valid image file');
        }
    }

    async processImageFile(file) {
        try {
            this.showLoading('Processing image...');
            
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.originalDimensions = { width: img.width, height: img.height };
                
                // Show photo editing section
                document.getElementById('photo-editor').classList.remove('hidden');
                document.getElementById('drop-zone').classList.add('hidden');
                
                // Reset adjustments
                this.resetAdjustments();
                
                // Update preview
                this.updateLivePreview();
                
                // Show image info
                this.updateImageInfo();
                
                this.hideLoading();
                this.showSuccess('Image loaded successfully!');
            };
            
            img.onerror = () => {
                this.hideLoading();
                this.showError('Failed to load image');
            };
            
            img.src = URL.createObjectURL(file);
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.hideLoading();
            this.showError('Failed to process image');
        }
    }

    updateImageInfo() {
        const info = document.getElementById('image-info');
        if (info && this.currentImage) {
            const fileSizeKB = Math.round(this.currentImage.src.length * 0.75 / 1024); // Rough estimate
            info.innerHTML = `
                <div class="text-sm text-gray-600">
                    <span>Original: ${this.originalDimensions.width} × ${this.originalDimensions.height}</span>
                    <span class="mx-2">•</span>
                    <span>Size: ~${fileSizeKB} KB</span>
                </div>
            `;
        }
    }

    selectSizePreset(width, height, name) {
        this.selectedSize = { width, height, name };
        
        // Update UI
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.classList.remove('selected');
        });
        
        const selectedPreset = document.querySelector(`[data-width=\"${width}\"][data-height=\"${height}\"]`);
        if (selectedPreset) {
            selectedPreset.classList.add('selected');
        }
        
        // Update custom inputs
        document.getElementById('custom-width').value = width;
        document.getElementById('custom-height').value = height;
        
        // Update canvas size and preview
        this.updateCanvasSize();
        this.updateLivePreview();
        
        // Show current size info
        this.updateSizeInfo();
    }

    updateCustomSize() {
        const width = parseFloat(document.getElementById('custom-width').value);
        const height = parseFloat(document.getElementById('custom-height').value);
        const unit = document.getElementById('size-unit').value;
        
        if (width > 0 && height > 0) {
            this.selectedSize = { width, height, name: 'Custom' };
            
            // Remove selection from presets
            document.querySelectorAll('.size-preset').forEach(preset => {
                preset.classList.remove('selected');
            });
            
            this.updateCanvasSize();
            this.updateLivePreview();
            this.updateSizeInfo();
        }
    }

    updateSizeInfo() {
        const info = document.getElementById('size-info');
        if (info) {
            const unit = document.getElementById('size-unit').value;
            info.innerHTML = `
                <div class="text-sm text-gray-600">
                    Current: ${this.selectedSize.width} × ${this.selectedSize.height} ${unit}
                    ${this.selectedSize.name ? `(${this.selectedSize.name})` : ''}
                </div>
            `;
        }
    }

    selectBackground(bg) {
        // Update selected background
        document.querySelectorAll('.bg-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedBg = document.querySelector(`[data-bg=\"${bg}\"]`);
        if (selectedBg) {
            selectedBg.classList.add('selected');
        }
        
        // Set background color
        const bgColors = {
            'white': '#ffffff',
            'blue': '#e6f3ff',
            'red': '#ffe6e6',
            'gray': '#f5f5f5'
        };
        
        this.backgroundColor = bgColors[bg] || bg;
        this.updateLivePreview();
    }

    handleBackgroundImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.updateLivePreview();
            };
            img.src = URL.createObjectURL(file);
        }
    }

    toggleOrientation() {
        // Swap width and height
        const temp = this.selectedSize.width;
        this.selectedSize.width = this.selectedSize.height;
        this.selectedSize.height = temp;
        
        // Update inputs
        document.getElementById('custom-width').value = this.selectedSize.width;
        document.getElementById('custom-height').value = this.selectedSize.height;
        
        this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
        
        this.updateCanvasSize();
        this.updateLivePreview();
        this.updateSizeInfo();
    }

    updateCanvasSize() {
        if (!this.canvas) return;
        
        // Convert mm to pixels (assuming 300 DPI for high quality)
        const dpi = 300;
        const mmToPx = dpi / 25.4;
        
        const canvasWidth = Math.round(this.selectedSize.width * mmToPx);
        const canvasHeight = Math.round(this.selectedSize.height * mmToPx);
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Update display size for preview
        const maxDisplaySize = 300;
        const scale = Math.min(maxDisplaySize / canvasWidth, maxDisplaySize / canvasHeight);
        
        this.canvas.style.width = (canvasWidth * scale) + 'px';
        this.canvas.style.height = (canvasHeight * scale) + 'px';
    }

    updateLivePreview() {
        if (!this.currentImage || !this.canvas) return;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground(ctx);
        
        // Apply image filters
        ctx.filter = this.getFilterString();
        
        // Calculate image positioning
        const imgPosition = this.calculateImagePosition();
        
        // Draw the image
        ctx.drawImage(
            this.currentImage,
            imgPosition.x,
            imgPosition.y,
            imgPosition.width,
            imgPosition.height
        );
        
        // Reset filter
        ctx.filter = 'none';
        
        // Draw border if enabled
        if (this.borderWidth > 0) {
            this.drawBorder(ctx);
        }
        
        // Update output information
        this.updateOutputInfo();
    }

    drawBackground(ctx) {
        if (this.backgroundImage) {
            // Draw background image
            ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Draw solid color background
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getFilterString() {
        const filters = [];
        
        if (this.brightness !== 0) {
            filters.push(`brightness(${100 + this.brightness}%)`);
        }
        
        if (this.contrast !== 0) {
            filters.push(`contrast(${100 + this.contrast}%)`);
        }
        
        if (this.saturation !== 0) {
            filters.push(`saturate(${100 + this.saturation}%)`);
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    }

    calculateImagePosition() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const imgWidth = this.currentImage.width;
        const imgHeight = this.currentImage.height;
        
        // Calculate scaled image dimensions
        const scale = (this.zoom / 100);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Calculate position based on percentage
        const x = (canvasWidth - scaledWidth) * (this.position.x / 100);
        const y = (canvasHeight - scaledHeight) * (this.position.y / 100);
        
        return {
            x: x,
            y: y,
            width: scaledWidth,
            height: scaledHeight
        };
    }

    drawBorder(ctx) {
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(
            this.borderWidth / 2,
            this.borderWidth / 2,
            this.canvas.width - this.borderWidth,
            this.canvas.height - this.borderWidth
        );
    }

    updateOutputInfo() {
        const info = document.getElementById('output-info');
        if (info) {
            const fileSize = this.estimateFileSize();
            info.innerHTML = `
                <div class="text-sm text-gray-600">
                    <div>Output: ${this.canvas.width} × ${this.canvas.height} pixels</div>
                    <div>Estimated size: ${this.formatFileSize(fileSize)}</div>
                    <div>Quality: High (300 DPI)</div>
                </div>
            `;
        }
    }

    estimateFileSize() {
        // Rough estimation based on canvas size
        const pixels = this.canvas.width * this.canvas.height;
        return pixels * 3; // RGB bytes
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    resetAdjustments() {
        // Reset all adjustments to default
        this.position = { x: 50, y: 30 };
        this.zoom = 100;
        this.brightness = 0;
        this.contrast = 0;
        this.saturation = 0;
        this.borderWidth = 0;
        
        // Update UI controls
        document.getElementById('position-x').value = 50;
        document.getElementById('position-y').value = 30;
        document.getElementById('zoom-level').value = 100;
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 0;
        document.getElementById('saturation').value = 0;
        document.getElementById('border-width').value = 0;
        
        // Update value displays
        document.getElementById('pos-x-value').textContent = '50%';
        document.getElementById('pos-y-value').textContent = '30%';
        document.getElementById('zoom-value').textContent = '100%';
        document.getElementById('brightness-value').textContent = '0';
        document.getElementById('contrast-value').textContent = '0';
        document.getElementById('saturation-value').textContent = '0';
        document.getElementById('border-width-value').textContent = '0px';
        
        this.updateLivePreview();
    }

    autoEnhance() {
        // Apply automatic enhancements
        this.brightness = 10;
        this.contrast = 15;
        this.saturation = 5;
        
        // Update UI
        document.getElementById('brightness').value = 10;
        document.getElementById('contrast').value = 15;
        document.getElementById('saturation').value = 5;
        
        document.getElementById('brightness-value').textContent = '10';
        document.getElementById('contrast-value').textContent = '15';
        document.getElementById('saturation-value').textContent = '5';
        
        this.updateLivePreview();
        this.showSuccess('Auto-enhancement applied!');
    }

    downloadPhoto(format) {
        if (!this.canvas) {
            this.showError('No photo to download');
            return;
        }
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.9 : undefined;
        
        // Create download canvas with multiple photos if specified
        const downloadCanvas = this.createDownloadCanvas();
        
        const link = document.createElement('a');
        link.download = `id-photo-${this.selectedSize.name || 'custom'}-${Date.now()}.${format}`;
        link.href = downloadCanvas.toDataURL(mimeType, quality);
        link.click();
        
        this.showSuccess(`Photo downloaded as ${format.toUpperCase()}!`);
    }

    createDownloadCanvas() {
        const layout = document.getElementById('photo-layout').value;
        const count = this.photoCount;
        
        if (count === 1) {
            return this.canvas;
        }
        
        // Create larger canvas for multiple photos
        const downloadCanvas = document.createElement('canvas');
        const ctx = downloadCanvas.getContext('2d');
        
        // Calculate layout dimensions
        let cols, rows;
        if (layout === 'grid') {
            cols = Math.ceil(Math.sqrt(count));
            rows = Math.ceil(count / cols);
        } else {
            cols = count;
            rows = 1;
        }
        
        downloadCanvas.width = this.canvas.width * cols;
        downloadCanvas.height = this.canvas.height * rows;
        
        // Draw multiple copies
        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * this.canvas.width;
            const y = row * this.canvas.height;
            
            ctx.drawImage(this.canvas, x, y);
        }
        
        return downloadCanvas;
    }

    downloadPhotoPDF() {
        // This would require a PDF library like jsPDF
        this.showError('PDF download feature coming soon!');
    }

    printPhoto() {
        if (!this.canvas) {
            this.showError('No photo to print');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        const canvas = this.createDownloadCanvas();
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>ID Photo Print</title>
                    <style>
                        body { margin: 0; padding: 20px; text-align: center; }
                        canvas { max-width: 100%; height: auto; }
                        .info { margin-top: 20px; font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
                    <h2>ID Photo - ${this.selectedSize.name || 'Custom'}</h2>
                    <canvas id="print-canvas"></canvas>
                    <div class="info">
                        <p>Size: ${this.selectedSize.width} × ${this.selectedSize.height} mm</p>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        
        const printCanvas = printWindow.document.getElementById('print-canvas');
        const printCtx = printCanvas.getContext('2d');
        printCanvas.width = canvas.width;
        printCanvas.height = canvas.height;
        printCtx.drawImage(canvas, 0, 0);
        
        printWindow.print();
    }

    showLoading(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('p').textContent = message;
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
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
    window.idPhotoMaker = new AdvancedIDPhotoMaker();
});
