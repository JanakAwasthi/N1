// Document Watermark functionality
class DocumentWatermark {
    constructor() {
        this.pdfDoc = null;
        this.currentFile = null;
        this.watermarkType = 'text';
        this.position = 'center';
        this.processingHistory = JSON.parse(localStorage.getItem('watermarkHistory') || '[]');
        this.setupEventListeners();
        this.updateHistory();
    }

    setupEventListeners() {
        // File input handling
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFile(e.target.files[0]);
        });

        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFile(e.dataTransfer.files[0]);
        });

        // Range inputs
        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
        });

        document.getElementById('rotation').addEventListener('input', (e) => {
            document.getElementById('rotationValue').textContent = e.target.value + '°';
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = Math.round(e.target.value * 100) + '%';
        });

        document.getElementById('imageScale').addEventListener('input', (e) => {
            document.getElementById('imageScaleValue').textContent = Math.round(e.target.value * 100) + '%';
        });
    }

    async handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showNotification('Please select a valid PDF file', 'error');
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            this.currentFile = file;

            // Display file info
            document.getElementById('pdfFileName').textContent = file.name;
            document.getElementById('pdfDetails').textContent = 
                `${this.pdfDoc.getPageCount()} pages • ${this.formatFileSize(file.size)}`;
            
            document.getElementById('pdfInfo').classList.remove('hidden');
            document.getElementById('watermarkConfig').classList.remove('hidden');

            showNotification('PDF loaded successfully', 'success');
        } catch (error) {
            showNotification('Error loading PDF: ' + error.message, 'error');
        }
    }

    setWatermarkType(type) {
        this.watermarkType = type;
        
        // Update button states
        document.getElementById('textWatermark').className = 
            type === 'text' ? 'position-button active px-4 py-2 rounded-md border transition-colors' :
            'position-button px-4 py-2 rounded-md border transition-colors';
        
        document.getElementById('imageWatermark').className = 
            type === 'image' ? 'position-button active px-4 py-2 rounded-md border transition-colors' :
            'position-button px-4 py-2 rounded-md border transition-colors';

        // Show/hide options
        document.getElementById('textOptions').classList.toggle('hidden', type !== 'text');
        document.getElementById('imageOptions').classList.toggle('hidden', type !== 'image');
    }

    setPosition(position) {
        this.position = position;
        
        // Update all position buttons
        document.querySelectorAll('.position-button').forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(position)) {
                btn.classList.add('active');
            } else if (btn.onclick) {
                btn.classList.remove('active');
            }
        });
    }

    async previewWatermark() {
        if (!this.pdfDoc) {
            showNotification('Please load a PDF first', 'error');
            return;
        }

        try {
            const previewArea = document.getElementById('previewArea');
            
            if (this.watermarkType === 'text') {
                const text = document.getElementById('watermarkText').value || 'WATERMARK';
                const fontSize = document.getElementById('fontSize').value;
                const color = document.getElementById('textColor').value;
                const rotation = document.getElementById('rotation').value;
                const opacity = document.getElementById('opacity').value;

                previewArea.innerHTML = `
                    <div style="
                        position: relative;
                        width: 400px;
                        height: 300px;
                        background: #f9f9f9;
                        border: 2px dashed #ccc;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="
                            color: ${color};
                            font-size: ${Math.min(fontSize, 60)}px;
                            font-weight: bold;
                            opacity: ${opacity};
                            transform: rotate(${rotation}deg);
                            user-select: none;
                        ">${text}</div>
                    </div>
                `;
            } else {
                previewArea.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-image text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-600">Image watermark preview</p>
                        <p class="text-sm text-gray-500">Upload an image to see preview</p>
                    </div>
                `;
            }

            document.getElementById('previewSection').classList.remove('hidden');
            showNotification('Preview generated', 'success');
        } catch (error) {
            showNotification('Error generating preview: ' + error.message, 'error');
        }
    }

    async applyWatermark() {
        if (!this.pdfDoc) {
            showNotification('Please load a PDF first', 'error');
            return;
        }

        try {
            showNotification('Applying watermark...', 'info');

            const pdfDoc = await PDFLib.PDFDocument.create();
            const pages = await pdfDoc.copyPages(this.pdfDoc, this.pdfDoc.getPageIndices());
            
            const opacity = parseFloat(document.getElementById('opacity').value);

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                pdfDoc.addPage(page);

                const { width, height } = page.getSize();
                
                if (this.watermarkType === 'text') {
                    await this.addTextWatermark(page, width, height, opacity);
                } else {
                    await this.addImageWatermark(page, width, height, opacity);
                }
            }

            const pdfBytes = await pdfDoc.save();
            this.downloadPDF(pdfBytes, this.currentFile.name);
            
            this.addToHistory(this.currentFile.name, this.watermarkType);
            showNotification('Watermark applied successfully!', 'success');
        } catch (error) {
            showNotification('Error applying watermark: ' + error.message, 'error');
        }
    }

    async addTextWatermark(page, pageWidth, pageHeight, opacity) {
        const text = document.getElementById('watermarkText').value || 'WATERMARK';
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const color = this.hexToRgb(document.getElementById('textColor').value);
        const rotation = parseInt(document.getElementById('rotation').value);

        const position = this.calculatePosition(pageWidth, pageHeight, fontSize);

        page.drawText(text, {
            x: position.x,
            y: position.y,
            size: fontSize,
            color: PDFLib.rgb(color.r / 255, color.g / 255, color.b / 255),
            opacity: opacity,
            rotate: PDFLib.degrees(rotation)
        });
    }

    async addImageWatermark(page, pageWidth, pageHeight, opacity) {
        const imageInput = document.getElementById('watermarkImage');
        if (!imageInput.files[0]) {
            throw new Error('Please select an image for watermark');
        }

        const imageFile = imageInput.files[0];
        const imageBytes = await imageFile.arrayBuffer();
        const scale = parseFloat(document.getElementById('imageScale').value);

        let image;
        if (imageFile.type === 'image/png') {
            image = await this.pdfDoc.embedPng(imageBytes);
        } else {
            image = await this.pdfDoc.embedJpg(imageBytes);
        }

        const { width: imgWidth, height: imgHeight } = image.scale(scale);
        const position = this.calculatePosition(pageWidth, pageHeight, Math.max(imgWidth, imgHeight));

        page.drawImage(image, {
            x: position.x - imgWidth / 2,
            y: position.y - imgHeight / 2,
            width: imgWidth,
            height: imgHeight,
            opacity: opacity
        });
    }

    calculatePosition(pageWidth, pageHeight, elementSize) {
        const positions = {
            'top-left': { x: 50, y: pageHeight - 50 },
            'top-center': { x: pageWidth / 2, y: pageHeight - 50 },
            'top-right': { x: pageWidth - 50, y: pageHeight - 50 },
            'center-left': { x: 50, y: pageHeight / 2 },
            'center': { x: pageWidth / 2, y: pageHeight / 2 },
            'center-right': { x: pageWidth - 50, y: pageHeight / 2 },
            'bottom-left': { x: 50, y: 50 },
            'bottom-center': { x: pageWidth / 2, y: 50 },
            'bottom-right': { x: pageWidth - 50, y: 50 }
        };

        return positions[this.position] || positions['center'];
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 0, b: 0 };
    }

    downloadPDF(pdfBytes, originalName) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName.replace('.pdf', '_watermarked.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addToHistory(fileName, watermarkType) {
        const historyItem = {
            fileName: fileName,
            watermarkType: watermarkType,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        this.processingHistory.unshift(historyItem);
        this.processingHistory = this.processingHistory.slice(0, 10);
        localStorage.setItem('watermarkHistory', JSON.stringify(this.processingHistory));
        this.updateHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('processingHistory');
        
        if (this.processingHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No watermarked documents yet</p>';
            return;
        }

        historyContainer.innerHTML = this.processingHistory.map(item => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-gray-800">${item.fileName}</h4>
                        <p class="text-sm text-gray-600">
                            ${item.watermarkType} watermark • 
                            ${new Date(item.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <i class="fas fa-stamp text-blue-500"></i>
                </div>
            </div>
        `).join('');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the processing history?')) {
            this.processingHistory = [];
            localStorage.removeItem('watermarkHistory');
            this.updateHistory();
            showNotification('History cleared successfully', 'success');
        }
    }
}

const documentWatermark = new DocumentWatermark();

// Global functions
function setWatermarkType(type) {
    documentWatermark.setWatermarkType(type);
}

function setPosition(position) {
    documentWatermark.setPosition(position);
}

function previewWatermark() {
    documentWatermark.previewWatermark();
}

function applyWatermark() {
    documentWatermark.applyWatermark();
}

function clearHistory() {
    documentWatermark.clearHistory();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
