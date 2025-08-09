class PhotoToPDFConverter {
    constructor() {
        this.photos = [];
        this.selectedPhotos = new Set();
        this.isProcessing = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.photoInput = document.getElementById('photoInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.photosContainer = document.getElementById('photosContainer');
        this.photosGrid = document.getElementById('photosGrid');
        this.convertSection = document.getElementById('convertSection');
        this.convertBtn = document.getElementById('convertBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.resultContainer = document.getElementById('resultContainer');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newConversionBtn = document.getElementById('newConversionBtn');
        
        // Settings
        this.pageSize = document.getElementById('pageSize');
        this.orientation = document.getElementById('orientation');
        this.layout = document.getElementById('layout');
        this.quality = document.getElementById('quality');
        
        // Batch operations
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.removeSelectedBtn = document.getElementById('removeSelectedBtn');
    }

    attachEventListeners() {
        // File input events
        this.browseBtn.addEventListener('click', () => this.photoInput.click());
        this.photoInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Convert button
        this.convertBtn.addEventListener('click', () => this.convertToPDF());
        
        // Batch operations
        this.selectAllBtn.addEventListener('click', () => this.selectAllPhotos());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllPhotos());
        this.removeSelectedBtn.addEventListener('click', () => this.removeSelectedPhotos());
        
        // Result buttons
        this.downloadBtn.addEventListener('click', () => this.downloadPDF());
        this.newConversionBtn.addEventListener('click', () => this.resetConverter());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            this.handleFileSelect(files);
        }
    }

    async handleFileSelect(files) {
        if (files.length === 0) return;
        
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (imageFiles.length === 0) {
            this.showMessage('Please select valid image files.', 'error');
            return;
        }
        
        for (const file of imageFiles) {
            await this.addPhoto(file);
        }
        
        this.updateUI();
    }

    async addPhoto(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photo = {
                    id: Date.now() + Math.random(),
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name,
                    size: file.size,
                    selected: false
                };
                
                this.photos.push(photo);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    updateUI() {
        if (this.photos.length > 0) {
            this.settingsPanel.classList.remove('hidden');
            this.photosContainer.classList.remove('hidden');
            this.convertSection.classList.remove('hidden');
            this.renderPhotos();
        } else {
            this.settingsPanel.classList.add('hidden');
            this.photosContainer.classList.add('hidden');
            this.convertSection.classList.add('hidden');
        }
    }

    renderPhotos() {
        this.photosGrid.innerHTML = '';
        
        this.photos.forEach(photo => {
            const photoElement = this.createPhotoElement(photo);
            this.photosGrid.appendChild(photoElement);
        });
    }

    createPhotoElement(photo) {
        const div = document.createElement('div');
        div.className = 'photo-item bg-white rounded-lg shadow-md overflow-hidden';
        div.innerHTML = `
            <div class="relative">
                <img src="${photo.dataUrl}" alt="${photo.name}" class="w-full h-32 object-cover">
                <div class="absolute top-2 left-2">
                    <input type="checkbox" ${photo.selected ? 'checked' : ''} 
                           class="photo-checkbox w-4 h-4 text-blue-600 rounded" 
                           data-photo-id="${photo.id}">
                </div>
                <button class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 remove-photo" 
                        data-photo-id="${photo.id}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 drag-handle">
                    <i class="fas fa-grip-vertical mr-1"></i>
                </div>
            </div>
            <div class="p-3">
                <h4 class="text-sm font-medium text-gray-800 truncate" title="${photo.name}">${photo.name}</h4>
                <p class="text-xs text-gray-500">${this.formatFileSize(photo.size)}</p>
            </div>
        `;
        
        // Add event listeners
        const checkbox = div.querySelector('.photo-checkbox');
        checkbox.addEventListener('change', () => {
            photo.selected = checkbox.checked;
            if (checkbox.checked) {
                this.selectedPhotos.add(photo.id);
            } else {
                this.selectedPhotos.delete(photo.id);
            }
        });
        
        const removeBtn = div.querySelector('.remove-photo');
        removeBtn.addEventListener('click', () => this.removePhoto(photo.id));
        
        return div;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removePhoto(photoId) {
        this.photos = this.photos.filter(photo => photo.id !== photoId);
        this.selectedPhotos.delete(photoId);
        this.updateUI();
    }

    selectAllPhotos() {
        this.photos.forEach(photo => {
            photo.selected = true;
            this.selectedPhotos.add(photo.id);
        });
        this.renderPhotos();
    }

    deselectAllPhotos() {
        this.photos.forEach(photo => {
            photo.selected = false;
        });
        this.selectedPhotos.clear();
        this.renderPhotos();
    }

    removeSelectedPhotos() {
        this.photos = this.photos.filter(photo => !this.selectedPhotos.has(photo.id));
        this.selectedPhotos.clear();
        this.updateUI();
    }

    async convertToPDF() {
        if (this.photos.length === 0) {
            this.showMessage('Please add some photos first.', 'error');
            return;
        }
        
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.convertBtn.disabled = true;
        this.progressContainer.classList.remove('hidden');
        this.resultContainer.classList.add('hidden');
        
        try {
            await this.generatePDF();
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showMessage('Error generating PDF. Please try again.', 'error');
        } finally {
            this.isProcessing = false;
            this.convertBtn.disabled = false;
            this.progressContainer.classList.add('hidden');
        }
    }

    async generatePDF() {
        const { jsPDF } = window.jspdf;
        
        // Get settings
        const pageSize = this.pageSize.value;
        const orientation = this.orientation.value;
        const layout = this.layout.value;
        const quality = this.quality.value;
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: pageSize
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        let currentPage = 0;
        
        for (let i = 0; i < this.photos.length; i++) {
            const photo = this.photos[i];
            
            this.updateProgress((i / this.photos.length) * 100, `Processing ${photo.name}...`);
            
            if (i > 0) {
                pdf.addPage();
            }
            
            await this.addPhotoToPDF(pdf, photo, pageWidth, pageHeight, margin, layout, quality);
        }
        
        this.updateProgress(100, 'Finalizing PDF...');
        
        // Save PDF
        this.pdfBlob = pdf.output('blob');
        this.showResult();
    }

    async addPhotoToPDF(pdf, photo, pageWidth, pageHeight, margin, layout, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                const aspectRatio = imgWidth / imgHeight;
                
                let drawWidth, drawHeight, x, y;
                
                switch (layout) {
                    case 'fit':
                        // Fit image to page while maintaining aspect ratio
                        const availableWidth = pageWidth - (margin * 2);
                        const availableHeight = pageHeight - (margin * 2);
                        
                        if (aspectRatio > (availableWidth / availableHeight)) {
                            drawWidth = availableWidth;
                            drawHeight = availableWidth / aspectRatio;
                        } else {
                            drawHeight = availableHeight;
                            drawWidth = availableHeight * aspectRatio;
                        }
                        
                        x = (pageWidth - drawWidth) / 2;
                        y = (pageHeight - drawHeight) / 2;
                        break;
                        
                    case 'fill':
                        // Fill entire page (may crop image)
                        drawWidth = pageWidth - (margin * 2);
                        drawHeight = pageHeight - (margin * 2);
                        x = margin;
                        y = margin;
                        break;
                        
                    case 'multiple':
                        // Multiple photos per page (2x2 grid)
                        drawWidth = (pageWidth - (margin * 3)) / 2;
                        drawHeight = (pageHeight - (margin * 3)) / 2;
                        x = margin;
                        y = margin;
                        break;
                }
                
                // Adjust quality
                const format = quality === 'high' ? 'JPEG' : 'JPEG';
                const compression = quality === 'high' ? 0.95 : quality === 'medium' ? 0.8 : 0.6;
                
                pdf.addImage(
                    photo.dataUrl, 
                    format, 
                    x, y, 
                    drawWidth, drawHeight, 
                    undefined, 
                    compression
                );
                
                resolve();
            };
            img.src = photo.dataUrl;
        });
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    showResult() {
        this.progressContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');
    }

    downloadPDF() {
        if (this.pdfBlob) {
            const url = URL.createObjectURL(this.pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photos-to-pdf-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    resetConverter() {
        this.photos = [];
        this.selectedPhotos.clear();
        this.pdfBlob = null;
        this.isProcessing = false;
        
        this.photoInput.value = '';
        this.progressBar.style.width = '0%';
        this.progressText.textContent = 'Preparing...';
        
        this.settingsPanel.classList.add('hidden');
        this.photosContainer.classList.add('hidden');
        this.convertSection.classList.add('hidden');
        this.progressContainer.classList.add('hidden');
        this.resultContainer.classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        // Create and show toast message
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-600 text-white' : 
            type === 'success' ? 'bg-green-600 text-white' : 
            'bg-blue-600 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhotoToPDFConverter();
});
