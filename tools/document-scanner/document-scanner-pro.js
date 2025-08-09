/* ===== SIMPLE DOCUMENT SCANNER (Safe, dependency-free) =====
   - Keeps only stable essentials to avoid runtime errors
   - Features: Start/Stop camera, capture frame, upload images, batch thumbnails, preview, download image, export PDF (if jsPDF present)
   - No OpenCV / Tesseract / JSZip dependencies
*/

class SimpleDocumentScanner {
  constructor() {
    // State
    this.stream = null;
    this.isScanning = false;
    this.currentBatch = []; // { id, dataURL, width, height }
    this.selectedPageIndex = -1;

    // Canvas (processing)
    this.canvas = document.getElementById('scan-canvas') || document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateBatchDisplay();
    this.updateBatchStats();
  }

  // ---------- UI helpers ----------
  showLoading(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      const p = loading.querySelector('p');
      if (p) p.textContent = message || 'Please wait…';
      loading.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
  }

  showNotification(message, type = 'success') {
    // Prefer site-wide notifier if available
    if (window.FuturisticUtils?.showNotification) {
      window.FuturisticUtils.showNotification(message, type, 3000);
      return;
    }
    // Fallback minimal toast
    const el = document.createElement('div');
    el.className = `fixed top-4 right-4 z-50 text-white px-4 py-2 rounded shadow ${
      type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-blue-600' : 'bg-green-600'
    }`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---------- Events ----------
  setupEventListeners() {
    document.getElementById('start-camera-btn')?.addEventListener('click', () => this.startCamera());
    document.getElementById('stop-camera-btn')?.addEventListener('click', () => this.stopCamera());
    document.getElementById('capture-btn')?.addEventListener('click', () => this.captureDocument());

    document.getElementById('browse-images-btn')?.addEventListener('click', () =>
      document.getElementById('image-input')?.click()
    );
    document.getElementById('image-input')?.addEventListener('change', (e) => this.handleImageUpload(e));

    document.getElementById('download-image-btn')?.addEventListener('click', () => this.downloadSelectedImage());
    document.getElementById('download-pdf-btn')?.addEventListener('click', () => this.exportToPDF());

    // Optional helpers if present in the UI
    document.getElementById('scan-another-btn')?.addEventListener('click', () => this.resetScanner());
    document.getElementById('clear-batch-btn')?.addEventListener('click', () => this.clearBatch());

    // Drag & Drop on camera container (optional)
    const dropZone = document.getElementById('camera-container');
    if (dropZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
        dropZone.addEventListener(ev, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });
      dropZone.addEventListener('drop', (e) => this.handleDrop(e));
    }
  }

