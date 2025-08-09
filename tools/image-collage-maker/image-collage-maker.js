// Advanced Image Collage Maker
class ImageCollageMaker {
  constructor() {
    this.images = [];
    this.canvas = document.getElementById('collage-canvas');
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
    const layoutSelect = document.getElementById('layout-template');
    const canvasSizeSelect = document.getElementById('canvas-size');
    const columnsInput = document.getElementById('grid-columns');
    const rowsInput = document.getElementById('grid-rows');
    const spacingInput = document.getElementById('spacing');
    const radiusInput = document.getElementById('border-radius');
    const bgColorInput = document.getElementById('bg-color');
    const bgTypeSelect = document.getElementById('bg-type');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (layoutSelect) layoutSelect.addEventListener('change', () => this.handleLayoutChange());
    if (canvasSizeSelect) canvasSizeSelect.addEventListener('change', () => this.handleCanvasSizeChange());
    if (columnsInput) columnsInput.addEventListener('input', () => this.updatePreview());
    if (rowsInput) rowsInput.addEventListener('input', () => this.updatePreview());
    if (spacingInput) spacingInput.addEventListener('input', () => this.updateSpacingDisplay());
    if (radiusInput) radiusInput.addEventListener('input', () => this.updateRadiusDisplay());
    if (bgColorInput) bgColorInput.addEventListener('change', () => this.updatePreview());
    if (bgTypeSelect) bgTypeSelect.addEventListener('change', () => this.updatePreview());
    if (generateBtn) generateBtn.addEventListener('click', () => this.generateCollage());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadCollage());

