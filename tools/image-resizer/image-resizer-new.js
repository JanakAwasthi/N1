// Fully Functional Image Resizer
class ImageResizerNew {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.aspectRatio = 1;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const qualityInput = document.getElementById('quality');
    const maintainAspect = document.getElementById('maintain-aspect');
    const downloadBtn = document.getElementById('download-btn');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (widthInput) widthInput.addEventListener('input', () => this.handleDimensionChange('width'));
    if (heightInput) heightInput.addEventListener('input', () => this.handleDimensionChange('height'));
    if (qualityInput) qualityInput.addEventListener('input', () => this.updateQualityDisplay());
    if (maintainAspect) maintainAspect.addEventListener('change', () => this.toggleAspectRatio());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadImage());

    // Real-time updates
    [widthInput, heightInput, qualityInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.processImage());
      }
    });
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Highlight drop area when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.loadImage(files[0]);
      }
    });

    // Click to browse
    dropzone.addEventListener('click', () => {
      const input = document.getElementById('image-input');
      if (input) input.click();
    });
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }

  loadImage(file) {
    if (!file.type.startsWith('image/')) {
      this.showStatus('Please select a valid image file.', 'error');
      return;
    }

    this.originalFile = file;
    this.showProgress(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.aspectRatio = img.width / img.height;
        this.displayOriginalImage(img);
        this.displayFileInfo(file, img);
        this.setupDefaultDimensions(img);
        this.showControls();
        this.processImage();
        this.showProgress(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  displayOriginalImage(img) {
    const preview = document.getElementById('original-preview');
    if (!preview) return;
    
    preview.innerHTML = `
      <h3 class="text-lg font-medium text-cyan-400 mb-3">Original Image</h3>
      <div class="text-center space-y-3">
        <img src="${img.src}" alt="Original" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #00d4ff;">
      </div>
    `;
    preview.classList.remove('hidden');
  }

  displayFileInfo(file, img) {
    const fileInfo = document.getElementById('file-info');
    if (!fileInfo) return;
    
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    fileInfo.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">Original Size:</span>
          <span class="text-white">${img.width} × ${img.height}px</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">File Size:</span>
          <span class="text-white">${fileSizeMB} MB</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Format:</span>
          <span class="text-white">${file.type}</span>
        </div>
      </div>
    `;
  }

  setupDefaultDimensions(img) {
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    if (widthInput) widthInput.value = img.width;
    if (heightInput) heightInput.value = img.height;
  }

  showControls() {
    const controls = document.getElementById('resize-controls');
    if (controls) controls.classList.remove('hidden');
  }

  handleDimensionChange(changedField) {
    const maintainAspect = document.getElementById('maintain-aspect');
    if (!maintainAspect || !maintainAspect.checked) return;

    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    if (!widthInput || !heightInput) return;

    if (changedField === 'width') {
      const newWidth = parseInt(widthInput.value);
      const newHeight = Math.round(newWidth / this.aspectRatio);
      heightInput.value = newHeight;
    } else {
      const newHeight = parseInt(heightInput.value);
      const newWidth = Math.round(newHeight * this.aspectRatio);
      widthInput.value = newWidth;
    }
  }

  updateQualityDisplay() {
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    
    if (qualityInput && qualityValue) {
      qualityValue.textContent = qualityInput.value;
    }
  }

  toggleAspectRatio() {
    // This method is called when the maintain aspect ratio checkbox is toggled
    // No additional logic needed for now
  }

  processImage() {
    if (!this.originalImage) return;

    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const qualityInput = document.getElementById('quality');

    if (!widthInput || !heightInput || !qualityInput) return;

    const newWidth = parseInt(widthInput.value) || this.originalImage.width;
    const newHeight = parseInt(heightInput.value) || this.originalImage.height;
    const quality = parseInt(qualityInput.value) / 100;

    // Set canvas dimensions
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Draw resized image
    this.ctx.clearRect(0, 0, newWidth, newHeight);
    this.ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);

    // Show preview
    this.showResizedPreview();
    this.updateOutputInfo(newWidth, newHeight);
    
    // Enable download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.disabled = false;
  }
  showResizedPreview() {
    const preview = document.getElementById('resized-preview');
    if (!preview) return;

    const dataUrl = this.canvas.toDataURL('image/png');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    const newWidth = widthInput ? parseInt(widthInput.value) : this.originalImage.width;
    const newHeight = heightInput ? parseInt(heightInput.value) : this.originalImage.height;
    
    preview.innerHTML = `
      <h3 class="text-lg font-medium text-green-400 mb-3">Resized Preview</h3>
      <div class="text-center space-y-3">
        <img src="${dataUrl}" alt="Resized" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #00ff88;">
        <div class="text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-400">New Size:</span>
            <span class="text-green-400">${newWidth} × ${newHeight}px</span>
          </div>
        </div>
      </div>
    `;
    preview.classList.remove('hidden');
  }

  updateOutputInfo(width, height) {
    const outputInfo = document.getElementById('output-info');
    if (!outputInfo) return;

    // Estimate file size
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.9);
    const estimatedSize = Math.round((dataUrl.length * 3/4) / 1024);

    outputInfo.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">New Size:</span>
          <span class="text-green-400">${width} × ${height}px</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Estimated Size:</span>
          <span class="text-green-400">${estimatedSize} KB</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Compression:</span>
          <span class="text-green-400">${this.getCompressionRatio()}%</span>
        </div>
      </div>
    `;
  }

  getCompressionRatio() {
    if (!this.originalFile || !this.canvas) return '0';
    
    const originalSize = this.originalFile.size;
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.9);
    const newSize = Math.round((dataUrl.length * 3/4));
    
    return Math.round(((originalSize - newSize) / originalSize) * 100);
  }

  downloadImage() {
    if (!this.canvas) return;

    const qualityInput = document.getElementById('quality');
    const quality = qualityInput ? parseInt(qualityInput.value) / 100 : 0.9;

    const link = document.createElement('a');
    link.download = `resized-${Date.now()}.jpg`;
    link.href = this.canvas.toDataURL('image/jpeg', quality);
    link.click();

    this.showStatus('Image downloaded successfully!', 'success');
  }

  showProgress(show) {
    const spinner = document.getElementById('loading');
    if (spinner) {
      spinner.classList.toggle('hidden', !show);
    }
  }

  showStatus(message, type) {
    // Create status message
    const statusEl = document.createElement('div');
    statusEl.className = `status-message status-${type}`;
    statusEl.textContent = message;

    // Find container and add message
    const container = document.querySelector('.output-section') || document.body;
    container.appendChild(statusEl);

    // Remove after 3 seconds
    setTimeout(() => {
      statusEl.remove();
    }, 3000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.imageResizer = new ImageResizerNew();
});
