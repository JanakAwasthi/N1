// Advanced Photos to PDF Converter with User-Defined Ordering
class PhotosToPDFPro {
    constructor() {
        this.selectedPhotos = [];
        this.pdfSettings = {
            pageSize: 'A4',
            orientation: 'portrait',
            margin: 10,
            quality: 0.9,
            fitToPage: true,
            maintainAspectRatio: true
        };
        this.draggedIndex = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateUI();
    }

    setupEventListeners() {
        // File input
        document.getElementById('photo-input')?.addEventListener('change', (e) => this.handlePhotoSelection(e));
        document.getElementById('add-photos-btn')?.addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });

        // Settings
        document.getElementById('page-size')?.addEventListener('change', (e) => {
            this.pdfSettings.pageSize = e.target.value;
            this.updatePreview();
        });

        document.getElementById('orientation')?.addEventListener('change', (e) => {
            this.pdfSettings.orientation = e.target.value;
            this.updatePreview();
        });

        document.getElementById('fit-to-page')?.addEventListener('change', (e) => {
            this.pdfSettings.fitToPage = e.target.checked;
            this.updatePreview();
        });

        document.getElementById('maintain-aspect')?.addEventListener('change', (e) => {
            this.pdfSettings.maintainAspectRatio = e.target.checked;
            this.updatePreview();
        });

        document.getElementById('quality')?.addEventListener('input', (e) => {
            this.pdfSettings.quality = e.target.value / 100;
            document.getElementById('quality-value').textContent = e.target.value + '%';
            this.updatePreview();
        });

        document.getElementById('margin')?.addEventListener('input', (e) => {
            this.pdfSettings.margin = parseInt(e.target.value);
            document.getElementById('margin-value').textContent = e.target.value + 'mm';
            this.updatePreview();
        });

        // Actions
        document.getElementById('clear-all')?.addEventListener('click', () => this.clearAllPhotos());
        document.getElementById('auto-sort')?.addEventListener('click', () => this.autoSortPhotos());
        document.getElementById('reverse-order')?.addEventListener('click', () => this.reverseOrder());
        document.getElementById('generate-pdf')?.addEventListener('click', () => this.generatePDF());
        document.getElementById('preview-pdf')?.addEventListener('click', () => this.previewPDF());

        // Template buttons
        document.getElementById('template-collage')?.addEventListener('click', () => this.applyTemplate('collage'));
        document.getElementById('template-album')?.addEventListener('click', () => this.applyTemplate('album'));
        document.getElementById('template-document')?.addEventListener('click', () => this.applyTemplate('document'));
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('photos-container');
        const fileInput = document.getElementById('photo-input');

        // File drop zone
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                this.addPhotosFromFiles(imageFiles);
            } else {
                this.showNotification('Please drop valid image files', 'error');
            }
        }, false);
    }

    async handlePhotoSelection(e) {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            await this.addPhotosFromFiles(imageFiles);
        }
        
        // Reset file input
        e.target.value = '';
    }

    async addPhotosFromFiles(files) {
        this.showLoading(`Processing ${files.length} photo(s)...`);
        
        try {
            for (const file of files) {
                await this.addPhoto(file);
            }
            
            this.updateUI();
            this.updatePreview();
            this.showNotification(`Added ${files.length} photo(s) successfully!`, 'success');
            
        } catch (error) {
            console.error('Error adding photos:', error);
            this.showNotification('Error processing photos', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async addPhoto(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const photo = {
                        id: Date.now() + Math.random(),
                        file: file,
                        name: file.name,
                        size: file.size,
                        dataURL: e.target.result,
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.width / img.height,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.selectedPhotos.push(photo);
                    resolve(photo);
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    updateUI() {
        this.updatePhotosGrid();
        this.updateStats();
        this.updateActionButtons();
    }

    updatePhotosGrid() {
        const container = document.getElementById('photos-grid');
        container.innerHTML = '';
        
        if (this.selectedPhotos.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-images text-6xl mb-4 opacity-50"></i>
                    <p class="text-lg mb-2">No photos selected</p>
                    <p class="text-sm">Add photos to create your PDF</p>
                </div>
            `;
            return;
        }
        
        this.selectedPhotos.forEach((photo, index) => {
            const photoElement = document.createElement('div');
            photoElement.className = 'photo-item relative bg-white rounded-lg shadow-md overflow-hidden cursor-move hover:shadow-lg transition-shadow';
            photoElement.draggable = true;
            photoElement.dataset.index = index;
            
            photoElement.innerHTML = `
                <div class="aspect-square relative overflow-hidden">
                    <img src="${photo.dataURL}" alt="${photo.name}" class="w-full h-full object-cover">
                    <div class="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ${index + 1}
                    </div>
                    <div class="absolute top-2 right-2 flex space-x-1">
                        <button onclick="photosToPDF.rotatePhoto(${index})" class="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75">
                            <i class="fas fa-redo text-xs"></i>
                        </button>
                        <button onclick="photosToPDF.removePhoto(${index})" class="bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <div class="text-white text-xs truncate">${photo.name}</div>
                        <div class="text-white text-xs opacity-75">${photo.width}×${photo.height}</div>
                    </div>
                </div>
            `;
            
            // Add drag and drop event listeners
            photoElement.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
            photoElement.addEventListener('dragover', (e) => this.handleDragOver(e));
            photoElement.addEventListener('drop', (e) => this.handleDrop(e, index));
            photoElement.addEventListener('dragend', () => this.handleDragEnd());
            
            container.appendChild(photoElement);
        });
    }

    handleDragStart(e, index) {
        this.draggedIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('opacity-50');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
            // Move photo from draggedIndex to targetIndex
            const draggedPhoto = this.selectedPhotos[this.draggedIndex];
            this.selectedPhotos.splice(this.draggedIndex, 1);
            this.selectedPhotos.splice(targetIndex, 0, draggedPhoto);
            
            this.updateUI();
            this.updatePreview();
            this.showNotification('Photo order updated', 'success');
        }
    }

    handleDragEnd() {
        this.draggedIndex = null;
        document.querySelectorAll('.photo-item').forEach(item => {
            item.classList.remove('opacity-50');
        });
    }

    updateStats() {
        const stats = document.getElementById('photo-stats');
        if (!stats) return;
        
        const totalSize = this.selectedPhotos.reduce((sum, photo) => sum + photo.size, 0);
        const avgWidth = this.selectedPhotos.length > 0 ? 
            Math.round(this.selectedPhotos.reduce((sum, photo) => sum + photo.width, 0) / this.selectedPhotos.length) : 0;
        const avgHeight = this.selectedPhotos.length > 0 ? 
            Math.round(this.selectedPhotos.reduce((sum, photo) => sum + photo.height, 0) / this.selectedPhotos.length) : 0;
        
        stats.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-blue-600">${this.selectedPhotos.length}</div>
                    <div class="text-sm text-gray-600">Photos</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-green-600">${this.formatFileSize(totalSize)}</div>
                    <div class="text-sm text-gray-600">Total Size</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-purple-600">${avgWidth}×${avgHeight}</div>
                    <div class="text-sm text-gray-600">Avg Resolution</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-orange-600">${this.estimatePDFPages()}</div>
                    <div class="text-sm text-gray-600">PDF Pages</div>
                </div>
            </div>
        `;
    }

    updateActionButtons() {
        const hasPhotos = this.selectedPhotos.length > 0;
        
        document.getElementById('clear-all').disabled = !hasPhotos;
        document.getElementById('auto-sort').disabled = !hasPhotos;
        document.getElementById('reverse-order').disabled = !hasPhotos;
        document.getElementById('generate-pdf').disabled = !hasPhotos;
        document.getElementById('preview-pdf').disabled = !hasPhotos;
    }

    estimatePDFPages() {
        // Estimate based on settings and photo arrangements
        if (this.selectedPhotos.length === 0) return 0;
        
        // For now, assume one photo per page (can be enhanced for collages)
        return this.selectedPhotos.length;
    }

    rotatePhoto(index) {
        const photo = this.selectedPhotos[index];
        if (!photo) return;
        
        // Create canvas to rotate image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Swap width and height for 90-degree rotation
            canvas.width = img.height;
            canvas.height = img.width;
            
            // Rotate image
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            
            // Update photo data
            photo.dataURL = canvas.toDataURL('image/jpeg', 0.9);
            [photo.width, photo.height] = [photo.height, photo.width];
            photo.aspectRatio = photo.width / photo.height;
            
            this.updateUI();
            this.updatePreview();
        };
        
        img.src = photo.dataURL;
    }

    removePhoto(index) {
        if (confirm('Remove this photo from the PDF?')) {
            this.selectedPhotos.splice(index, 1);
            this.updateUI();
            this.updatePreview();
            this.showNotification('Photo removed', 'success');
        }
    }

    clearAllPhotos() {
        if (this.selectedPhotos.length === 0) return;
        
        if (confirm('Remove all photos? This cannot be undone.')) {
            this.selectedPhotos = [];
            this.updateUI();
            this.updatePreview();
            this.showNotification('All photos cleared', 'success');
        }
    }

    autoSortPhotos() {
        if (this.selectedPhotos.length <= 1) return;
        
        // Sort by filename
        this.selectedPhotos.sort((a, b) => a.name.localeCompare(b.name));
        this.updateUI();
        this.updatePreview();
        this.showNotification('Photos sorted by filename', 'success');
    }

    reverseOrder() {
        if (this.selectedPhotos.length <= 1) return;
        
        this.selectedPhotos.reverse();
        this.updateUI();
        this.updatePreview();
        this.showNotification('Photo order reversed', 'success');
    }

    applyTemplate(templateType) {
        if (this.selectedPhotos.length === 0) {
            this.showNotification('Add photos first', 'error');
            return;
        }
        
        switch (templateType) {
            case 'collage':
                this.pdfSettings.pageSize = 'A4';
                this.pdfSettings.orientation = 'portrait';
                this.pdfSettings.fitToPage = false;
                break;
            case 'album':
                this.pdfSettings.pageSize = 'A4';
                this.pdfSettings.orientation = 'landscape';
                this.pdfSettings.fitToPage = true;
                break;
            case 'document':
                this.pdfSettings.pageSize = 'A4';
                this.pdfSettings.orientation = 'portrait';
                this.pdfSettings.fitToPage = true;
                break;
        }
        
        this.updateSettingsUI();
        this.updatePreview();
        this.showNotification(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template applied`, 'success');
    }

    updateSettingsUI() {
        document.getElementById('page-size').value = this.pdfSettings.pageSize;
        document.getElementById('orientation').value = this.pdfSettings.orientation;
        document.getElementById('fit-to-page').checked = this.pdfSettings.fitToPage;
    }

    updatePreview() {
        if (this.selectedPhotos.length === 0) {
            document.getElementById('pdf-preview').innerHTML = '<div class="text-center text-gray-500 py-8">No preview available</div>';
            return;
        }
        
        const preview = document.getElementById('pdf-preview');
        const pageCount = Math.min(3, this.selectedPhotos.length); // Show first 3 pages
        
        preview.innerHTML = `
            <div class="space-y-4">
                ${this.selectedPhotos.slice(0, pageCount).map((photo, index) => `
                    <div class="border rounded-lg p-4 bg-white shadow-sm">
                        <div class="text-sm text-gray-600 mb-2">Page ${index + 1}</div>
                        <div class="aspect-[8.5/11] bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            <img src="${photo.dataURL}" alt="Page ${index + 1}" class="max-w-full max-h-full object-contain">
                        </div>
                        <div class="text-xs text-gray-500 mt-2">${photo.name}</div>
                    </div>
                `).join('')}
                ${this.selectedPhotos.length > 3 ? `
                    <div class="text-center text-gray-500 py-4">
                        ... and ${this.selectedPhotos.length - 3} more page(s)
                    </div>
                ` : ''}
            </div>
        `;
    }

    async generatePDF() {
        if (this.selectedPhotos.length === 0) {
            this.showNotification('Please add photos first', 'error');
            return;
        }
        
        try {
            this.showLoading('Generating PDF...');
            
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('PDF library not loaded');
            }
            
            // Create PDF with specified settings
            const pdf = new jsPDF({
                orientation: this.pdfSettings.orientation,
                unit: 'mm',
                format: this.pdfSettings.pageSize.toLowerCase()
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = this.pdfSettings.margin;
            const availableWidth = pageWidth - (2 * margin);
            const availableHeight = pageHeight - (2 * margin);
            
            for (let i = 0; i < this.selectedPhotos.length; i++) {
                const photo = this.selectedPhotos[i];
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Calculate image dimensions
                let imgWidth = availableWidth;
                let imgHeight = availableHeight;
                
                if (this.pdfSettings.maintainAspectRatio) {
                    const aspectRatio = photo.aspectRatio;
                    
                    if (this.pdfSettings.fitToPage) {
                        // Fit to page while maintaining aspect ratio
                        if (aspectRatio > (availableWidth / availableHeight)) {
                            // Image is wider
                            imgWidth = availableWidth;
                            imgHeight = availableWidth / aspectRatio;
                        } else {
                            // Image is taller
                            imgHeight = availableHeight;
                            imgWidth = availableHeight * aspectRatio;
                        }
                    } else {
                        // Use original aspect ratio
                        imgWidth = Math.min(availableWidth, photo.width * 0.264583); // px to mm
                        imgHeight = imgWidth / aspectRatio;
                    }
                }
                
                // Center image on page
                const x = margin + (availableWidth - imgWidth) / 2;
                const y = margin + (availableHeight - imgHeight) / 2;
                
                // Add image to PDF
                pdf.addImage(
                    photo.dataURL,
                    'JPEG',
                    x,
                    y,
                    imgWidth,
                    imgHeight,
                    undefined,
                    'FAST'
                );
                
                // Add filename as watermark if enabled
                if (document.getElementById('add-filename')?.checked) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(150);
                    pdf.text(photo.name, margin, pageHeight - 5);
                }
            }
            
            // Save PDF
            const filename = document.getElementById('pdf-filename')?.value || `photos-to-pdf-${Date.now()}.pdf`;
            pdf.save(filename);
            
            this.hideLoading();
            this.showNotification('PDF generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.hideLoading();
            this.showNotification('Error generating PDF: ' + error.message, 'error');
        }
    }

    async previewPDF() {
        if (this.selectedPhotos.length === 0) {
            this.showNotification('Please add photos first', 'error');
            return;
        }
        
        try {
            this.showLoading('Generating preview...');
            
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error('PDF library not loaded');
            }
            
            // Create PDF for preview
            const pdf = new jsPDF({
                orientation: this.pdfSettings.orientation,
                unit: 'mm',
                format: this.pdfSettings.pageSize.toLowerCase()
            });
            
            // Add first page only for preview
            const photo = this.selectedPhotos[0];
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = this.pdfSettings.margin;
            
            let imgWidth = pageWidth - (2 * margin);
            let imgHeight = pageHeight - (2 * margin);
            
            if (this.pdfSettings.maintainAspectRatio) {
                const aspectRatio = photo.aspectRatio;
                if (aspectRatio > (imgWidth / imgHeight)) {
                    imgHeight = imgWidth / aspectRatio;
                } else {
                    imgWidth = imgHeight * aspectRatio;
                }
            }
            
            const x = margin + (pageWidth - 2 * margin - imgWidth) / 2;
            const y = margin + (pageHeight - 2 * margin - imgHeight) / 2;
            
            pdf.addImage(photo.dataURL, 'JPEG', x, y, imgWidth, imgHeight);
            
            // Open preview
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            
            this.hideLoading();
            this.showNotification('Preview opened in new tab', 'success');
            
        } catch (error) {
            console.error('Error generating preview:', error);
            this.hideLoading();
            this.showNotification('Error generating preview: ' + error.message, 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        } text-white shadow-lg max-w-sm`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
                } mr-2"></i>
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
    window.photosToPDF = new PhotosToPDFPro();
});
