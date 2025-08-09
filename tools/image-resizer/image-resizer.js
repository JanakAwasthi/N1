// Advanced Image Resizer with Real-time Preview and File Details
class ImageResizer {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.aspectRatio = 1;
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

    input.addEventListener('change', (e) => this.handleFileSelect(e));
    widthInput.addEventListener('input', () => this.handleDimensionChange('width'));
    heightInput.addEventListener('input', () => this.handleDimensionChange('height'));
    qualityInput.addEventListener('input', () => this.updateQualityDisplay());
    maintainAspect.addEventListener('change', () => this.toggleAspectRatio());
    downloadBtn.addEventListener('click', () => this.downloadImage());

    // Real-time updates
    [widthInput, heightInput, qualityInput].forEach(input => {
      input.addEventListener('input', () => this.processImage());
    });
  }
  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      ToolUtils.setupFileDrop(dropzone, (file) => this.loadImage(file), ['image']);
      dropzone.addEventListener('click', () => document.getElementById('image-input').click());
    }
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.loadImage(files[0]);
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
    const originalImg = document.getElementById('original-image');
    
    originalImg.src = img.src;
    preview.classList.remove('hidden');
  }

  displayFileInfo(file, img) {
    const fileInfo = document.getElementById('file-info');
    
    document.getElementById('original-size').textContent = `${img.width} × ${img.height}`;
    document.getElementById('original-dimensions').textContent = `${img.width}px × ${img.height}px`;
    document.getElementById('original-format').textContent = file.type.split('/')[1].toUpperCase();
    document.getElementById('file-size').textContent = this.formatFileSize(file.size);
    
    fileInfo.classList.remove('hidden');
  }

  setupDefaultDimensions(img) {
    document.getElementById('width').value = img.width;
    document.getElementById('height').value = img.height;
  }

  showControls() {
    document.getElementById('resize-controls').classList.remove('hidden');
  }

  handleDimensionChange(changedDimension) {
    if (!this.originalImage) return;

    const maintainAspect = document.getElementById('maintain-aspect').checked;
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');

    if (maintainAspect) {
      if (changedDimension === 'width') {
        const newWidth = parseInt(widthInput.value) || 0;
        const newHeight = Math.round(newWidth / this.aspectRatio);
        heightInput.value = newHeight;
      } else {
        const newHeight = parseInt(heightInput.value) || 0;
        const newWidth = Math.round(newHeight * this.aspectRatio);
        widthInput.value = newWidth;
      }
    }
  }

  toggleAspectRatio() {
    // When toggling aspect ratio, recalculate based on current width
    if (document.getElementById('maintain-aspect').checked) {
      this.handleDimensionChange('width');
    }
  }

  updateQualityDisplay() {
    const quality = document.getElementById('quality').value;
    document.getElementById('quality-value').textContent = `${quality}%`;
  }

  processImage() {
    if (!this.originalImage) return;

    const width = parseInt(document.getElementById('width').value) || this.originalImage.width;
    const height = parseInt(document.getElementById('height').value) || this.originalImage.height;
    const quality = parseInt(document.getElementById('quality').value) / 100;

    this.showProgress(true);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(this.originalImage, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/png', quality);
        this.displayResizedImage(dataUrl);
        this.updateOutputInfo(width, height, dataUrl);
        this.showDownloadButton();
        this.showProgress(false);
      } catch (error) {
        this.showError('Error processing image: ' + error.message);
        this.showProgress(false);
      }
    }, 100);
  }

  displayResizedImage(dataUrl) {
    const preview = document.getElementById('output-preview');
    const resizedImg = document.getElementById('resized-image');
    
    resizedImg.src = dataUrl;
    preview.classList.remove('hidden');
  }

  updateOutputInfo(width, height, dataUrl) {
    const outputInfo = document.getElementById('output-info');
    
    // Calculate compression ratio
    const originalSize = this.originalFile.size;
    const newSize = this.dataURLtoBlob(dataUrl).size;
    const compressionRatio = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    document.getElementById('new-size').textContent = `${width} × ${height}`;
    document.getElementById('new-dimensions').textContent = `${width}px × ${height}px`;
    document.getElementById('compression-ratio').textContent = `${compressionRatio}% smaller`;
    document.getElementById('output-format').textContent = 'PNG';
    
    outputInfo.classList.remove('hidden');
  }

  showDownloadButton() {
    document.getElementById('download-section').classList.remove('hidden');
  }

  downloadImage() {
    const resizedImg = document.getElementById('resized-image');
    if (!resizedImg.src) return;

    const link = document.createElement('a');
    link.href = resizedImg.src;
    link.download = `resized-${this.originalFile.name.split('.')[0]}.png`;
    link.click();

    this.showSuccess('Image downloaded successfully!');
  }

  showProgress(show) {
    const progressContainer = document.getElementById('progress-container');
    if (show) {
      progressContainer.classList.remove('hidden');
      // Animate progress bar
      setTimeout(() => {
        document.getElementById('progress-bar').style.width = '100%';
      }, 100);
    } else {
      progressContainer.classList.add('hidden');
      document.getElementById('progress-bar').style.width = '0%';
    }
  }

  showError(message) {
    // Create toast notification
    this.showToast(message, 'error');
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

// Initialize the Image Resizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ImageResizer();
});

// Legacy function for backward compatibility
function resizeImage() {
  // This function is now handled by the ImageResizer class
  console.log('Image resizing is now handled by the ImageResizer class');
}