    // Effect checkboxes
    ['drop-shadow', 'vintage-filter', 'sepia-tone'].forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) checkbox.addEventListener('change', () => this.updatePreview());
    });
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      ToolUtils.setupFileDrop(dropzone, (files) => this.loadImages(files), ['image']);
      
      // Handle multiple file drop
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
          this.loadImages(files);
        }
      });
    }
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      this.loadImages(files);
    }
  }

  loadImages(files) {
    if (files.length === 0) {
      ToolUtils.showStatus('Please select valid image files.', 'error');
      return;
    }

    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const promises = files.map(file => this.loadSingleImage(file));
    
    Promise.all(promises).then(images => {
      this.images = images.filter(img => img !== null);
      this.displayThumbnails();
      this.showControls();
      this.updateGenerateButton();
      ToolUtils.updateProgress(100);
      ToolUtils.showLoading(false);
      ToolUtils.showStatus(`Loaded ${this.images.length} images successfully!`, 'success');
    }).catch(error => {
      ToolUtils.showLoading(false);
      ToolUtils.showStatus('Error loading images. Please try again.', 'error');
    });
  }

  loadSingleImage(file) {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            image: img,
            file: file,
            src: e.target.result
          });
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  displayThumbnails() {
    const thumbnailsSection = document.getElementById('image-thumbnails');
    const container = document.getElementById('thumbnail-container');
    
    if (!container || !thumbnailsSection) return;

    container.innerHTML = '';
    
    this.images.forEach((imgData, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'relative group cursor-pointer';
      thumbnail.innerHTML = `
        <img src="${imgData.src}" class="w-full h-20 object-cover rounded border-2 border-cyan-400">
        <div class="absolute inset-0 bg-red-500 bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
          <i class="fas fa-times text-white text-xl"></i>
        </div>
      `;
      
      thumbnail.addEventListener('click', () => this.removeImage(index));
      container.appendChild(thumbnail);
    });
    
    thumbnailsSection.classList.remove('hidden');
  }

  removeImage(index) {
    this.images.splice(index, 1);
    this.displayThumbnails();
    this.updateGenerateButton();
    
    if (this.images.length === 0) {
      document.getElementById('image-thumbnails').classList.add('hidden');
      document.getElementById('collage-controls').classList.add('hidden');
    }
  }

  showControls() {
    const controls = document.getElementById('collage-controls');
    if (controls) {
      controls.classList.remove('hidden');
    }
  }

  updateGenerateButton() {
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      const hasImages = this.images.length > 0;
      generateBtn.disabled = !hasImages;
      
      if (hasImages) {
        generateBtn.classList.remove('opacity-50');
      } else {
        generateBtn.classList.add('opacity-50');
      }
    }
  }

  handleLayoutChange() {
    const layout = document.getElementById('layout-template')?.value;
    const gridSettings = document.getElementById('grid-settings');
    
    if (gridSettings) {
      if (layout === 'grid') {
        gridSettings.style.display = 'block';
      } else {
        gridSettings.style.display = 'none';
      }
    }
    
    this.updatePreview();
  }

  handleCanvasSizeChange() {
    const sizeSelect = document.getElementById('canvas-size');
    const customControls = document.getElementById('custom-size-controls');
    
    if (sizeSelect && customControls) {
      if (sizeSelect.value === 'custom') {
        customControls.classList.remove('hidden');
      } else {
        customControls.classList.add('hidden');
      }
    }
    
    this.updatePreview();
  }

  updateSpacingDisplay() {
    const spacingInput = document.getElementById('spacing');
    const spacingValue = document.getElementById('spacing-value');
    
    if (spacingInput && spacingValue) {
      spacingValue.textContent = `${spacingInput.value}px`;
      this.updatePreview();
    }
  }

  updateRadiusDisplay() {
    const radiusInput = document.getElementById('border-radius');
    const radiusValue = document.getElementById('radius-value');
    
    if (radiusInput && radiusValue) {
      radiusValue.textContent = `${radiusInput.value}px`;
      this.updatePreview();
    }
  }

  getCanvasDimensions() {
    const sizeSelect = document.getElementById('canvas-size');
    const customWidth = document.getElementById('custom-width');
    const customHeight = document.getElementById('custom-height');
    
    if (sizeSelect?.value === 'custom') {
      return {
        width: parseInt(customWidth?.value || '1080'),
        height: parseInt(customHeight?.value || '1080')
      };
    }
    
    const size = sizeSelect?.value || '1080x1080';
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }

  generateCollage() {
    if (this.images.length === 0) {
      ToolUtils.showStatus('Please add images first.', 'warning');
      return;
    }

    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const { width, height } = this.getCanvasDimensions();
    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw background
    this.drawBackground();
    ToolUtils.updateProgress(50);

    // Draw images based on layout
    const layout = document.getElementById('layout-template')?.value || 'grid';
    
    switch (layout) {
      case 'grid':
        this.drawGridLayout();
        break;
      case 'mosaic':
        this.drawMosaicLayout();
        break;
      case 'magazine':
        this.drawMagazineLayout();
        break;
      case 'heart':
        this.drawHeartLayout();
        break;
      case 'circle':
        this.drawCircleLayout();
        break;
      case 'diamond':
        this.drawDiamondLayout();
        break;
    }

    ToolUtils.updateProgress(75);

    // Apply effects
    this.applyEffects();

    // Show result
    this.displayResult();
    ToolUtils.updateProgress(100);
    ToolUtils.showLoading(false);
    ToolUtils.showStatus('Collage generated successfully!', 'success');
  }

  drawBackground() {
    const bgType = document.getElementById('bg-type')?.value || 'solid';
    const bgColor = document.getElementById('bg-color')?.value || '#ffffff';
    
    switch (bgType) {
      case 'solid':
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
      case 'gradient':
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(1, this.adjustBrightness(bgColor, -20));
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
      case 'transparent':
        // Keep transparent
        break;
    }
  }

  drawGridLayout() {
    const columns = parseInt(document.getElementById('grid-columns')?.value || '3');
    const rows = parseInt(document.getElementById('grid-rows')?.value || '3');
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const radius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    const cellWidth = (this.canvas.width - spacing * (columns + 1)) / columns;
    const cellHeight = (this.canvas.height - spacing * (rows + 1)) / rows;
    
    let imageIndex = 0;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (imageIndex >= this.images.length) break;
        
        const x = spacing + col * (cellWidth + spacing);
        const y = spacing + row * (cellHeight + spacing);
        
        this.drawImageInCell(this.images[imageIndex].image, x, y, cellWidth, cellHeight, radius);
        imageIndex++;
      }
    }
  }

  drawMosaicLayout() {
    // Simplified mosaic - random sizes
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const radius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    const positions = this.generateMosaicPositions();
    
    this.images.forEach((imgData, index) => {
      if (positions[index]) {
        const pos = positions[index];
        this.drawImageInCell(imgData.image, pos.x, pos.y, pos.width, pos.height, radius);
      }
    });
  }

  drawMagazineLayout() {
    // Magazine style with different sized panels
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const radius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    const layouts = this.getMagazineLayouts();
    const layout = layouts[Math.min(this.images.length - 1, layouts.length - 1)];
    
    this.images.forEach((imgData, index) => {
      if (layout[index]) {
        const panel = layout[index];
        const x = panel.x * this.canvas.width;
        const y = panel.y * this.canvas.height;
        const width = panel.width * this.canvas.width - spacing;
        const height = panel.height * this.canvas.height - spacing;
        
        this.drawImageInCell(imgData.image, x, y, width, height, radius);
      }
    });
  }

  drawHeartLayout() {
    // Heart-shaped arrangement
    const heartPoints = this.generateHeartPoints(this.images.length);
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const radius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    this.images.forEach((imgData, index) => {
      if (heartPoints[index]) {
        const point = heartPoints[index];
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.15;
        this.drawImageInCell(imgData.image, point.x - size/2, point.y - size/2, size, size, radius);
      }
    });
  }

  drawCircleLayout() {
    // Circular arrangement
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const borderRadius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    this.images.forEach((imgData, index) => {
      const angle = (index / this.images.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const size = Math.min(this.canvas.width, this.canvas.height) * 0.12;
      
      this.drawImageInCell(imgData.image, x - size/2, y - size/2, size, size, borderRadius);
    });
  }

  drawDiamondLayout() {
    // Diamond-shaped arrangement
    const diamondPoints = this.generateDiamondPoints(this.images.length);
    const spacing = parseInt(document.getElementById('spacing')?.value || '10');
    const radius = parseInt(document.getElementById('border-radius')?.value || '5');
    
    this.images.forEach((imgData, index) => {
      if (diamondPoints[index]) {
        const point = diamondPoints[index];
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.15;
        this.drawImageInCell(imgData.image, point.x - size/2, point.y - size/2, size, size, radius);
      }
    });
  }

  drawImageInCell(img, x, y, width, height, radius = 0) {
    this.ctx.save();
    
    // Create rounded rectangle path
    if (radius > 0) {
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, width, height, radius);
      this.ctx.clip();
    }
    
    // Calculate aspect ratio and draw image
    const imgAspect = img.width / img.height;
    const cellAspect = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > cellAspect) {
      // Image is wider
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = x - (drawWidth - width) / 2;
      drawY = y;
    } else {
      // Image is taller
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = x;
      drawY = y - (drawHeight - height) / 2;
    }
    
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
    
    // Draw border if drop shadow is enabled
    if (document.getElementById('drop-shadow')?.checked) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 5;
      this.ctx.shadowOffsetY = 5;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 2;
      
      if (radius > 0) {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.stroke();
      }
      
      this.ctx.shadowColor = 'transparent';
    }
  }

  generateMosaicPositions() {
    // Generate random but non-overlapping positions
    const positions = [];
    const minSize = Math.min(this.canvas.width, this.canvas.height) * 0.15;
    const maxSize = Math.min(this.canvas.width, this.canvas.height) * 0.25;
    
    for (let i = 0; i < this.images.length; i++) {
      const size = minSize + Math.random() * (maxSize - minSize);
      const x = Math.random() * (this.canvas.width - size);
      const y = Math.random() * (this.canvas.height - size);
      
      positions.push({ x, y, width: size, height: size });
    }
    
    return positions;
  }

  getMagazineLayouts() {
    // Predefined magazine layouts for different numbers of images
    return [
      [{ x: 0, y: 0, width: 1, height: 1 }], // 1 image
      [{ x: 0, y: 0, width: 0.5, height: 1 }, { x: 0.5, y: 0, width: 0.5, height: 1 }], // 2 images
      [{ x: 0, y: 0, width: 0.5, height: 0.5 }, { x: 0.5, y: 0, width: 0.5, height: 1 }, { x: 0, y: 0.5, width: 0.5, height: 0.5 }], // 3 images
      // Add more layouts as needed
    ];
  }

  generateHeartPoints(count) {
    const points = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const scale = Math.min(this.canvas.width, this.canvas.height) * 0.15;
    
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 2 * Math.PI;
      const x = centerX + scale * (16 * Math.pow(Math.sin(t), 3));
      const y = centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      points.push({ x, y });
    }
    
    return points;
  }

  generateDiamondPoints(count) {
    const points = [];
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    
    // Diamond corners
    const corners = [
      { x: centerX, y: centerY - radius },     // Top
      { x: centerX + radius, y: centerY },     // Right
      { x: centerX, y: centerY + radius },     // Bottom
      { x: centerX - radius, y: centerY }      // Left
    ];
    
    for (let i = 0; i < count; i++) {
      const cornerIndex = i % 4;
      const corner = corners[cornerIndex];
      const offset = Math.floor(i / 4) * 30;
      
      points.push({
        x: corner.x + (Math.random() - 0.5) * offset,
        y: corner.y + (Math.random() - 0.5) * offset
      });
    }
    
    return points;
  }

  applyEffects() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    if (document.getElementById('vintage-filter')?.checked) {
      this.applyVintageFilter(data);
    }
    
    if (document.getElementById('sepia-tone')?.checked) {
      this.applySepiaFilter(data);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  applyVintageFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const brightness = 0.8;
      const contrast = 1.2;
      
      data[i] = Math.min(255, (data[i] - 128) * contrast + 128 + 20) * brightness;     // Red + warm
      data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrast + 128) * brightness; // Green
      data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrast + 128 - 20) * brightness; // Blue - cool
    }
  }

  applySepiaFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Red
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
    }
  }

  adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  displayResult() {
    const outputContainer = document.getElementById('output-preview-container');
    const downloadSection = document.getElementById('download-section');
    
    if (outputContainer) {
      this.canvas.classList.remove('hidden');
      outputContainer.classList.add('output-ready');
      
      if (downloadSection) {
        downloadSection.classList.remove('hidden');
      }
      
      // Update output details
      const totalSize = this.images.reduce((sum, img) => sum + img.file.size, 0);
      
      const details = {
        'Canvas Size': `${this.canvas.width} × ${this.canvas.height}px`,
        'Images Used': this.images.length.toString(),
        'Layout': document.getElementById('layout-template')?.value || 'grid',
        'Total Input Size': ToolUtils.formatFileSize(totalSize),
        'Estimated Output': 'Ready for download'
      };
      
      ToolUtils.updateOutputDetails(details);
    }
  }

  downloadCollage() {
    const format = document.getElementById('output-format')?.value || 'png';
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const quality = format === 'jpeg' ? 0.9 : undefined;

    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collage.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      ToolUtils.showStatus('Collage downloaded successfully!', 'success');
    }, mimeType, quality);
  }

  updatePreview() {
    if (this.images.length > 0) {
      // Debounce the generation for better performance
      clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(() => this.generateCollage(), 500);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageCollageMaker();
});
