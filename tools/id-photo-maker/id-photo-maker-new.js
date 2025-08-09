class IDPhotoMaker {
    constructor() {
        this.originalImage = null;
        this.originalFile = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentSettings = {
            width: 35,
            height: 45,
            backgroundColor: '#ffffff',
            positionX: 50,
            positionY: 50,
            scale: 100,
            brightness: 100,
            contrast: 100,
            saturation: 100
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSliderValues();
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
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

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Size presets
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                document.querySelectorAll('.size-preset').forEach(p => p.classList.remove('bg-blue-100'));
                preset.classList.add('bg-blue-100');
                
                this.currentSettings.width = parseInt(preset.dataset.width);
                this.currentSettings.height = parseInt(preset.dataset.height);
                
                document.getElementById('custom-width').value = this.currentSettings.width;
                document.getElementById('custom-height').value = this.currentSettings.height;
                
                this.processImage();
            });
        });

        // Custom size inputs
        document.getElementById('custom-width').addEventListener('input', (e) => {
            this.currentSettings.width = parseInt(e.target.value);
            this.processImage();
        });

        document.getElementById('custom-height').addEventListener('input', (e) => {
            this.currentSettings.height = parseInt(e.target.value);
            this.processImage();
        });

        // Background type buttons
        document.querySelectorAll('.bg-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bg-type-btn').forEach(b => b.classList.remove('bg-blue-100'));
                btn.classList.add('bg-blue-100');
                this.processImage();
            });
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                document.getElementById('bg-color').value = color;
                this.currentSettings.backgroundColor = color;
                this.processImage();
            });
        });

        // Background color picker
        document.getElementById('bg-color').addEventListener('input', (e) => {
            this.currentSettings.backgroundColor = e.target.value;
            this.processImage();
        });

        // Adjustment sliders
        this.setupSlider('pos-x', 'positionX');
        this.setupSlider('pos-y', 'positionY');
        this.setupSlider('scale', 'scale');
        this.setupSlider('brightness', 'brightness');
        this.setupSlider('contrast', 'contrast');
        this.setupSlider('saturation', 'saturation');

        // Buttons
        document.getElementById('process-btn').addEventListener('click', () => this.processImage());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSettings());
    }

    setupSlider(sliderId, settingKey) {
        const slider = document.getElementById(sliderId);
        const valueSpan = document.getElementById(`${sliderId}-value`);
        
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.currentSettings[settingKey] = value;
            valueSpan.textContent = value + (settingKey === 'scale' ? '%' : settingKey.includes('position') ? '%' : '');
            this.processImage();
        });
    }

    updateSliderValues() {
        Object.entries(this.currentSettings).forEach(([key, value]) => {
            const slider = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('position-', 'pos-'));
            const valueSpan = document.getElementById(`${slider?.id}-value`);
            
            if (slider) slider.value = value;
            if (valueSpan) valueSpan.textContent = value + (key === 'scale' ? '%' : key.includes('position') ? '%' : '');
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        this.originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.loadImage(e.target.result);
        };
        
        reader.readAsDataURL(file);
    }

    loadImage(src) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.showOriginalPreview(img);
            this.showFileInfo();
            this.processImage();
        };
        img.src = src;
    }    showOriginalPreview(img) {
        const preview = document.getElementById('original-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <h3 class="text-lg font-medium text-cyan-400 mb-3">Original Photo</h3>
            <div class="text-center space-y-3">
                <img src="${img.src}" alt="Original" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #00d4ff;">
            </div>
        `;
        preview.classList.remove('hidden');
    }

    showFileInfo() {
        const fileInfo = document.getElementById('file-info');
        fileInfo.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">File:</span>
                    <span class="font-medium">${this.originalFile.name}</span>
                </div>
                <div>
                    <span class="text-gray-600">Size:</span>
                    <span class="font-medium">${(this.originalFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div>
                    <span class="text-gray-600">Dimensions:</span>
                    <span class="font-medium">${this.originalImage.width} × ${this.originalImage.height}</span>
                </div>
                <div>
                    <span class="text-gray-600">Type:</span>
                    <span class="font-medium">${this.originalFile.type}</span>
                </div>
            </div>
        `;
    }

    processImage() {
        if (!this.originalImage) return;

        const dpi = 300;
        const mmToInch = 0.0393701;
        const widthInch = this.currentSettings.width * mmToInch;
        const heightInch = this.currentSettings.height * mmToInch;
        
        const canvasWidth = Math.round(widthInch * dpi);
        const canvasHeight = Math.round(heightInch * dpi);

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Clear canvas with background color
        this.ctx.fillStyle = this.currentSettings.backgroundColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Calculate image position and size
        const scale = this.currentSettings.scale / 100;
        const imageAspect = this.originalImage.width / this.originalImage.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight;
        if (imageAspect > canvasAspect) {
            drawHeight = canvasHeight * scale;
            drawWidth = drawHeight * imageAspect;
        } else {
            drawWidth = canvasWidth * scale;
            drawHeight = drawWidth / imageAspect;
        }

        const x = (canvasWidth - drawWidth) * (this.currentSettings.positionX / 100);
        const y = (canvasHeight - drawHeight) * (this.currentSettings.positionY / 100);

        // Apply filters
        this.ctx.filter = `brightness(${this.currentSettings.brightness}%) contrast(${this.currentSettings.contrast}%) saturate(${this.currentSettings.saturation}%)`;

        // Draw image
        this.ctx.drawImage(this.originalImage, x, y, drawWidth, drawHeight);

        // Reset filter
        this.ctx.filter = 'none';

        // Show processed preview
        this.showProcessedPreview();
        this.showOutputDetails(canvasWidth, canvasHeight);
    }

    showProcessedPreview() {
        const preview = document.getElementById('processed-preview');
        const imgElement = preview.querySelector('img') || document.createElement('img');
        
        imgElement.src = this.canvas.toDataURL();
        imgElement.className = 'max-w-full max-h-64 rounded-lg border-2 border-gray-200';
        
        if (!preview.querySelector('img')) {
            preview.innerHTML = '';
            preview.appendChild(imgElement);
        }

        // Enable download button
        document.getElementById('download-btn').disabled = false;
    }

    showOutputDetails(width, height) {
        const details = document.getElementById('output-details');
        details.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">Output Size:</span>
                    <span class="font-medium">${this.currentSettings.width} × ${this.currentSettings.height} mm</span>
                </div>
                <div>
                    <span class="text-gray-600">Resolution:</span>
                    <span class="font-medium">${width} × ${height} px</span>
                </div>
                <div>
                    <span class="text-gray-600">DPI:</span>
                    <span class="font-medium">300</span>
                </div>
                <div>
                    <span class="text-gray-600">Background:</span>
                    <span class="font-medium">${this.currentSettings.backgroundColor}</span>
                </div>
            </div>
        `;
    }

    downloadImage() {
        if (!this.canvas) return;

        const link = document.createElement('a');
        link.download = `id-photo-${this.currentSettings.width}x${this.currentSettings.height}mm.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    resetSettings() {
        this.currentSettings = {
            width: 35,
            height: 45,
            backgroundColor: '#ffffff',
            positionX: 50,
            positionY: 50,
            scale: 100,
            brightness: 100,
            contrast: 100,
            saturation: 100
        };

        document.getElementById('custom-width').value = 35;
        document.getElementById('custom-height').value = 45;
        document.getElementById('bg-color').value = '#ffffff';
        
        this.updateSliderValues();
        this.processImage();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new IDPhotoMaker();
});
