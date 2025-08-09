// Document Text Extractor functionality
class DocumentTextExtractor {
    constructor() {
        this.extractionHistory = JSON.parse(localStorage.getItem('extractionHistory') || '[]');
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
    }

    async handleFile(file) {
        if (!file) return;

        const fileType = file.type;
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        this.showProgress(true);
        this.updateProgress(0, 'Analyzing file...');

        try {
            let extractedText = '';
            const startTime = Date.now();

            if (fileType === 'application/pdf') {
                extractedText = await this.extractFromPDF(file);
            } else if (fileType.includes('word') || ['doc', 'docx'].includes(fileExtension)) {
                extractedText = await this.extractFromWord(file);
            } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(fileExtension)) {
                extractedText = await this.extractFromImage(file);
            } else {
                throw new Error('Unsupported file format');
            }

            const endTime = Date.now();
            const extractionTime = ((endTime - startTime) / 1000).toFixed(2);

            this.displayExtractedText(extractedText, fileName, extractionTime);
            this.addToHistory(fileName, extractedText, fileType, extractionTime);
            
            showNotification('Text extracted successfully!', 'success');
        } catch (error) {
            console.error('Extraction error:', error);
            showNotification('Error extracting text: ' + error.message, 'error');
        } finally {
            this.showProgress(false);
        }
    }

    async extractFromPDF(file) {
        this.updateProgress(20, 'Loading PDF...');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            this.updateProgress(20 + (60 * i / totalPages), `Extracting page ${i} of ${totalPages}...`);
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        this.updateProgress(90, 'Formatting text...');
        return this.formatExtractedText(fullText);
    }

    async extractFromWord(file) {
        this.updateProgress(30, 'Processing Word document...');
        
        // For Word documents, we'll read as text (basic extraction)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // This is a simplified approach - for full Word support, you'd need a proper library
                    let text = e.target.result;
                    
                    // Basic cleanup for binary content
                    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
                    text = text.replace(/\s+/g, ' ');
                    
                    this.updateProgress(80, 'Cleaning up text...');
                    resolve(this.formatExtractedText(text));
                } catch (error) {
                    reject(new Error('Failed to extract text from Word document'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Word document'));
            reader.readAsText(file);
        });
    }

    async extractFromImage(file) {
        this.updateProgress(10, 'Preparing image for OCR...');
        
        return new Promise((resolve, reject) => {
            Tesseract.recognize(
                file,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 70) + 20;
                            this.updateProgress(progress, `OCR processing: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            ).then(({ data: { text } }) => {
                this.updateProgress(95, 'Finalizing extraction...');
                resolve(this.formatExtractedText(text));
            }).catch((error) => {
                reject(new Error('OCR failed: ' + error.message));
            });
        });
    }

    formatExtractedText(text) {
        const preserveFormatting = document.getElementById('preserveFormatting').checked;
        const removeLineBreaks = document.getElementById('removeLineBreaks').checked;

        if (!preserveFormatting) {
            text = text.replace(/\s+/g, ' ');
        }

        if (removeLineBreaks) {
            text = text.replace(/\n+/g, ' ');
        }

        return text.trim();
    }

    displayExtractedText(text, fileName, extractionTime) {
        document.getElementById('extractedText').value = text;
        document.getElementById('extractedSection').classList.remove('hidden');
        
        // Update statistics
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = text.length;
        
        document.getElementById('textStats').textContent = 
            `${charCount} characters, ${wordCount} words`;
        document.getElementById('extractionTime').textContent = 
            `Extracted in ${extractionTime}s from ${fileName}`;

        // Scroll to results
        document.getElementById('extractedSection').scrollIntoView({ behavior: 'smooth' });
    }

    addToHistory(fileName, text, fileType, extractionTime) {
        const historyItem = {
            fileName: fileName,
            fileType: fileType,
            extractedText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            fullText: text,
            wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
            charCount: text.length,
            extractionTime: extractionTime,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        this.extractionHistory.unshift(historyItem);
        this.extractionHistory = this.extractionHistory.slice(0, 10); // Keep last 10
        localStorage.setItem('extractionHistory', JSON.stringify(this.extractionHistory));
        this.updateHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('extractionHistory');
        
        if (this.extractionHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No extractions yet</p>';
            return;
        }

        historyContainer.innerHTML = this.extractionHistory.map(item => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold text-gray-800">${item.fileName}</h4>
                        <p class="text-sm text-gray-600">
                            ${item.charCount} chars, ${item.wordCount} words • 
                            ${item.extractionTime}s • 
                            ${new Date(item.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewHistoryItem(${item.id})" 
                                class="text-blue-500 hover:text-blue-700 text-sm">
                            <i class="fas fa-eye mr-1"></i>View
                        </button>
                        <button onclick="copyHistoryItem(${item.id})" 
                                class="text-green-500 hover:text-green-700 text-sm">
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                    </div>
                </div>
                <div class="bg-gray-50 rounded p-3">
                    <p class="text-sm text-gray-700">${item.extractedText}</p>
                </div>
            </div>
        `).join('');
    }

    showProgress(show) {
        document.getElementById('progressSection').classList.toggle('hidden', !show);
        if (!show) {
            this.updateProgress(0, '');
        }
    }

    updateProgress(percent, message) {
        document.getElementById('progressBar').style.width = percent + '%';
        document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
        document.getElementById('progressMessage').textContent = message;
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the extraction history?')) {
            this.extractionHistory = [];
            localStorage.removeItem('extractionHistory');
            this.updateHistory();
            showNotification('History cleared successfully', 'success');
        }
    }

    viewHistoryItem(id) {
        const item = this.extractionHistory.find(h => h.id === id);
        if (item) {
            document.getElementById('extractedText').value = item.fullText;
            document.getElementById('extractedSection').classList.remove('hidden');
            document.getElementById('textStats').textContent = 
                `${item.charCount} characters, ${item.wordCount} words`;
            document.getElementById('extractionTime').textContent = 
                `Extracted in ${item.extractionTime}s from ${item.fileName}`;
            document.getElementById('extractedSection').scrollIntoView({ behavior: 'smooth' });
        }
    }

    copyHistoryItem(id) {
        const item = this.extractionHistory.find(h => h.id === id);
        if (item) {
            navigator.clipboard.writeText(item.fullText).then(() => {
                showNotification('Text copied to clipboard!', 'success');
            });
        }
    }
}

const textExtractor = new DocumentTextExtractor();

// Global functions
function copyExtractedText() {
    const text = document.getElementById('extractedText').value;
    if (!text) {
        showNotification('No text to copy', 'error');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showNotification('Text copied to clipboard!', 'success');
    });
}

function downloadExtractedText() {
    const text = document.getElementById('extractedText').value;
    if (!text) {
        showNotification('No text to download', 'error');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Text downloaded successfully!', 'success');
}

function clearHistory() {
    textExtractor.clearHistory();
}

function viewHistoryItem(id) {
    textExtractor.viewHistoryItem(id);
}

function copyHistoryItem(id) {
    textExtractor.copyHistoryItem(id);
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
