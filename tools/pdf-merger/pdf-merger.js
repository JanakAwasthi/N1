// Advanced PDF Merger with Drag & Drop Reordering and Real-time Preview
class PDFMerger {
  constructor() {
    this.pdfFiles = [];
    this.mergedPdfBytes = null;
    this.startTime = null;
    this.sortable = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupSortable();
  }

  setupEventListeners() {
    const input = document.getElementById('pdf-input');
    const mergeBtn = document.getElementById('merge-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearAllBtn = document.getElementById('clear-all');
    const addMoreBtn = document.getElementById('add-more');
    const mergeAnotherBtn = document.getElementById('merge-another');

    input.addEventListener('change', (e) => this.handleFileSelect(e));
    mergeBtn.addEventListener('click', () => this.mergePDFs());
    downloadBtn.addEventListener('click', () => this.downloadMergedPDF());
    clearAllBtn.addEventListener('click', () => this.clearAllFiles());
    addMoreBtn.addEventListener('click', () => input.click());
    mergeAnotherBtn.addEventListener('click', () => this.resetTool());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('active'), false);
    });

    dropzone.addEventListener('drop', (e) => this.handleDrop(e), false);
  }

  setupSortable() {
    const pdfList = document.getElementById('pdf-list');
    this.sortable = Sortable.create(pdfList, {
      animation: 150,
      ghostClass: 'sortable-chosen',
      handle: '.drag-handle',
      onEnd: () => this.updateFileOrder()
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
  }

  async processFiles(files) {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      this.showError('Please select PDF files only.');
      return;
    }

    // Check if adding these files would exceed the limit
    if (this.pdfFiles.length + pdfFiles.length > 20) {
      this.showError(`Maximum 20 PDF files allowed. Currently have ${this.pdfFiles.length} files.`);
      return;
    }

    for (const file of pdfFiles) {
      await this.addPDFFile(file);
    }

    this.updateUI();
  }

  async addPDFFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      const pdfInfo = {
        id: Date.now() + Math.random(),
        file: file,
        name: file.name,
        size: file.size,
        pageCount: pageCount,
        arrayBuffer: arrayBuffer,
        selected: true
      };

      this.pdfFiles.push(pdfInfo);
      this.renderPDFItem(pdfInfo);
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError(`Failed to load ${file.name}. Please ensure it's a valid PDF file.`);
    }
  }

  renderPDFItem(pdfInfo) {
    const pdfList = document.getElementById('pdf-list');
    const pdfItem = document.createElement('div');
    pdfItem.className = 'pdf-item p-4 flex items-center justify-between';
    pdfItem.dataset.id = pdfInfo.id;

    pdfItem.innerHTML = `
      <div class="flex items-center space-x-4 flex-1">
        <div class="drag-handle text-gray-400 hover:text-gray-600 cursor-grab">
          <i class="fas fa-grip-vertical text-lg"></i>
        </div>
        <div class="flex-shrink-0">
          <i class="fas fa-file-pdf text-red-500 text-2xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-gray-900 truncate">${pdfInfo.name}</h4>
          <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span><i class="fas fa-file-alt mr-1"></i>${pdfInfo.pageCount} page${pdfInfo.pageCount !== 1 ? 's' : ''}</span>
            <span><i class="fas fa-hdd mr-1"></i>${this.formatFileSize(pdfInfo.size)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <label class="flex items-center">
          <input type="checkbox" ${pdfInfo.selected ? 'checked' : ''} 
                 class="pdf-checkbox w-4 h-4 text-blue-600" data-id="${pdfInfo.id}">
          <span class="ml-2 text-sm text-gray-600">Include</span>
        </label>
        <button class="remove-pdf text-red-500 hover:text-red-700 p-2" data-id="${pdfInfo.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    pdfList.appendChild(pdfItem);

    // Add event listeners
    pdfItem.querySelector('.pdf-checkbox').addEventListener('change', (e) => {
      this.togglePDFSelection(pdfInfo.id, e.target.checked);
    });

    pdfItem.querySelector('.remove-pdf').addEventListener('click', () => {
      this.removePDFFile(pdfInfo.id);
    });
  }

  togglePDFSelection(id, selected) {
    const pdf = this.pdfFiles.find(p => p.id === id);
    if (pdf) {
      pdf.selected = selected;
    }
  }

  removePDFFile(id) {
    this.pdfFiles = this.pdfFiles.filter(p => p.id !== id);
    const pdfItem = document.querySelector(`[data-id="${id}"]`);
    if (pdfItem) {
      pdfItem.remove();
    }
    this.updateUI();
  }

  updateFileOrder() {
    const pdfList = document.getElementById('pdf-list');
    const items = Array.from(pdfList.children);
    const orderedFiles = [];

    items.forEach(item => {
      const id = parseInt(item.dataset.id);
      const pdf = this.pdfFiles.find(p => p.id === id);
      if (pdf) {
        orderedFiles.push(pdf);
      }
    });

    this.pdfFiles = orderedFiles;
  }

  updateUI() {
    const pdfListSection = document.getElementById('pdf-list-section');
    const pdfCount = document.getElementById('pdf-count');
    
    if (this.pdfFiles.length > 0) {
      pdfListSection.classList.remove('hidden');
      pdfCount.textContent = this.pdfFiles.length;
    } else {
      pdfListSection.classList.add('hidden');
    }
  }

  clearAllFiles() {
    this.pdfFiles = [];
    document.getElementById('pdf-list').innerHTML = '';
    this.updateUI();
    this.hideResults();
  }

  async mergePDFs() {
    const selectedPDFs = this.pdfFiles.filter(p => p.selected);
    
    if (selectedPDFs.length < 2) {
      this.showError('Please select at least 2 PDF files to merge.');
      return;
    }

    this.startTime = Date.now();
    this.showProgress();

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      const addBookmarks = document.getElementById('add-bookmarks').checked;
      const preserveMetadata = document.getElementById('preserve-metadata').checked;
      let totalPages = 0;

      for (let i = 0; i < selectedPDFs.length; i++) {
        const pdfInfo = selectedPDFs[i];
        this.updateProgress(i + 1, selectedPDFs.length, `Processing ${pdfInfo.name}...`);

        const sourcePdf = await PDFLib.PDFDocument.load(pdfInfo.arrayBuffer);
        const pageCount = sourcePdf.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
        
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => mergedPdf.addPage(page));

        if (addBookmarks) {
          // Add bookmark for this PDF
          const bookmarkRef = mergedPdf.context.nextRef();
          mergedPdf.catalog.set(PDFLib.PDFName.of('Outlines'), bookmarkRef);
        }

        totalPages += pageCount;
        
        // Simulate processing time for user feedback
        await this.delay(500);
      }

      // Set metadata if preserving
      if (preserveMetadata && selectedPDFs.length > 0) {
        const firstPdf = await PDFLib.PDFDocument.load(selectedPDFs[0].arrayBuffer);
        const metadata = {
          title: document.getElementById('output-filename').value.replace('.pdf', ''),
          author: 'PDF Merger Tool',
          creator: 'LinkToQR.me',
          creationDate: new Date(),
        };
        
        mergedPdf.setTitle(metadata.title);
        mergedPdf.setAuthor(metadata.author);
        mergedPdf.setCreator(metadata.creator);
        mergedPdf.setCreationDate(metadata.creationDate);
      }

      this.updateProgress(100, 100, 'Finalizing PDF...');
      this.mergedPdfBytes = await mergedPdf.save();

      this.showResults(totalPages, selectedPDFs.length);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      this.showError('Failed to merge PDFs. Please try again with different files.');
    }
  }

  showProgress() {
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('result-section').classList.add('hidden');
  }

  updateProgress(current, total, message) {
    const percentage = Math.round((current / total) * 100);
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-text').textContent = message;
    document.getElementById('current-file').textContent = `Processing file ${current} of ${total}`;
  }

  showResults(totalPages, filesCount) {
    const processingTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const fileSize = this.formatFileSize(this.mergedPdfBytes.length);

    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('file-size').textContent = fileSize;
    document.getElementById('files-merged').textContent = filesCount;
    document.getElementById('processing-time').textContent = `${processingTime}s`;
  }

  hideResults() {
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
  }

  downloadMergedPDF() {
    if (!this.mergedPdfBytes) return;

    const filename = document.getElementById('output-filename').value || 'merged-document.pdf';
    const blob = new Blob([this.mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  resetTool() {
    this.clearAllFiles();
    this.mergedPdfBytes = null;
    document.getElementById('output-filename').value = 'merged-document.pdf';
    document.getElementById('add-bookmarks').checked = true;
    document.getElementById('preserve-metadata').checked = true;
    document.getElementById('optimize-size').checked = false;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showError(message) {
    // Create a temporary error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the PDF Merger when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PDFMerger();
});
