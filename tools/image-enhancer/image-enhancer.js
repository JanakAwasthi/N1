/**
 * Advanced Image Enhancer
 * Professional image enhancement with filters, adjustments, and real-time preview
 */

class ImageEnhancer {
    constructor() {
        this.originalImage = null;
        this.originalCanvas = null;
        this.enhancedCanvas = null;
        this.originalContext = null;
        this.enhancedContext = null;
        this.imageData = null;
        this.viewMode = 'single'; // 'single' or 'comparison'
        
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            vibrance: 0,
            hue: 0,
            temperature: 0,
            tint: 0,
            sharpen: 0,
            blur: 0,
            noise: 0,
            vignette: 0
        };

        this.presets = {
            'Portrait': { brightness: 5, contrast: 10, saturation: 15, vibrance: 20, temperature: 5 },
            'Landscape': { brightness: 0, contrast: 15, saturation: 25, vibrance: 10, temperature: -5 },
            'Vintage': { brightness: -10, contrast: -5, saturation: -20, temperature: 15, tint: 10, vignette: 30 },
            'B&W': { brightness: 5, contrast: 20, saturation: -100, vibrance: 0 },
            'Dramatic': { brightness: -5, contrast: 30, saturation: 20, vibrance: 15, sharpen: 20 },
            'Soft': { brightness: 10, contrast: -10, saturation: 5, blur: 1, temperature: 5 },
            'Vivid': { brightness: 0, contrast: 20, saturation: 40, vibrance: 30, sharpen: 15 },
            'Cool': { brightness: 0, contrast: 10, saturation: 10, temperature: -20, tint: -5 },
            'Warm': { brightness: 5, contrast: 5, saturation: 15, temperature: 20, tint: 5 },
            'Film': { brightness: -5, contrast: 25, saturation: -10, temperature: 10, vignette: 15 }
        };

