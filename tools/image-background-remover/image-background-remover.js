// Advanced Image Background Remover
class ImageBackgroundRemover {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.processedBlob = null;
    this.isColorPicking = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const methodSelect = document.getElementById('detection-method');
    const chromaTolerance = document.getElementById('chroma-tolerance');
    const edgeSensitivity = document.getElementById('edge-sensitivity');
    const magicTolerance = document.getElementById('magic-tolerance');
    const outputFormat = document.getElementById('output-format');
    const backgroundColorInput = document.getElementById('background-color');
    const removeBtn = document.getElementById('remove-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (methodSelect) methodSelect.addEventListener('change', () => this.handleMethodChange());
    if (chromaTolerance) chromaTolerance.addEventListener('input', () => this.updateToleranceDisplay());
    if (edgeSensitivity) edgeSensitivity.addEventListener('input', () => this.updateEdgeDisplay());
    if (magicTolerance) magicTolerance.addEventListener('input', () => this.updateMagicDisplay());
    if (outputFormat) outputFormat.addEventListener('change', () => this.handleFormatChange());
    if (backgroundColorInput) backgroundColorInput.addEventListener('change', () => this.updatePreview());
    if (removeBtn) removeBtn.addEventListener('click', () => this.removeBackground());
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
        ToolUtils.showLoading(false);
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
      
      // Add click listener for magic wand tool
      originalImg.addEventListener('click', (e) => this.handleImageClick(e));
    }
  }

  displayFileInfo(file, img) {
    const details = {
      'Original Dimensions': `${img.width} × ${img.height}px`,
      'Original Format': file.type.split('/')[1].toUpperCase(),
      'Original Size': ToolUtils.formatFileSize(file.size),
      'Background Status': 'Not removed yet'
    };
    
    ToolUtils.updateOutputDetails(details);
  }

  showControls() {
    const controls = document.getElementById('removal-controls');
    if (controls) {
      controls.classList.remove('hidden');
    }
  }

  handleMethodChange() {
    const method = document.getElementById('detection-method')?.value;
    const chromaControls = document.getElementById('chroma-controls');
    const edgeControls = document.getElementById('edge-controls');
    const magicControls = document.getElementById('magic-controls');
    
    // Hide all method-specific controls
    [chromaControls, edgeControls, magicControls].forEach(control => {
      if (control) control.classList.add('hidden');
    });
    
    // Show relevant controls
    switch (method) {
      case 'chroma':
        if (chromaControls) chromaControls.classList.remove('hidden');
        break;
      case 'edge':
        if (edgeControls) edgeControls.classList.remove('hidden');
        break;
      case 'magic':
        if (magicControls) magicControls.classList.remove('hidden');
        break;
    }
  }

  handleFormatChange() {
    const format = document.getElementById('output-format')?.value;
    const backgroundControls = document.getElementById('background-color-controls');
    
    if (backgroundControls) {
      if (format === 'jpeg-custom') {
        backgroundControls.classList.remove('hidden');
      } else {
        backgroundControls.classList.add('hidden');
      }
    }
  }

  updateToleranceDisplay() {
    const tolerance = document.getElementById('chroma-tolerance');
    const display = document.getElementById('tolerance-value');
    if (tolerance && display) {
      display.textContent = `${tolerance.value}%`;
    }
  }

  updateEdgeDisplay() {
    const sensitivity = document.getElementById('edge-sensitivity');
    const display = document.getElementById('edge-value');
    if (sensitivity && display) {
      display.textContent = `${sensitivity.value}%`;
    }
  }

  updateMagicDisplay() {
    const tolerance = document.getElementById('magic-tolerance');
    const display = document.getElementById('magic-value');
    if (tolerance && display) {
      display.textContent = `${tolerance.value}%`;
    }
  }

  handleImageClick(e) {
    const method = document.getElementById('detection-method')?.value;
    if (method === 'magic') {
      const rect = e.target.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (this.originalImage.width / rect.width));
      const y = Math.round((e.clientY - rect.top) * (this.originalImage.height / rect.height));
      
      this.magicWandRemoval(x, y);
    }
  }

  removeBackground() {
    if (!this.originalImage) {
      ToolUtils.showStatus('Please select an image first.', 'warning');
      return;
    }

    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const method = document.getElementById('detection-method')?.value || 'auto';
    
    switch (method) {
      case 'auto':
        this.autoRemoval();
        break;
      case 'chroma':
        this.chromaKeyRemoval();
        break;
      case 'edge':
        this.edgeDetectionRemoval();
        break;
      case 'magic':
        ToolUtils.showStatus('Click on the background area to remove it.', 'info');
        ToolUtils.showLoading(false);
        return;
    }
  }

  autoRemoval() {
    // Simplified auto removal - using edge detection with smart defaults
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    
    this.ctx.drawImage(this.originalImage, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply basic background removal algorithm
    this.applyAutoBackgroundRemoval(imageData);
    
    this.ctx.putImageData(imageData, 0, 0);
    this.finalizeRemoval();
  }

  chromaKeyRemoval() {
    const chromaColor = document.getElementById('chroma-color')?.value || '#00ff00';
    const tolerance = parseInt(document.getElementById('chroma-tolerance')?.value || '30');
    
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    
    this.ctx.drawImage(this.originalImage, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Convert hex color to RGB
    const targetColor = this.hexToRgb(chromaColor);
    
    // Apply chroma key removal
    this.applyChromaKey(imageData, targetColor, tolerance);
    
    this.ctx.putImageData(imageData, 0, 0);
    this.finalizeRemoval();
  }

  edgeDetectionRemoval() {
    const sensitivity = parseInt(document.getElementById('edge-sensitivity')?.value || '50');
    
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    
    this.ctx.drawImage(this.originalImage, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply edge detection algorithm
    this.applyEdgeDetection(imageData, sensitivity);
    
    this.ctx.putImageData(imageData, 0, 0);
    this.finalizeRemoval();
  }

  magicWandRemoval(x, y) {
    const tolerance = parseInt(document.getElementById('magic-tolerance')?.value || '20');
    
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    
    this.ctx.drawImage(this.originalImage, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Get target color at click position
    const targetColor = this.getPixelColor(imageData, x, y);
    
    // Apply flood fill algorithm
    this.applyFloodFill(imageData, x, y, targetColor, tolerance);
    
    this.ctx.putImageData(imageData, 0, 0);
    this.finalizeRemoval();
  }

  applyAutoBackgroundRemoval(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Simple edge-based removal - detect edges and assume background
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);
      
      // Check if pixel is near edges (simplified background detection)
      if (x < width * 0.1 || x > width * 0.9 || y < height * 0.1 || y > height * 0.9) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 200 || brightness < 50) {
          data[i + 3] = 0; // Make transparent
        }
      }
    }
  }

  applyChromaKey(imageData, targetColor, tolerance) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - targetColor.r, 2) +
        Math.pow(g - targetColor.g, 2) +
        Math.pow(b - targetColor.b, 2)
      );
      
      // If color is within tolerance, make it transparent
      if (distance < tolerance * 2.55) {
        data[i + 3] = 0;
      }
    }
  }

  applyEdgeDetection(imageData, sensitivity) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Simple edge detection and background removal
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate gradient
        const gradientX = this.getPixelBrightness(data, idx + 4) - this.getPixelBrightness(data, idx - 4);
        const gradientY = this.getPixelBrightness(data, idx + width * 4) - this.getPixelBrightness(data, idx - width * 4);
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        
        // If gradient is low (smooth area), potentially background
        if (gradient < sensitivity) {
          data[idx + 3] = Math.max(0, data[idx + 3] - 50);
        }
      }
    }
  }

  applyFloodFill(imageData, startX, startY, targetColor, tolerance) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const stack = [{x: startX, y: startY}];
    const visited = new Set();
    
    while (stack.length > 0) {
      const {x, y} = stack.pop();
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const idx = (y * width + x) * 4;
      const pixelColor = {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2]
      };
      
      // Check if pixel color matches target within tolerance
      const distance = Math.sqrt(
        Math.pow(pixelColor.r - targetColor.r, 2) +
        Math.pow(pixelColor.g - targetColor.g, 2) +
        Math.pow(pixelColor.b - targetColor.b, 2)
      );
      
      if (distance < tolerance * 2.55) {
        data[idx + 3] = 0; // Make transparent
        
        // Add neighboring pixels to stack
        stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
      }
    }
  }

  getPixelColor(imageData, x, y) {
    const idx = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[idx],
      g: imageData.data[idx + 1],
      b: imageData.data[idx + 2]
    };
  }

  getPixelBrightness(data, idx) {
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  finalizeRemoval() {
    ToolUtils.updateProgress(75);
    
    const format = document.getElementById('output-format')?.value || 'png';
    
    // Handle background replacement for JPEG formats
    if (format.startsWith('jpeg')) {
      this.addBackground(format === 'jpeg-custom' ? 
        document.getElementById('background-color')?.value || '#ffffff' : '#ffffff');
    }
    
    // Convert to blob
    const mimeType = format.startsWith('jpeg') ? 'image/jpeg' : 
                    format === 'webp' ? 'image/webp' : 'image/png';
    
    this.canvas.toBlob((blob) => {
      this.processedBlob = blob;
      this.displayResult(blob);
      ToolUtils.updateProgress(100);
      ToolUtils.showLoading(false);
      ToolUtils.showStatus('Background removed successfully!', 'success');
    }, mimeType, 0.95);
  }

  addBackground(color) {
    // Create a new canvas with background
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    
    // Fill with background color
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw processed image on top
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Replace main canvas
    this.canvas = tempCanvas;
    this.ctx = tempCtx;
  }

  displayResult(blob) {
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
        'Dimensions': `${this.canvas.width} × ${this.canvas.height}px`,
        'Output Format': format.toUpperCase(),
        'Output Size': ToolUtils.formatFileSize(blob.size),
        'Size Change': compressionRatio > 0 ? 
          `${compressionRatio}% smaller` : 
          `${Math.abs(compressionRatio)}% larger`,
        'Background Status': 'Removed'
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
    const extension = format.startsWith('jpeg') ? 'jpg' : format;
    const filename = `background-removed.${extension}`;
    
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
      this.previewTimeout = setTimeout(() => this.removeBackground(), 500);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageBackgroundRemover();
});
