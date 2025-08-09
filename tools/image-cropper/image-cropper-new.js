class ImageCropper {
  constructor() {
    this.cropper = null;
    this.originalFile = null;
    this.currentShape = 'rectangle';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupShapeButtons();
    this.setupNewControls();
    this.livePreviewCanv = null;
    this.outputSize = { w: null, h: null, lock: true };
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const resetBtn = document.getElementById('reset-crop');
    const applyBtn = document.getElementById('apply-crop');
    const downloadBtn = document.getElementById('download-cropped');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetCrop());
    if (applyBtn) applyBtn.addEventListener('click', () => this.applyCrop());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadImage());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });
  }

  setupShapeButtons() {
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentShape = btn.dataset.shape;
        this.updateCropSettings();
      });
    });
  }

  setupNewControls() {
    // Aspect ratio preset
    const aspectPreset = document.getElementById('aspect-preset');
    aspectPreset?.addEventListener('change', () => {
      const v = aspectPreset.value;
      if (!this.cropper) return;
      if (v === 'free') this.cropper.setAspectRatio(NaN);
      else {
        const [a, b] = v.split(':').map(Number);
        if (a && b) this.cropper.setAspectRatio(a / b);
      }
    });

    // Output size preset
    const sizePreset = document.getElementById('size-preset');
    sizePreset?.addEventListener('change', () => {
      const v = sizePreset.value;
      const ow = document.getElementById('output-width');
      const oh = document.getElementById('output-height');
      if (!v) { ow.value = ''; oh.value = ''; this.outputSize.w = null; this.outputSize.h = null; this.updateLiveOutput(); return; }
      const [w, h] = v.split('x').map(Number);
      ow.value = String(w); oh.value = String(h);
      this.outputSize.w = w; this.outputSize.h = h;
      this.updateLiveOutput();
    });

    // Output inputs
    const ow = document.getElementById('output-width');
    const oh = document.getElementById('output-height');
    const lock = document.getElementById('output-lock-ratio');
    lock?.addEventListener('change', () => { this.outputSize.lock = lock.checked; });

    const onSizeInput = (which) => {
      if (!this.cropper) return;
      const data = this.cropper.getData(true);
      if (!data?.width || !data?.height) return;
      const ratio = data.width / data.height;
      if (which === 'w') {
        const w = parseInt(ow.value || '0', 10);
        if (w > 0) {
          this.outputSize.w = w;
          if (lock?.checked) {
            const h = Math.round(w / ratio);
            oh.value = String(h);
            this.outputSize.h = h;
          }
        } else { this.outputSize.w = null; }
      } else {
        const h = parseInt(oh.value || '0', 10);
        if (h > 0) {
          this.outputSize.h = h;
          if (lock?.checked) {
            const w = Math.round(h * ratio);
            ow.value = String(w);
            this.outputSize.w = w;
          }
        } else { this.outputSize.h = null; }
      }
      this.updateLiveOutput();
    };

    ow?.addEventListener('input', () => onSizeInput('w'));
    oh?.addEventListener('input', () => onSizeInput('h'));

    // Editor toolbar
    document.getElementById('zoom-in')?.addEventListener('click', () => this.cropper?.zoom(0.1));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.cropper?.zoom(-0.1));
    document.getElementById('rotate-left')?.addEventListener('click', () => this.cropper?.rotate(-90));
    document.getElementById('rotate-right')?.addEventListener('click', () => this.cropper?.rotate(90));
    document.getElementById('flip-h')?.addEventListener('click', () => {
      if (!this.cropper) return; this.scaleX = this.scaleX === -1 ? 1 : -1; this.cropper.scaleX(this.scaleX);
    });
    document.getElementById('flip-v')?.addEventListener('click', () => {
      if (!this.cropper) return; this.scaleY = this.scaleY === -1 ? 1 : -1; this.cropper.scaleY(this.scaleY);
    });
    document.getElementById('fit')?.addEventListener('click', () => { this.cropper?.reset(); this.cropper?.zoomTo(0); });
    document.getElementById('center')?.addEventListener('click', () => { this.cropper?.setCanvasData({ left: 0, top: 0 }); });
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    this.originalFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      this.initializeCropper(e.target.result);
      this.showImageInfo(file);
    };
    
    reader.readAsDataURL(file);
  }

  initializeCropper(imageSrc) {
    // Wait for image to load before initializing cropper
    const image = document.getElementById('crop-image');
    const container = document.getElementById('editor-container');
    const placeholder = document.getElementById('editor-placeholder');
    if (!image || !container || !placeholder) return;

    container.classList.remove('hidden');
    placeholder.classList.add('hidden');
    document.getElementById('crop-settings')?.classList.remove('hidden');
    document.getElementById('crop-controls')?.classList.remove('hidden');

    if (this.cropper) this.cropper.destroy();
    image.src = imageSrc;

    image.onload = () => {
      // Create live preview boxes via Cropper preview option
      const previewBoxes = Array.from(document.querySelectorAll('.live-preview'));
      this.cropper = new Cropper(image, {
        aspectRatio: NaN,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        minCropBoxWidth: 10,
        minCropBoxHeight: 10,
        preview: previewBoxes,
        ready: () => {
          this.scaleX = 1; this.scaleY = 1;
          this.updateCropInfo({ width: image.naturalWidth, height: image.naturalHeight, x: 0, y: 0 });
          this.ensureLiveOutputCanvas();
          this.updateLiveOutput();
        },
        crop: (event) => {
          this.updateCropInfo(event.detail);
          this.updateLiveOutput();
        }
      });
    };
  }

  ensureLiveOutputCanvas() {
    if (this.livePreviewCanv) return;
    this.livePreviewCanv = document.getElementById('live-preview-canvas');
  }

  updateLiveOutput() {
    if (!this.cropper) return;
    const cropData = this.cropper.getData(true);
    if (!cropData?.width || !cropData?.height) return;

    // Determine target size
    let tw = Math.round(cropData.width);
    let th = Math.round(cropData.height);
    if (this.outputSize.w && this.outputSize.h) { tw = this.outputSize.w; th = this.outputSize.h; }
    else if (this.outputSize.w && !this.outputSize.h) { th = Math.round(this.outputSize.w * (cropData.height / cropData.width)); tw = this.outputSize.w; }
    else if (!this.outputSize.w && this.outputSize.h) { tw = Math.round(this.outputSize.h * (cropData.width / cropData.height)); th = this.outputSize.h; }

    const canvas = this.cropper.getCroppedCanvas({
      width: tw,
      height: th,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    if (!canvas || !this.livePreviewCanv) return;

    // Draw to the live preview canvas, scaling to fit element width
    this.livePreviewCanv.width = canvas.width;
    this.livePreviewCanv.height = canvas.height;
    const ctx = this.livePreviewCanv.getContext('2d');
    ctx.clearRect(0, 0, this.livePreviewCanv.width, this.livePreviewCanv.height);

    // Apply shape mask in preview for visual parity
    let masked = canvas;
    switch (this.currentShape) {
      case 'circle': masked = this.applyCircularMask(canvas); break;
      case 'heart': masked = this.applyHeartMask(canvas); break;
      case 'star': masked = this.applyStarMask(canvas); break;
      case 'rounded': masked = this.applyRoundedMask(canvas); break;
      case 'triangle': masked = this.applyTriangleMask(canvas); break;
      case 'hexagon': masked = this.applyPolygonMask(canvas, 6); break;
      default: break;
    }
    ctx.drawImage(masked, 0, 0);

    // Update preview/sections visibility
    document.getElementById('preview-section')?.classList.remove('hidden');
    document.getElementById('download-section')?.classList.remove('hidden');
    document.getElementById('output-details')?.classList.remove('hidden');

    // Update cropped preview image area as well
    const preview = document.getElementById('cropped-preview');
    if (preview) {
      preview.innerHTML = '';
      const img = document.createElement('img');
      img.src = this.livePreviewCanv.toDataURL();
      img.className = 'max-w-full max-h-64 rounded-lg border-2 border-green-500';
      preview.appendChild(img);
    }

    this.showOutputDetails(this.livePreviewCanv);
  }

  updateCropSettings() {
    if (!this.cropper) return;

    // For free-form cropping, we don't set any aspect ratio
    if (this.currentShape === 'rectangle' || this.currentShape === 'free') {
      this.cropper.setAspectRatio(NaN); // Free form
    } else if (this.currentShape === 'square') {
      this.cropper.setAspectRatio(1); // Square
    } else if (this.currentShape === 'circle') {
      this.cropper.setAspectRatio(1); // Circle needs square crop area
    } else {
      this.cropper.setAspectRatio(NaN); // Default to free form
    }
  }

  updateCropInfo(detail) {
    const info = document.getElementById('crop-info');
    if (!info || !detail) return;

    info.innerHTML = `
      <div class="text-sm space-y-1">
        <div>Width: ${Math.round(detail.width)}px</div>
        <div>Height: ${Math.round(detail.height)}px</div>
        <div>X: ${Math.round(detail.x)}px</div>
        <div>Y: ${Math.round(detail.y)}px</div>
      </div>
    `;
  }

  resetCrop() {
    if (this.cropper) {
      this.cropper.reset();
    }
  }

  applyCrop() {
    if (!this.cropper) return;
    // Use live output sizes if set
    const data = this.cropper.getData(true);
    let w = Math.round(data.width), h = Math.round(data.height);
    if (this.outputSize.w) w = this.outputSize.w;
    if (this.outputSize.h) h = this.outputSize.h;

    const canvas = this.cropper.getCroppedCanvas({
      width: w,
      height: h,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    if (!canvas) return;

    let finalCanvas = canvas;
    switch (this.currentShape) {
      case 'circle': finalCanvas = this.applyCircularMask(canvas); break;
      case 'heart': finalCanvas = this.applyHeartMask(canvas); break;
      case 'star': finalCanvas = this.applyStarMask(canvas); break;
      case 'rounded': finalCanvas = this.applyRoundedMask(canvas); break;
      case 'triangle': finalCanvas = this.applyTriangleMask(canvas); break;
      case 'hexagon': finalCanvas = this.applyPolygonMask(canvas, 6); break;
      default: break;
    }
    this.showCroppedResult(finalCanvas);
  }

  showCroppedResult(canvas) {
    const preview = document.getElementById('cropped-preview');
    if (!preview) return;

    // Unhide related sections
    document.getElementById('preview-section')?.classList.remove('hidden');
    document.getElementById('download-section')?.classList.remove('hidden');
    document.getElementById('output-details')?.classList.remove('hidden');

    // Clear previous result
    preview.innerHTML = '';

    // Create image element
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.className = 'max-w-full max-h-64 rounded-lg border-2 border-green-500';
    preview.appendChild(img);

    // Enable download button
    const downloadBtn = document.getElementById('download-cropped');
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => this.downloadCroppedImage(canvas);
    }

    // Show output details
    this.showOutputDetails(canvas);
  }

  showOutputDetails(canvas) {
    const details = document.getElementById('output-details');
    if (!details) return;
    const fmtEl = document.getElementById('output-format');
    const fmt = fmtEl?.value || 'png';

    const estimated = this.estimateFileSize(canvas);
    details.innerHTML = `
      <div class="space-y-1 text-sm">
        <div class="flex justify-between"><span class="text-gray-600">Output Size:</span><span class="font-medium">${canvas.width} × ${canvas.height}px</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Format:</span><span class="font-medium">${fmt.toUpperCase()}</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Estimated File:</span><span class="font-medium">${estimated}</span></div>
      </div>`;
  }

  downloadCroppedImage(canvas) {
    const formatEl = document.getElementById('output-format');
    const format = (formatEl && formatEl.value) ? formatEl.value : 'png';
    let mime = 'image/png';
    let ext = 'png';
    let quality = 0.92;

    if (format === 'jpeg') { mime = 'image/jpeg'; ext = 'jpg'; }
    if (format === 'webp') { mime = 'image/webp'; ext = 'webp'; }

    const dataUrl = (mime === 'image/png') ? canvas.toDataURL(mime) : canvas.toDataURL(mime, quality);

    const link = document.createElement('a');
    link.download = `cropped-${this.currentShape}-${canvas.width}x${canvas.height}.${ext}`;
    link.href = dataUrl;
    link.click();
  }

  estimateFileSize(canvas) {
    const dataURL = canvas.toDataURL();
    const bytes = Math.round((dataURL.length - 'data:image/png;base64,'.length) * 3/4);
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  showImageInfo(file) {
    const info = document.getElementById('image-info');
    if (!info) return;

    info.classList.remove('hidden');
    info.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">File:</span>
          <span class="font-medium">${file.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Size:</span>
          <span class="font-medium">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Type:</span>
          <span class="font-medium">${file.type}</span>
        </div>
      </div>
    `;
  }

  downloadImage() {
    if (!this.cropper) {
      alert('Please crop an image first');
      return;
    }

    this.applyCrop();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new ImageCropper();
});