        this.initializeEventListeners();
        this.initializePresets();
    }

    initializeEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        // Slider listeners
        this.initializeSliders();

        // Export format change
        document.getElementById('export-format').addEventListener('change', () => {
            this.toggleQualitySlider();
        });

        // Quality slider
        document.getElementById('export-quality').addEventListener('input', (e) => {
            document.getElementById('quality-display').textContent = e.target.value;
        });
    }

    initializeSliders() {
        const sliders = ['brightness', 'contrast', 'saturation', 'vibrance', 'hue', 'temperature', 'tint', 'sharpen', 'blur', 'noise', 'vignette'];
        
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(sliderId + '-value');
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.filters[sliderId] = value;
                
                // Update display
                if (sliderId === 'hue') {
                    valueDisplay.textContent = value;
                } else if (sliderId === 'blur') {
                    valueDisplay.textContent = value;
                } else {
                    valueDisplay.textContent = value;
                }
                
                this.applyFilters();
            });
        });
    }

    initializePresets() {
        const presetsContainer = document.getElementById('presets-container');
        
        Object.keys(this.presets).forEach(presetName => {
            const presetButton = document.createElement('button');
            presetButton.className = 'filter-preset p-3 text-center';
            presetButton.innerHTML = `
                <div class="text-sm font-medium text-gray-700">${presetName}</div>
            `;
            presetButton.onclick = () => this.applyPreset(presetName);
            presetsContainer.appendChild(presetButton);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        this.showProcessingProgress();

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    loadImage(imageSrc, file) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.setupCanvases();
            this.updateImageInfo(file);
            this.showImageControls();
            this.applyFilters();
            this.hideProcessingProgress();
        };
        img.src = imageSrc;
    }

    setupCanvases() {
        // Setup original canvas
        this.originalCanvas = document.getElementById('original-canvas');
        this.originalContext = this.originalCanvas.originalContext;
        
        // Setup enhanced canvas
        this.enhancedCanvas = document.getElementById('enhanced-canvas');
        this.enhancedContext = this.enhancedCanvas.getContext('2d');
        
        // Setup comparison canvas
        const comparisonCanvas = document.getElementById('enhanced-canvas-comparison');
        
        // Set canvas dimensions
        const maxWidth = 600;
        const scale = Math.min(maxWidth / this.originalImage.width, maxWidth / this.originalImage.height);
        const width = this.originalImage.width * scale;
        const height = this.originalImage.height * scale;

        [this.originalCanvas, this.enhancedCanvas, comparisonCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });

        // Draw original image
        this.originalContext = this.originalCanvas.getContext('2d');
        this.originalContext.drawImage(this.originalImage, 0, 0, width, height);
        
        const comparisonContext = comparisonCanvas.getContext('2d');
        comparisonContext.drawImage(this.originalImage, 0, 0, width, height);
    }

    applyFilters() {
        if (!this.originalImage || !this.enhancedCanvas) return;

        // Start with original image
        this.enhancedContext.clearRect(0, 0, this.enhancedCanvas.width, this.enhancedCanvas.height);
        this.enhancedContext.drawImage(this.originalImage, 0, 0, this.enhancedCanvas.width, this.enhancedCanvas.height);

        // Apply filters using CSS filters (for real-time performance)
        const filterString = this.buildFilterString();
        this.enhancedCanvas.style.filter = filterString;
        
        // Also update comparison canvas
        const comparisonCanvas = document.getElementById('enhanced-canvas-comparison');
        if (comparisonCanvas) {
            comparisonCanvas.style.filter = filterString;
        }
    }

    buildFilterString() {
        const filters = [];
        
        // Basic adjustments
        if (this.filters.brightness !== 0) {
            filters.push(`brightness(${1 + this.filters.brightness / 100})`);
        }
        if (this.filters.contrast !== 0) {
            filters.push(`contrast(${1 + this.filters.contrast / 100})`);
        }
        if (this.filters.saturation !== 0) {
            filters.push(`saturate(${1 + this.filters.saturation / 100})`);
        }
        if (this.filters.hue !== 0) {
            filters.push(`hue-rotate(${this.filters.hue}deg)`);
        }
        if (this.filters.blur > 0) {
            filters.push(`blur(${this.filters.blur}px)`);
        }

        // Sepia for vintage effects
        if (this.filters.temperature > 0) {
            filters.push(`sepia(${this.filters.temperature / 100})`);
        }

        return filters.join(' ');
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        // Reset all filters first
        this.resetAllFilters(false);

        // Apply preset values
        Object.keys(preset).forEach(filterName => {
            if (this.filters.hasOwnProperty(filterName)) {
                this.filters[filterName] = preset[filterName];
                
                // Update slider and display
                const slider = document.getElementById(filterName);
                const valueDisplay = document.getElementById(filterName + '-value');
                
                if (slider) {
                    slider.value = preset[filterName];
                }
                if (valueDisplay) {
                    valueDisplay.textContent = preset[filterName];
                }
            }
        });

        // Update active preset styling
        document.querySelectorAll('.filter-preset').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.filter-preset').classList.add('active');

        this.applyFilters();
    }

    resetAllFilters(updateSliders = true) {
        // Reset filter values
        Object.keys(this.filters).forEach(key => {
            this.filters[key] = key === 'brightness' || key === 'contrast' || key === 'saturation' ? 0 : 0;
        });

        if (updateSliders) {
            // Reset sliders and displays
            Object.keys(this.filters).forEach(filterName => {
                const slider = document.getElementById(filterName);
                const valueDisplay = document.getElementById(filterName + '-value');
                
                if (slider) {
                    slider.value = 0;
                }
                if (valueDisplay) {
                    valueDisplay.textContent = filterName === 'hue' ? '0' : '0';
                }
            });
        }

        // Remove active preset styling
        document.querySelectorAll('.filter-preset').forEach(btn => btn.classList.remove('active'));

        this.applyFilters();
    }

    autoEnhance() {
        // Apply automatic enhancement
        const autoPreset = {
            brightness: 5,
            contrast: 15,
            saturation: 10,
            vibrance: 15,
            sharpen: 10
        };

        Object.keys(autoPreset).forEach(filterName => {
            if (this.filters.hasOwnProperty(filterName)) {
                this.filters[filterName] = autoPreset[filterName];
                
                const slider = document.getElementById(filterName);
                const valueDisplay = document.getElementById(filterName + '-value');
                
                if (slider) {
                    slider.value = autoPreset[filterName];
                }
                if (valueDisplay) {
                    valueDisplay.textContent = autoPreset[filterName];
                }
            }
        });

        this.applyFilters();
    }

    toggleComparisonMode(mode) {
        this.viewMode = mode;
        
        const singleView = document.getElementById('single-image-view');
        const comparisonView = document.getElementById('before-after-view');
        const singleBtn = document.getElementById('single-view-btn');
        const comparisonBtn = document.getElementById('comparison-view-btn');

        if (mode === 'single') {
            singleView.classList.remove('hidden');
            comparisonView.classList.add('hidden');
            singleBtn.classList.remove('bg-gray-600');
            singleBtn.classList.add('bg-green-600');
            comparisonBtn.classList.remove('bg-green-600');
            comparisonBtn.classList.add('bg-gray-600');
        } else {
            singleView.classList.add('hidden');
            comparisonView.classList.remove('hidden');
            singleBtn.classList.remove('bg-green-600');
            singleBtn.classList.add('bg-gray-600');
            comparisonBtn.classList.remove('bg-gray-600');
            comparisonBtn.classList.add('bg-green-600');
        }
    }

    updateImageInfo(file) {
        document.getElementById('image-format').textContent = file.type.split('/')[1].toUpperCase();
        document.getElementById('image-size').textContent = `${this.originalImage.width} × ${this.originalImage.height}`;
        document.getElementById('image-dimensions').textContent = `${this.originalImage.width} × ${this.originalImage.height}`;
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showImageControls() {
        document.getElementById('enhancement-controls').classList.remove('hidden');
        document.getElementById('filter-presets').classList.remove('hidden');
        document.getElementById('image-container').classList.remove('hidden');
        document.getElementById('image-info').classList.remove('hidden');
        document.getElementById('download-options').classList.remove('hidden');
        
        const preview = document.getElementById('image-preview');
        preview.classList.add('image-ready');
        preview.querySelector('i').style.display = 'none';
        preview.querySelector('p').style.display = 'none';
    }

    showProcessingProgress() {
        const progressDiv = document.getElementById('processing-progress');
        progressDiv.classList.remove('hidden');
        
        // Simulate processing
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('progress-percentage').textContent = Math.round(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressDiv.classList.add('hidden');
                }, 500);
            }
        }, 100);
    }

    hideProcessingProgress() {
        document.getElementById('processing-progress').classList.add('hidden');
    }

    toggleQualitySlider() {
        const format = document.getElementById('export-format').value;
        const qualitySetting = document.getElementById('quality-setting');
        
        if (format === 'png') {
            qualitySetting.style.display = 'none';
        } else {
            qualitySetting.style.display = 'block';
        }
    }

    downloadImage(size) {
        if (!this.enhancedCanvas) {
            alert('No image to download');
            return;
        }

        const format = document.getElementById('export-format').value;
        const quality = parseInt(document.getElementById('export-quality').value) / 100;
        
        // Create download canvas
        const downloadCanvas = document.createElement('canvas');
        const downloadContext = downloadCanvas.getContext('2d');
        
        let width, height;
        
        switch (size) {
            case 'original':
                width = this.originalImage.width;
                height = this.originalImage.height;
                break;
            case 'hd': {
                const scale = 1920 / Math.max(this.originalImage.width, this.originalImage.height);
                width = Math.round(this.originalImage.width * scale);
                height = Math.round(this.originalImage.height * scale);
                break;
            }
            case '4k': {
                const target = 3840; // 4K UHD max dimension
                const scale = target / Math.max(this.originalImage.width, this.originalImage.height);
                width = Math.round(this.originalImage.width * scale);
                height = Math.round(this.originalImage.height * scale);
                break;
            }
            default:
                width = this.enhancedCanvas.width;
                height = this.enhancedCanvas.height;
        }
        
        downloadCanvas.width = width;
        downloadCanvas.height = height;
        
        // High quality resampling
        downloadContext.imageSmoothingEnabled = true;
        downloadContext.imageSmoothingQuality = 'high';
        
        // Apply the same filter to download canvas
        downloadContext.filter = this.buildFilterString();
        downloadContext.drawImage(this.originalImage, 0, 0, width, height);
        
        // Create download link
        const link = document.createElement('a');
        
        if (format === 'png') {
            link.href = downloadCanvas.toDataURL('image/png');
            link.download = `enhanced-image-${Date.now()}.png`;
        } else if (format === 'webp') {
            link.href = downloadCanvas.toDataURL('image/webp', quality);
            link.download = `enhanced-image-${Date.now()}.webp`;
        } else {
            link.href = downloadCanvas.toDataURL('image/jpeg', quality);
            link.download = `enhanced-image-${Date.now()}.jpg`;
        }
        
        link.click();
    }
}

// Global functions for HTML onclick handlers
function resetAllFilters() {
    imageEnhancer.resetAllFilters();
}

function autoEnhance() {
    imageEnhancer.autoEnhance();
}

function toggleComparisonMode(mode) {
    imageEnhancer.toggleComparisonMode(mode);
}

function downloadImage(size) {
    imageEnhancer.downloadImage(size);
}

// Initialize when DOM is loaded
let imageEnhancer;
document.addEventListener('DOMContentLoaded', () => {
    imageEnhancer = new ImageEnhancer();
});
