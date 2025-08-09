// Advanced Image Merger - Front and Back Image Merger
class ImageMerger {
  constructor() {
    this.frontImage = null;
    this.backImage = null;
    this.frontFile = null;
    this.backFile = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    const frontInput = document.getElementById('front-input');
    const backInput = document.getElementById('back-input');
    const mergeBtn = document.getElementById('merge-btn');
    const downloadBtn = document.getElementById('download-merged');
    const layoutSelect = document.getElementById('layout-select');
    const spacingInput = document.getElementById('spacing');

    if (frontInput) frontInput.addEventListener('change', (e) => this.handleFrontImageSelect(e));
    if (backInput) backInput.addEventListener('change', (e) => this.handleBackImageSelect(e));
    if (mergeBtn) mergeBtn.addEventListener('click', () => this.mergeImages());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadMergedImage());
    if (layoutSelect) layoutSelect.addEventListener('change', () => this.updatePreview());
    if (spacingInput) spacingInput.addEventListener('input', () => this.updatePreview());
  }

  setupDragAndDrop() {
    const frontDropzone = document.getElementById('front-dropzone');
    const backDropzone = document.getElementById('back-dropzone');
    
    if (frontDropzone) {
      ToolUtils.setupFileDrop(frontDropzone, (file) => this.loadFrontImage(file), ['image']);
    }
    if (backDropzone) {
      ToolUtils.setupFileDrop(backDropzone, (file) => this.loadBackImage(file), ['image']);
    }
  }

  handleFrontImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadFrontImage(file);
    }
  }

  handleBackImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadBackImage(file);
    }
  }

  loadFrontImage(file) {
    if (!file.type.startsWith('image/')) {
      ToolUtils.showStatus('Please select a valid image file', 'error');
      return;
    }

    this.frontFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.frontImage = img;
        this.displayFrontPreview(e.target.result);
        this.updateFileInfo();
        this.checkIfReadyToMerge();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  loadBackImage(file) {
    if (!file.type.startsWith('image/')) {
      ToolUtils.showStatus('Please select a valid image file', 'error');
      return;
    }

    this.backFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.backImage = img;
        this.displayBackPreview(e.target.result);
        this.updateFileInfo();
        this.checkIfReadyToMerge();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  displayFrontPreview(src) {
    const preview = document.getElementById('front-preview');
    const container = document.getElementById('front-preview-container');
    if (preview && container) {
      preview.src = src;
      container.classList.remove('hidden');
    }
  }

  displayBackPreview(src) {
    const preview = document.getElementById('back-preview');
    const container = document.getElementById('back-preview-container');
    if (preview && container) {
      preview.src = src;
      container.classList.remove('hidden');
    }
  }

  updateFileInfo() {
    if (this.frontFile) {
      const frontSizeEl = document.getElementById('front-size');
      if (frontSizeEl) {
        frontSizeEl.textContent = `${this.frontImage.width}x${this.frontImage.height} (${ToolUtils.formatFileSize(this.frontFile.size)})`;
      }
    }

    if (this.backFile) {
      const backSizeEl = document.getElementById('back-size');
      if (backSizeEl) {
        backSizeEl.textContent = `${this.backImage.width}x${this.backImage.height} (${ToolUtils.formatFileSize(this.backFile.size)})`;
      }
    }
  }

  checkIfReadyToMerge() {
    const mergeBtn = document.getElementById('merge-btn');
    if (mergeBtn) {
      mergeBtn.disabled = !(this.frontImage && this.backImage);
      if (this.frontImage && this.backImage) {
        mergeBtn.classList.remove('opacity-50');
        this.mergeImages();
      } else {
        mergeBtn.classList.add('opacity-50');
      }
    }
  }

  mergeImages() {
    if (!this.frontImage || !this.backImage) {
      ToolUtils.showStatus('Please select both front and back images', 'warning');
      return;
    }

    const layout = document.getElementById('layout-select')?.value || 'horizontal';
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');

    ToolUtils.showLoading(true);

    // Calculate dimensions based on layout
    let canvasWidth, canvasHeight;
    
    if (layout === 'horizontal') {
      canvasWidth = this.frontImage.width + this.backImage.width + spacing;
      canvasHeight = Math.max(this.frontImage.height, this.backImage.height);
    } else { // vertical
      canvasWidth = Math.max(this.frontImage.width, this.backImage.width);
      canvasHeight = this.frontImage.height + this.backImage.height + spacing;
    }

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Clear canvas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw images
    if (layout === 'horizontal') {
      // Draw front image
      this.ctx.drawImage(this.frontImage, 0, 0);
      // Draw back image
      this.ctx.drawImage(this.backImage, this.frontImage.width + spacing, 0);
    } else { // vertical
      // Draw front image
      this.ctx.drawImage(this.frontImage, 0, 0);
      // Draw back image
      this.ctx.drawImage(this.backImage, 0, this.frontImage.height + spacing);
    }

    // Show result
    this.displayMergedResult();
    ToolUtils.showLoading(false);
    ToolUtils.showStatus('Images merged successfully!', 'success');
  }

  displayMergedResult() {
    const outputPreview = document.getElementById('output-preview');
    const outputContainer = document.getElementById('output-preview-container');
    const downloadSection = document.getElementById('download-section');
    
    if (outputPreview && outputContainer) {
      this.canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        outputPreview.src = url;
        outputPreview.style.display = 'block';
        outputContainer.classList.add('output-ready');
        
        // Update merged size info
        const mergedSizeEl = document.getElementById('merged-size');
        if (mergedSizeEl) {
          mergedSizeEl.textContent = `${this.canvas.width}x${this.canvas.height} (${ToolUtils.formatFileSize(blob.size)})`;
        }
        
        if (downloadSection) {
          downloadSection.classList.remove('hidden');
        }
      }, 'image/png');
    }
  }

  downloadMergedImage() {
    if (!this.canvas) {
      ToolUtils.showStatus('No merged image to download', 'error');
      return;
    }

    const format = document.getElementById('output-format')?.value || 'png';
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const quality = format === 'jpeg' ? 0.9 : undefined;

    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-image.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      ToolUtils.showStatus('Merged image downloaded successfully!', 'success');
    }, mimeType, quality);
  }

  updatePreview() {
    if (this.frontImage && this.backImage) {
      this.mergeImages();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageMerger();
});
