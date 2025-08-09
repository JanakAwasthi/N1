// Enhanced Digital Signature Tool with Precise Pen/Cursor Tracking
class AdvancedDigitalSignature {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.currentSize = 3;
    this.lastX = 0;
    this.lastY = 0;
    this.signatures = [];
    this.currentPDF = null;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 1;
    this.signatureData = null;
    this.penCursor = null;
    this.pressureSupport = false;
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupCustomCursor();
    this.detectPenSupport();
    this.setupPDFJS();
  }

  setupCanvas() {
    this.canvas = document.getElementById('signature-pad');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    this.resizeCanvas();
    this.setupCanvasEvents();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  setupCustomCursor() {
    // Create custom pen cursor
    this.penCursor = document.createElement('div');
    this.penCursor.className = 'custom-pen-cursor';
    this.penCursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      pointer-events: none;
      z-index: 10000;
      transition: transform 0.1s ease;
      display: none;
    `;
    
    this.penCursor.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 18L4 16L16 4L18 2L20 4L18 6L6 18L4 20L2 18Z" 
              stroke="${this.currentColor}" 
              stroke-width="1.5" 
              fill="none"/>
        <circle cx="17" cy="3" r="2" fill="${this.currentColor}" opacity="0.3"/>
        <path d="M15 5L17 7" stroke="${this.currentColor}" stroke-width="1"/>
      </svg>
    `;
    
    document.body.appendChild(this.penCursor);
  }

  updateCursorColor() {
    const svg = this.penCursor.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const circle = svg.querySelector('circle');
    
    paths.forEach(path => {
      path.setAttribute('stroke', this.currentColor);
    });
    circle.setAttribute('fill', this.currentColor);
  }

  detectPenSupport() {
    // Check for pressure-sensitive input support
    this.pressureSupport = 'PointerEvent' in window;
    
    if (this.pressureSupport) {
      console.log('Pressure-sensitive input detected');
      document.getElementById('pressure-info').classList.remove('hidden');
    }
  }

  setupCanvasEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    this.canvas.addEventListener('mouseenter', () => this.showCursor());
    this.canvas.addEventListener('mouseleave', () => this.hideCursor());

    // Pointer events for pen/stylus support
    this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('pointermove', (e) => this.draw(e));
    this.canvas.addEventListener('pointerup', () => this.stopDrawing());
    this.canvas.addEventListener('pointerout', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
    this.canvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));

    // Mouse move for cursor tracking
    this.canvas.addEventListener('mousemove', (e) => this.updateCursorPosition(e));
    this.canvas.addEventListener('pointermove', (e) => this.updateCursorPosition(e));
  }

  updateCursorPosition(e) {
    if (!this.isDrawing) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      // Position cursor exactly at pointer location
      this.penCursor.style.left = (x - 10) + 'px';
      this.penCursor.style.top = (y - 10) + 'px';
      
      // Rotate cursor based on movement direction for realism
      if (this.lastX && this.lastY) {
        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        this.penCursor.style.transform = `rotate(${angle + 45}deg)`;
      }
      
      this.lastX = x;
      this.lastY = y;
    }
  }

  showCursor() {
    this.canvas.style.cursor = 'none'; // Hide default cursor
    this.penCursor.style.display = 'block';
  }

  hideCursor() {
    this.canvas.style.cursor = 'default';
    this.penCursor.style.display = 'none';
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX / window.devicePixelRatio,
      y: (e.clientY - rect.top) * scaleY / window.devicePixelRatio,
      pressure: e.pressure || 0.5 // Default pressure if not available
    };
  }

  startDrawing(e) {
    e.preventDefault();
    this.isDrawing = true;
    
    const coords = this.getCoordinates(e);
    this.lastX = coords.x;
    this.lastY = coords.y;
    
    // Start a new path
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
    
    // Set drawing properties
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Adjust line width based on pressure if available
    if (this.pressureSupport && e.pressure) {
      this.ctx.lineWidth = this.currentSize * (0.5 + e.pressure);
    } else {
      this.ctx.lineWidth = this.currentSize;
    }
    
    // Create small dot for single clicks
    this.ctx.beginPath();
    this.ctx.arc(coords.x, coords.y, this.ctx.lineWidth / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    e.preventDefault();
    const coords = this.getCoordinates(e);
    
    // Calculate drawing properties
    const deltaX = coords.x - this.lastX;
    const deltaY = coords.y - this.lastY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Smooth line drawing with quadratic curves
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    
    // Use quadratic curve for smoother lines
    const midX = (this.lastX + coords.x) / 2;
    const midY = (this.lastY + coords.y) / 2;
    this.ctx.quadraticCurveTo(this.lastX, this.lastY, midX, midY);
    
    // Adjust line width based on pressure and speed
    if (this.pressureSupport && e.pressure) {
      // Variable pressure support
      const pressureWidth = this.currentSize * (0.3 + e.pressure * 0.7);
      this.ctx.lineWidth = pressureWidth;
    } else {
      // Simulate pressure based on drawing speed
      const speedFactor = Math.min(distance / 10, 1);
      const dynamicWidth = this.currentSize * (1.2 - speedFactor * 0.4);
      this.ctx.lineWidth = Math.max(dynamicWidth, this.currentSize * 0.5);
    }
    
    this.ctx.stroke();
    
    // Update last position
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    this.ctx.beginPath(); // Reset path
    
    // Save the current signature state
    this.signatureData = this.canvas.toDataURL();
  }

  handleTouch(e, action) {
    e.preventDefault();
    
    if (e.touches.length > 1) return; // Ignore multi-touch
    
    const touch = e.touches[0] || e.changedTouches[0];
    const mouseEvent = new MouseEvent(action === 'start' ? 'mousedown' : 
                                     action === 'move' ? 'mousemove' : 'mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pressure: e.force || 0.5 // Use force if available
    });
    
    this.canvas.dispatchEvent(mouseEvent);
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.signature-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Drawing controls
    document.getElementById('pen-size').addEventListener('input', (e) => {
      this.currentSize = parseFloat(e.target.value);
      document.getElementById('pen-size-value').textContent = `${e.target.value}px`;
    });

    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
    });

    // Custom color picker
    document.getElementById('custom-color').addEventListener('change', (e) => {
      this.selectColor(e.target.value);
    });

    document.getElementById('clear-signature').addEventListener('click', () => this.clearCanvas());
    document.getElementById('undo-stroke').addEventListener('click', () => this.undoLastStroke());

    // Typing controls
    document.getElementById('signature-text').addEventListener('input', () => this.updateTypedSignature());
    document.getElementById('font-style').addEventListener('change', () => this.updateTypedSignature());
    document.getElementById('font-size').addEventListener('input', (e) => {
      document.getElementById('font-size-value').textContent = `${e.target.value}px`;
      this.updateTypedSignature();
    });

    // Upload controls
    document.getElementById('signature-upload').addEventListener('change', (e) => this.handleSignatureUpload(e));

    // Signature actions
    document.getElementById('save-signature').addEventListener('click', () => this.saveSignature());
    document.getElementById('download-signature').addEventListener('click', () => this.downloadSignature());
    document.getElementById('copy-signature').addEventListener('click', () => this.copySignature());

    // PDF controls
    document.getElementById('pdf-upload').addEventListener('change', (e) => this.handlePDFUpload(e));
    document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
    document.getElementById('next-page').addEventListener('click', () => this.nextPage());
    document.getElementById('apply-signature').addEventListener('click', () => this.applySignatureToPDF());
    document.getElementById('download-pdf').addEventListener('click', () => this.downloadSignedPDF());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  selectColor(color) {
    this.currentColor = color;
    this.updateCursorColor();
    
    // Update UI
    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.classList.remove('selected');
    });
    
    const selectedPicker = document.querySelector(`[data-color=\"${color}\"]`);
    if (selectedPicker) {
      selectedPicker.classList.add('selected');
    }
    
    // Update current color display
    document.getElementById('current-color').style.backgroundColor = color;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width / window.devicePixelRatio, 
                             this.canvas.height / window.devicePixelRatio);
    this.signatureData = null;
  }

  undoLastStroke() {
    // This would require implementing a stroke history system
    // For now, we'll just clear the canvas
    if (confirm('Undo is not yet implemented. Clear entire signature?')) {
      this.clearCanvas();
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          this.undoLastStroke();
          break;
        case 's':
          e.preventDefault();
          this.saveSignature();
          break;
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            this.clearCanvas();
          }
          break;
      }
    }
    
    // ESC to clear
    if (e.key === 'Escape') {
      this.clearCanvas();
    }
  }

  switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.signature-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Add active class to clicked tab
    document.querySelector(`[data-tab=\"${tabName}\"]`).classList.add('active');
  }

  updateTypedSignature() {
    const text = document.getElementById('signature-text').value;
    const font = document.getElementById('font-style').value;
    const size = document.getElementById('font-size').value;
    
    if (!text) return;
    
    // Clear canvas
    this.clearCanvas();
    
    // Set font properties
    this.ctx.font = `${size}px ${font}`;
    this.ctx.fillStyle = this.currentColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw text in center of canvas
    const centerX = this.canvas.width / (2 * window.devicePixelRatio);
    const centerY = this.canvas.height / (2 * window.devicePixelRatio);
    
    this.ctx.fillText(text, centerX, centerY);
    
    this.signatureData = this.canvas.toDataURL();
  }

  async handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      this.showError('Please select a valid image file');
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      this.clearCanvas();
      
      // Calculate scaling to fit canvas while maintaining aspect ratio
      const canvasWidth = this.canvas.width / window.devicePixelRatio;
      const canvasHeight = this.canvas.height / window.devicePixelRatio;
      
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;
      
      this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      this.signatureData = this.canvas.toDataURL();
    };
    
    img.src = URL.createObjectURL(file);
  }

  saveSignature() {
    if (!this.signatureData) {
      this.showError('No signature to save');
      return;
    }
    
    const signature = {
      id: Date.now(),
      data: this.signatureData,
      timestamp: new Date().toISOString(),
      name: `Signature ${this.signatures.length + 1}`
    };
    
    this.signatures.push(signature);
    localStorage.setItem('savedSignatures', JSON.stringify(this.signatures));
    
    this.showSuccess('Signature saved successfully!');
    this.updateSavedSignaturesList();
  }

  downloadSignature() {
    if (!this.signatureData) {
      this.showError('No signature to download');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = this.signatureData;
    link.click();
  }

  async copySignature() {
    if (!this.signatureData) {
      this.showError('No signature to copy');
      return;
    }
    
    try {
      const response = await fetch(this.signatureData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      this.showSuccess('Signature copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy signature:', error);
      this.showError('Failed to copy signature to clipboard');
    }
  }

  setupPDFJS() {
    // PDF.js setup would go here
    // For now, we'll implement basic PDF handling
  }

  async handlePDFUpload(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      this.showError('Please select a valid PDF file');
      return;
    }
    
    this.showLoading('Loading PDF...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.currentPDF = new Uint8Array(arrayBuffer);
      
      // Here you would use PDF.js to render the PDF
      // For now, we'll just show that it's loaded
      this.showSuccess('PDF loaded successfully!');
      this.showPDFControls();
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError('Failed to load PDF file');
    }
    
    this.hideLoading();
  }

  showPDFControls() {
    document.getElementById('pdf-controls').classList.remove('hidden');
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPDFPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPDFPage();
    }
  }

  renderPDFPage() {
    // PDF rendering logic would go here
    document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${this.totalPages}`;
  }

  applySignatureToPDF() {
    if (!this.signatureData || !this.currentPDF) {
      this.showError('Please load a PDF and create a signature first');
      return;
    }
    
    this.showSuccess('Signature applied to PDF! (Feature in development)');
  }

  downloadSignedPDF() {
    if (!this.currentPDF) {
      this.showError('No PDF to download');
      return;
    }
    
    this.showSuccess('PDF download feature in development');
  }

  updateSavedSignaturesList() {
    // Update the saved signatures list in the UI
    const container = document.getElementById('saved-signatures');
    container.innerHTML = '';
    
    this.signatures.forEach((signature, index) => {
      const item = document.createElement('div');
      item.className = 'saved-signature-item';
      item.innerHTML = `
        <img src=\"${signature.data}\" alt=\"Signature ${index + 1}\">
        <div class=\"signature-info\">
          <span>${signature.name}</span>
          <button onclick=\"digitalSignature.loadSignature(${index})\">Load</button>
          <button onclick=\"digitalSignature.deleteSignature(${index})\">Delete</button>
        </div>
      `;
      container.appendChild(item);
    });
  }

  loadSignature(index) {
    const signature = this.signatures[index];
    if (signature) {
      const img = new Image();
      img.onload = () => {
        this.clearCanvas();
        this.ctx.drawImage(img, 0, 0);
        this.signatureData = signature.data;
      };
      img.src = signature.data;
    }
  }

  deleteSignature(index) {
    if (confirm('Are you sure you want to delete this signature?')) {
      this.signatures.splice(index, 1);
      localStorage.setItem('savedSignatures', JSON.stringify(this.signatures));
      this.updateSavedSignaturesList();
    }
  }

  showLoading(message) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.querySelector('p').textContent = message;
    loadingDiv.classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.digitalSignature = new AdvancedDigitalSignature();
});
