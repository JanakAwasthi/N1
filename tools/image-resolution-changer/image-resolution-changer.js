// Advanced Image Resolution Changer
class ImageResolutionChanger {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.processedBlob = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const presetSelect = document.getElementById('resolution-preset');
    const customDpiInput = document.getElementById('custom-dpi');
    const resamplingSelect = document.getElementById('resampling-method');
    const formatSelect = document.getElementById('output-format');
    const qualityInput = document.getElementById('quality');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (presetSelect) presetSelect.addEventListener('change', () => this.handlePresetChange());
    if (customDpiInput) customDpiInput.addEventListener('input', () => this.updatePreview());
    if (resamplingSelect) resamplingSelect.addEventListener('change', () => this.updatePreview());
    if (formatSelect) formatSelect.addEventListener('change', () => this.handleFormatChange());
    if (qualityInput) qualityInput.addEventListener('input', () => this.updateQualityDisplay());
    if (processBtn) processBtn.addEventListener('click', () => this.processImage());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadImage());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      ToolUtils.setupFileDrop(dropzone, (file) => this.loadImage(file), ['image']);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }

  loadImage(file) {
    if (!file.type.startsWith('image/')) {
      ToolUtils.showStatus('Please select a valid image file.', 'error');
      return;
    }

    this.originalFile = file;
    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.displayOriginalImage(img);
        this.displayFileInfo(file, img);
        this.showControls();
        ToolUtils.updateProgress(75);
        this.processImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  displayOriginalImage(img) {
    const preview = document.getElementById('original-preview');
    const originalImg = document.getElementById('original-image');
    
    if (originalImg && preview) {
      originalImg.src = img.src;
      preview.classList.remove('hidden');
    }
  }

  displayFileInfo(file, img) {
    // Calculate current DPI (assuming 96 DPI default for web images)
    const assumedDPI = 96;
    const details = {
      'Original Dimensions': `${img.width} × ${img.height}px`,
      'Estimated DPI': `${assumedDPI} DPI`,
      'Original Format': file.type.split('/')[1].toUpperCase(),
      'Original Size': ToolUtils.formatFileSize(file.size),
      'Color Depth': '24-bit RGB'
    };
    
    ToolUtils.updateOutputDetails(details);
  }

  showControls() {
    const controls = document.getElementById('resolution-controls');
    if (controls) {
      controls.classList.remove('hidden');
    }
  }

  handlePresetChange() {
    const presetSelect = document.getElementById('resolution-preset');
    const customDpiControls = document.getElementById('custom-dpi-controls');
    const customDpiInput = document.getElementById('custom-dpi');
    
    if (presetSelect && customDpiControls && customDpiInput) {
      const value = presetSelect.value;
      
      if (value === 'custom') {
        customDpiControls.style.display = 'block';
      } else {
        customDpiControls.style.display = 'none';
        customDpiInput.value = value;
      }
      
      this.updatePreview();
    }
  }

  handleFormatChange() {
    const formatSelect = document.getElementById('output-format');
    const qualityControls = document.getElementById('quality-controls');
    
    if (formatSelect && qualityControls) {
      const format = formatSelect.value;
      
      if (format === 'jpeg' || format === 'webp') {
        qualityControls.classList.remove('hidden');
      } else {
        qualityControls.classList.add('hidden');
      }
    }
  }

  updateQualityDisplay() {
    const qualityInput = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    
    if (qualityInput && qualityValue) {
      qualityValue.textContent = `${qualityInput.value}%`;
    }
  }

  processImage() {
    if (!this.originalImage) {
      ToolUtils.showStatus('Please select an image first.', 'warning');
      return;
    }

    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const targetDPI = this.getTargetDPI();
    const format = document.getElementById('output-format')?.value || 'png';
    const quality = parseInt(document.getElementById('quality')?.value || '95') / 100;

    // Calculate new dimensions based on DPI change
    const currentDPI = 96; // Assumed web DPI
    const scaleFactor = targetDPI / currentDPI;
    
    const newWidth = Math.round(this.originalImage.width * scaleFactor);
    const newHeight = Math.round(this.originalImage.height * scaleFactor);

    // Set canvas dimensions
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Apply resampling method
    this.applyResampling();

    // Draw the scaled image
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(this.originalImage, 0, 0, newWidth, newHeight);

    ToolUtils.updateProgress(75);

    // Convert to blob
    const mimeType = this.getMimeType(format);
    this.canvas.toBlob((blob) => {
      this.processedBlob = blob;
      this.displayResult(blob, newWidth, newHeight, targetDPI);
      ToolUtils.updateProgress(100);
      ToolUtils.showLoading(false);
      ToolUtils.showStatus('Resolution changed successfully!', 'success');
    }, mimeType, quality);
  }

  getTargetDPI() {
    const presetSelect = document.getElementById('resolution-preset');
    const customDpiInput = document.getElementById('custom-dpi');
    
    if (presetSelect?.value === 'custom') {
      return parseInt(customDpiInput?.value || '300');
    } else {
      return parseInt(presetSelect?.value || '300');
    }
  }

  applyResampling() {
    const method = document.getElementById('resampling-method')?.value || 'bicubic';
    
    switch (method) {
      case 'bicubic':
      case 'bilinear':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        break;
      case 'nearest':
        this.ctx.imageSmoothingEnabled = false;
        break;
      case 'lanczos':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        break;
    }
  }

  getMimeType(format) {
    switch (format) {
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'tiff': return 'image/tiff';
      default: return 'image/png';
    }
  }

  displayResult(blob, width, height, dpi) {
    const outputPreview = document.getElementById('output-preview');
    const outputContainer = document.getElementById('output-preview-container');
    const processedImg = document.getElementById('processed-image');
    const downloadSection = document.getElementById('download-section');
    
    if (processedImg && outputPreview && outputContainer) {
      const url = URL.createObjectURL(blob);
      processedImg.src = url;
      outputPreview.classList.remove('hidden');
      outputContainer.classList.add('output-ready');
      
      if (downloadSection) {
        downloadSection.classList.remove('hidden');
      }
      
      // Update output details
      const format = document.getElementById('output-format')?.value || 'png';
      const compressionRatio = ToolUtils.getCompressionRatio(this.originalFile.size, blob.size);
      
      const details = {
        'New Dimensions': `${width} × ${height}px`,
        'New DPI': `${dpi} DPI`,
        'Output Format': format.toUpperCase(),
        'Output Size': ToolUtils.formatFileSize(blob.size),
        'Size Change': compressionRatio > 0 ? 
          `${compressionRatio}% smaller` : 
          `${Math.abs(compressionRatio)}% larger`,
        'Scaling Factor': `${(width / this.originalImage.width).toFixed(2)}x`
      };
      
      ToolUtils.updateOutputDetails(details);
    }
  }

  downloadImage() {
    if (!this.processedBlob) {
      ToolUtils.showStatus('No processed image to download.', 'error');
      return;
    }

    const format = document.getElementById('output-format')?.value || 'png';
    const filename = `resolution-changed.${format}`;
    
    const url = URL.createObjectURL(this.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ToolUtils.showStatus('Image downloaded successfully!', 'success');
  }

  updatePreview() {
    if (this.originalImage) {
      // Debounce the processing for better performance
      clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(() => this.processImage(), 500);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageResolutionChanger();
});