  // ---------- Camera ----------
  async startCamera() {
    try {
      this.showLoading('Starting camera…');

      const constraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.getElementById('camera-video');
      if (!video) throw new Error('#camera-video not found');
      video.srcObject = this.stream;
      await video.play();

      this.isScanning = true;
      this.showNotification('Camera started', 'success');
    } catch (err) {
      console.error(err);
      this.showNotification(`Failed to start camera: ${err.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    const video = document.getElementById('camera-video');
    if (video) video.srcObject = null;
    this.isScanning = false;
    this.showNotification('Camera stopped', 'info');
  }

  // ---------- Capture / Upload ----------
  captureDocument() {
    if (!this.isScanning) {
      this.showNotification('Camera not active', 'error');
      return;
    }
    const video = document.getElementById('camera-video');
    if (!video || !video.videoWidth) {
      this.showNotification('Camera not ready yet', 'error');
      return;
    }

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.ctx.drawImage(video, 0, 0);

    const dataURL = this.canvas.toDataURL('image/jpeg', 0.9);
    this.addPageToBatch({ dataURL, width: this.canvas.width, height: this.canvas.height });
    this.showFlash();
    this.showNotification('Page captured', 'success');
  }

  handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.filter(f => f.type.startsWith('image/')).forEach((file) => this.processUploadedImage(file));
  }

  processUploadedImage(file) {
    const img = new Image();
    img.onload = () => {
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      this.ctx.drawImage(img, 0, 0);
      const dataURL = this.canvas.toDataURL('image/jpeg', 0.9);
      this.addPageToBatch({ dataURL, width: this.canvas.width, height: this.canvas.height });
    };
    img.onerror = () => this.showNotification('Failed to load image', 'error');
    img.src = URL.createObjectURL(file);
  }

  handleDrop(e) {
    const files = Array.from(e.dataTransfer?.files || []);
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) {
      this.showNotification('Drop image files only', 'error');
      return;
    }
    imgs.forEach((f) => this.processUploadedImage(f));
  }

  // ---------- Batch ----------
  addPageToBatch({ dataURL, width, height }) {
    const page = { id: Date.now() + Math.random(), dataURL, width, height };
    this.currentBatch.push(page);
    this.updateBatchDisplay();
    this.updateBatchStats();
  }

  updateBatchDisplay() {
    const container = document.getElementById('batch-pages');
    if (!container) return;
    container.innerHTML = '';

    this.currentBatch.forEach((page, index) => {
      const div = document.createElement('div');
      div.className = 'page-thumb relative cursor-pointer hover:shadow-lg transition';
      div.innerHTML = `
        <img src="${page.dataURL}" alt="Page ${index + 1}" class="w-full h-24 object-cover rounded"/>
        <div class="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">${index + 1}</div>
      `;
      div.addEventListener('click', () => this.selectPage(index));
      container.appendChild(div);
    });

    // Auto-select last added
    if (this.currentBatch.length && this.selectedPageIndex === -1) {
      this.selectPage(this.currentBatch.length - 1);
    }
  }

  updateBatchStats() {
    const stats = document.getElementById('batch-stats');
    if (!stats) return;
    const totalBytes = this.currentBatch.reduce((sum, p) => sum + Math.max(0, (p.dataURL.length - 22) * 0.75), 0);
    const sizeStr = totalBytes < 1024
      ? `${Math.round(totalBytes)} B`
      : totalBytes < 1024 * 1024
      ? `${Math.round(totalBytes / 1024)} KB`
      : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    stats.innerHTML = `<div class="text-sm text-gray-600">${this.currentBatch.length} pages • ${sizeStr}</div>`;
  }

  selectPage(index) {
    this.selectedPageIndex = index;
    document.querySelectorAll('#batch-pages .page-thumb').forEach((el, i) => {
      el.classList.toggle('ring-2', i === index);
      el.classList.toggle('ring-blue-500', i === index);
    });
    const page = this.currentBatch[index];
    const preview = document.getElementById('page-preview');
    if (page && preview) {
      preview.innerHTML = `<img src="${page.dataURL}" alt="Preview" class="max-w-full max-h-full object-contain"/>`;
    }
  }

  clearBatch() {
    this.currentBatch = [];
    this.selectedPageIndex = -1;
    this.updateBatchDisplay();
    this.updateBatchStats();
    const preview = document.getElementById('page-preview');
    if (preview) preview.innerHTML = '';
  }

  resetScanner() {
    this.clearBatch();
    this.stopCamera();
  }

  // ---------- Export ----------
  downloadSelectedImage() {
    const page = this.currentBatch[this.selectedPageIndex];
    if (!page) {
      this.showNotification('Select a page first', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = page.dataURL;
    a.download = `scan-${this.selectedPageIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  exportToPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      this.showNotification('PDF export not available (jsPDF missing)', 'error');
      return;
    }
    if (!this.currentBatch.length) {
      this.showNotification('No pages to export', 'error');
      return;
    }

    try {
      this.showLoading('Generating PDF…');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      this.currentBatch.forEach((p, idx) => {
        if (idx > 0) pdf.addPage();
        // Fit image into page with margin
        const img = new Image();
        img.src = p.dataURL;
        // Estimate aspect fit based on stored width/height
        const w = p.width || img.width || 1000;
        const h = p.height || img.height || 1000;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / w, maxH / h);
        const drawW = w * scale;
        const drawH = h * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        pdf.addImage(p.dataURL, 'JPEG', x, y, drawW, drawH);
      });

      pdf.save(`document-batch-${Date.now()}.pdf`);
      this.showNotification('PDF exported', 'success');
    } catch (e) {
      console.error(e);
      this.showNotification('Failed to export PDF', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // ---------- Effects ----------
  showFlash() {
    const fx = document.createElement('div');
    fx.className = 'fixed inset-0 bg-white opacity-50 pointer-events-none z-50';
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 120);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.documentScanner = new SimpleDocumentScanner();
});
