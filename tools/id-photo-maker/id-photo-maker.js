class IDPhotoMaker {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.processedImage = null;
        this.currentSettings = {
            format: 'passport',
            customWidth: 2,
            customHeight: 2,
            unit: 'inch',
            backgroundColor: '#ffffff',
            borderWidth: 0,
            borderColor: '#000000',
            quality: 0.9,
            dpi: 300
        };
        
        // Standard photo sizes (width x height in inches)
        this.photoSizes = {
            passport: { width: 2, height: 2, name: 'Passport Photo (2" x 2")' },
            visa: { width: 2, height: 2, name: 'US Visa Photo (2" x 2")' },
            passport_uk: { width: 1.38, height: 1.77, name: 'UK Passport (35mm x 45mm)' },
            passport_eu: { width: 1.38, height: 1.77, name: 'EU Passport (35mm x 45mm)' },
            passport_india: { width: 1.38, height: 1.77, name: 'Indian Passport (35mm x 45mm)' },
            passport_china: { width: 1.26, height: 1.65, name: 'Chinese Passport (33mm x 48mm)' },
            id_card: { width: 1, height: 1.25, name: 'ID Card (1" x 1.25")' },
            green_card: { width: 2, height: 2, name: 'Green Card (2" x 2")' },
            custom: { width: 2, height: 2, name: 'Custom Size' }
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCanvas();
    }      initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('drop-zone'),
            fileInput: document.getElementById('file-input'),
            customWidth: document.getElementById('custom-width'),
            customHeight: document.getElementById('custom-height'),
            bgColor: document.getElementById('bg-color'),
            posXSlider: document.getElementById('pos-x'),
            posYSlider: document.getElementById('pos-y'),
            scaleSlider: document.getElementById('scale'),
            brightnessSlider: document.getElementById('brightness'),
            contrastSlider: document.getElementById('contrast'),
            saturationSlider: document.getElementById('saturation'),
            processBtn: document.getElementById('process-btn'),
            downloadBtn: document.getElementById('download-btn'),
            resetBtn: document.getElementById('reset-btn'),
            originalPreview: document.getElementById('original-preview'),
            processedPreview: document.getElementById('processed-preview'),
            fileInfo: document.getElementById('file-info'),
            outputDetails: document.getElementById('output-details')
        };
    }
      setupEventListeners() {
        // File upload
        if (this.elements.uploadArea) {
            this.elements.uploadArea.addEventListener('click', () => {
                if (this.elements.fileInput) {
                    this.elements.fileInput.click();
                }
            });
            
            this.elements.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.elements.uploadArea.classList.add('border-blue-500', 'bg-blue-50');
            });
            
            this.elements.uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.elements.uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
            });
            
            this.elements.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.elements.uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
        }
        
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
        
        // Settings
        this.elements.formatSelect.addEventListener('change', () => {
            this.updateSettings();
            this.toggleCustomSizeInputs();
            this.processImage();
        });
        
        this.elements.customWidth.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.customHeight.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.unitSelect.addEventListener('change', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.backgroundColorPicker.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.borderWidthSlider.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.borderColorPicker.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.qualitySlider.addEventListener('input', () => {
            this.updateSettings();
            this.processImage();
        });
        
        this.elements.dpiSelect.addEventListener('change', () => {
            this.updateSettings();
            this.processImage();
        });
        
        // Buttons
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });
        
        this.elements.resetBtn.addEventListener('click', () => {
            this.resetToDefaults();
        });
        
        this.elements.applyCropBtn.addEventListener('click', () => {
            this.applyCrop();
        });
        
        this.elements.resetCropBtn.addEventListener('click', () => {
            this.resetCrop();
        });
    }
    
    initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize crop canvas
        this.cropCanvas = this.elements.cropCanvas;
        this.cropCtx = this.cropCanvas.getContext('2d');
        this.initializeCropTool();
    }
    
    initializeCropTool() {
        this.cropData = {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isDragging: false
        };
        
        this.cropCanvas.addEventListener('mousedown', (e) => {
            if (!this.originalImage) return;
            
            const rect = this.cropCanvas.getBoundingClientRect();
            this.cropData.startX = e.clientX - rect.left;
            this.cropData.startY = e.clientY - rect.top;
            this.cropData.isDragging = true;
            this.cropData.isActive = true;
        });
        
        this.cropCanvas.addEventListener('mousemove', (e) => {
            if (!this.cropData.isDragging || !this.originalImage) return;
            
            const rect = this.cropCanvas.getBoundingClientRect();
            this.cropData.currentX = e.clientX - rect.left;
            this.cropData.currentY = e.clientY - rect.top;
            
            this.drawCropOverlay();
        });
        
        this.cropCanvas.addEventListener('mouseup', () => {
            this.cropData.isDragging = false;
        });
        
        this.cropCanvas.addEventListener('mouseleave', () => {
            this.cropData.isDragging = false;
        });
    }
    
    async handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB.');
            return;
        }
        
        this.showProcessing('Loading image...');
        
        try {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage();
                this.setupCropCanvas();
                this.processImage();
                this.updateImageInfo(file);
                this.hideProcessing();
                this.hideError();
            };
            
            img.onerror = () => {
                this.showError('Failed to load image. Please try another file.');
                this.hideProcessing();
            };
            
            img.src = URL.createObjectURL(file);
        } catch (error) {
            this.showError('Error loading image: ' + error.message);
            this.hideProcessing();
        }
    }
    
    displayOriginalImage() {
        this.elements.originalPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = this.originalImage.src;
        img.className = 'max-w-full h-auto rounded-lg shadow-md';
        this.elements.originalPreview.appendChild(img);
    }
    
    setupCropCanvas() {
        const maxWidth = 400;
        const maxHeight = 300;
        
        let canvasWidth = this.originalImage.width;
        let canvasHeight = this.originalImage.height;
        
        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
            const ratio = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
            canvasWidth *= ratio;
            canvasHeight *= ratio;
        }
        
        this.cropCanvas.width = canvasWidth;
        this.cropCanvas.height = canvasHeight;
        
        this.cropCtx.drawImage(this.originalImage, 0, 0, canvasWidth, canvasHeight);
        this.elements.cropArea.classList.remove('hidden');
    }
    
    drawCropOverlay() {
        const canvasWidth = this.cropCanvas.width;
        const canvasHeight = this.cropCanvas.height;
        
        // Clear and redraw image
        this.cropCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.cropCtx.drawImage(this.originalImage, 0, 0, canvasWidth, canvasHeight);
        
        if (this.cropData.isActive) {
            const width = this.cropData.currentX - this.cropData.startX;
            const height = this.cropData.currentY - this.cropData.startY;
            
            // Draw overlay
            this.cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.cropCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Clear selection area
            this.cropCtx.clearRect(this.cropData.startX, this.cropData.startY, width, height);
            this.cropCtx.drawImage(
                this.originalImage,
                (this.cropData.startX / canvasWidth) * this.originalImage.width,
                (this.cropData.startY / canvasHeight) * this.originalImage.height,
                (width / canvasWidth) * this.originalImage.width,
                (height / canvasHeight) * this.originalImage.height,
                this.cropData.startX,
                this.cropData.startY,
                width,
                height
            );
            
            // Draw selection border
            this.cropCtx.strokeStyle = '#3b82f6';
            this.cropCtx.lineWidth = 2;
            this.cropCtx.strokeRect(this.cropData.startX, this.cropData.startY, width, height);
        }
    }
    
    applyCrop() {
        if (!this.cropData.isActive) return;
        
        const canvasWidth = this.cropCanvas.width;
        const canvasHeight = this.cropCanvas.height;
        
        const width = Math.abs(this.cropData.currentX - this.cropData.startX);
        const height = Math.abs(this.cropData.currentY - this.cropData.startY);
        
        if (width < 10 || height < 10) {
            this.showError('Selection area is too small.');
            return;
        }
        
        const startX = Math.min(this.cropData.startX, this.cropData.currentX);
        const startY = Math.min(this.cropData.startY, this.cropData.currentY);
        
        // Calculate crop area relative to original image
        const cropX = (startX / canvasWidth) * this.originalImage.width;
        const cropY = (startY / canvasHeight) * this.originalImage.height;
        const cropWidth = (width / canvasWidth) * this.originalImage.width;
        const cropHeight = (height / canvasHeight) * this.originalImage.height;
        
        // Create cropped image
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        
        cropCtx.drawImage(
            this.originalImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // Update original image with cropped version
        const croppedImg = new Image();
        croppedImg.onload = () => {
            this.originalImage = croppedImg;
            this.displayOriginalImage();
            this.setupCropCanvas();
            this.processImage();
        };
        croppedImg.src = cropCanvas.toDataURL();
        
        this.resetCrop();
    }
    
    resetCrop() {
        this.cropData.isActive = false;
        if (this.originalImage) {
            this.setupCropCanvas();
        }
    }
    
    updateSettings() {
        this.currentSettings.format = this.elements.formatSelect.value;
        this.currentSettings.customWidth = parseFloat(this.elements.customWidth.value) || 2;
        this.currentSettings.customHeight = parseFloat(this.elements.customHeight.value) || 2;
        this.currentSettings.unit = this.elements.unitSelect.value;
        this.currentSettings.backgroundColor = this.elements.backgroundColorPicker.value;
        this.currentSettings.borderWidth = parseInt(this.elements.borderWidthSlider.value);
        this.currentSettings.borderColor = this.elements.borderColorPicker.value;
        this.currentSettings.quality = parseFloat(this.elements.qualitySlider.value);
        this.currentSettings.dpi = parseInt(this.elements.dpiSelect.value);
        
        // Update display values
        this.elements.backgroundColorValue.textContent = this.currentSettings.backgroundColor;
        this.elements.borderWidthValue.textContent = this.currentSettings.borderWidth + 'px';
        this.elements.borderColorValue.textContent = this.currentSettings.borderColor;
        this.elements.qualityValue.textContent = Math.round(this.currentSettings.quality * 100) + '%';
    }
    
    toggleCustomSizeInputs() {
        if (this.currentSettings.format === 'custom') {
            this.elements.customSizeInputs.classList.remove('hidden');
        } else {
            this.elements.customSizeInputs.classList.add('hidden');
        }
    }
    
    processImage() {
        if (!this.originalImage) return;
        
        this.showProcessing('Processing image...');
        
        setTimeout(() => {
            try {
                const size = this.getTargetSize();
                const pixelWidth = this.inchesToPixels(size.width);
                const pixelHeight = this.inchesToPixels(size.height);
                
                this.canvas.width = pixelWidth;
                this.canvas.height = pixelHeight;
                
                // Fill background
                this.ctx.fillStyle = this.currentSettings.backgroundColor;
                this.ctx.fillRect(0, 0, pixelWidth, pixelHeight);
                
                // Calculate image positioning (center and fit)
                const imgAspect = this.originalImage.width / this.originalImage.height;
                const targetAspect = pixelWidth / pixelHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > targetAspect) {
                    // Image is wider, fit to width
                    drawWidth = pixelWidth - (this.currentSettings.borderWidth * 2);
                    drawHeight = drawWidth / imgAspect;
                    drawX = this.currentSettings.borderWidth;
                    drawY = (pixelHeight - drawHeight) / 2;
                } else {
                    // Image is taller, fit to height
                    drawHeight = pixelHeight - (this.currentSettings.borderWidth * 2);
                    drawWidth = drawHeight * imgAspect;
                    drawX = (pixelWidth - drawWidth) / 2;
                    drawY = this.currentSettings.borderWidth;
                }
                
                // Draw image
                this.ctx.drawImage(this.originalImage, drawX, drawY, drawWidth, drawHeight);
                
                // Draw border
                if (this.currentSettings.borderWidth > 0) {
                    this.ctx.strokeStyle = this.currentSettings.borderColor;
                    this.ctx.lineWidth = this.currentSettings.borderWidth;
                    this.ctx.strokeRect(
                        this.currentSettings.borderWidth / 2,
                        this.currentSettings.borderWidth / 2,
                        pixelWidth - this.currentSettings.borderWidth,
                        pixelHeight - this.currentSettings.borderWidth
                    );
                }
                
                // Display processed image
                this.displayProcessedImage();
                this.updateOutputInfo();
                this.hideProcessing();
                
            } catch (error) {
                this.showError('Error processing image: ' + error.message);
                this.hideProcessing();
            }
        }, 100);
    }
    
    getTargetSize() {
        if (this.currentSettings.format === 'custom') {
            return {
                width: this.currentSettings.customWidth,
                height: this.currentSettings.customHeight
            };
        }
        return this.photoSizes[this.currentSettings.format];
    }
    
    inchesToPixels(inches) {
        return Math.round(inches * this.currentSettings.dpi);
    }
    
    displayProcessedImage() {
        this.elements.processedPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = this.canvas.toDataURL('image/jpeg', this.currentSettings.quality);
        img.className = 'max-w-full h-auto rounded-lg shadow-md';
        this.elements.processedPreview.appendChild(img);
        
        this.processedImage = img;
        this.elements.downloadBtn.disabled = false;
    }
    
    updateImageInfo(file) {
        const info = `
            <div class="text-sm text-gray-600">
                <p><strong>Original:</strong> ${this.originalImage.width} × ${this.originalImage.height}px</p>
                <p><strong>File Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> ${file.type}</p>
            </div>
        `;
        this.elements.imageInfo.innerHTML = info;
    }
    
    updateOutputInfo() {
        const size = this.getTargetSize();
        const pixelWidth = this.inchesToPixels(size.width);
        const pixelHeight = this.inchesToPixels(size.height);
        
        const info = `
            <div class="text-sm text-gray-600">
                <p><strong>Size:</strong> ${size.width}" × ${size.height}" (${pixelWidth} × ${pixelHeight}px)</p>
                <p><strong>DPI:</strong> ${this.currentSettings.dpi}</p>
                <p><strong>Quality:</strong> ${Math.round(this.currentSettings.quality * 100)}%</p>
                <p><strong>Format:</strong> JPEG</p>
            </div>
        `;
        this.elements.outputInfo.innerHTML = info;
    }
    
    downloadImage() {
        if (!this.processedImage) return;
        
        const link = document.createElement('a');
        link.download = `id-photo-${this.currentSettings.format}-${Date.now()}.jpg`;
        link.href = this.canvas.toDataURL('image/jpeg', this.currentSettings.quality);
        link.click();
    }
    
    resetToDefaults() {
        this.currentSettings = {
            format: 'passport',
            customWidth: 2,
            customHeight: 2,
            unit: 'inch',
            backgroundColor: '#ffffff',
            borderWidth: 0,
            borderColor: '#000000',
            quality: 0.9,
            dpi: 300
        };
        
        // Reset form elements
        this.elements.formatSelect.value = 'passport';
        this.elements.customWidth.value = '2';
        this.elements.customHeight.value = '2';
        this.elements.unitSelect.value = 'inch';
        this.elements.backgroundColorPicker.value = '#ffffff';
        this.elements.borderWidthSlider.value = '0';
        this.elements.borderColorPicker.value = '#000000';
        this.elements.qualitySlider.value = '0.9';
        this.elements.dpiSelect.value = '300';
        
        this.toggleCustomSizeInputs();
        this.updateSettings();
        
        if (this.originalImage) {
            this.processImage();
        }
    }
    
    showProcessing(message) {
        this.elements.processingStatus.textContent = message;
        this.elements.processingStatus.classList.remove('hidden');
    }
    
    hideProcessing() {
        this.elements.processingStatus.classList.add('hidden');
    }
    
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    }
    
    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }
}

// Initialize the ID Photo Maker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new IDPhotoMaker();
});
