// Shared utilities for LinkToQR.me NEXUS Tools
class ToolUtils {  // Format file size in human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // For values less than 1 MB, show KB with 1 decimal place
    // For values 1 MB and above, show MB with 2 decimal places
    if (i < 2) {
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } else {
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }

  // Calculate compression ratio
  static getCompressionRatio(originalSize, compressedSize) {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  // Show status message
  static showStatus(message, type = 'info', duration = 3000) {
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) {
      existingStatus.remove();
    }

    const statusEl = document.createElement('div');
    statusEl.className = `status-message status-${type}`;
    statusEl.textContent = message;

    const container = document.querySelector('.output-section') || document.querySelector('.tool-container');
    if (container) {
      container.appendChild(statusEl);
      
      if (duration > 0) {
        setTimeout(() => {
          statusEl.remove();
        }, duration);
      }
    }
  }

  // Update progress bar
  static updateProgress(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  // Show loading state
  static showLoading(show = true) {
    const spinner = document.querySelector('.loading-spinner');
    if (show) {
      if (!spinner) {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-spinner';
        const container = document.querySelector('.output-preview');
        if (container) {
          container.appendChild(loadingEl);
        }
      }
    } else {
      if (spinner) {
        spinner.remove();
      }
    }
  }

  // Update output details
  static updateOutputDetails(details) {
    const outputDetails = document.querySelector('.output-details');
    if (!outputDetails) return;

    outputDetails.innerHTML = '';
    
    if (typeof details === 'object') {
      Object.entries(details).forEach(([label, value]) => {
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        detailItem.innerHTML = `
          <span class="detail-label">${label}:</span>
          <span class="detail-value">${value}</span>
        `;
        outputDetails.appendChild(detailItem);
      });
    }
  }

  // Create download button
  static createDownloadButton(blob, filename, customText = 'Download') {
    const url = URL.createObjectURL(blob);
    const downloadBtn = document.createElement('a');
    downloadBtn.href = url;
    downloadBtn.download = filename;
    downloadBtn.className = 'download-btn';
    downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${customText}`;
    
    downloadBtn.onclick = () => {
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };
    
    return downloadBtn;
  }
  // Setup file drag and drop
  static setupFileDrop(dropArea, callback, acceptedTypes = []) {
    if (!dropArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handleDrop(e) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (acceptedTypes.length === 0 || acceptedTypes.some(type => file.type.includes(type))) {
          callback(file);
        } else {
          ToolUtils.showStatus('File type not supported. Please select an image file.', 'error');
        }
      }
    }
  }

  // Get image dimensions
  static getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        resolve({
          width: this.naturalWidth,
          height: this.naturalHeight
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Compress image
  static compressImage(file, quality = 0.8, maxWidth = null, maxHeight = null) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = function() {
        let { width, height } = this;

        // Calculate new dimensions if max width/height specified
        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Initialize particles background
  static initParticles(containerId = 'particles-js') {
    if (typeof tsParticles !== 'undefined') {
      tsParticles.load(containerId, {
        fullScreen: { enable: false },
        particles: {
          number: { value: 50 },
          color: { value: ['#00d4ff', '#ff0080', '#8000ff'] },
          shape: { type: 'circle' },
          opacity: { value: 0.6, random: true },
          size: { value: 3, random: true },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            outModes: { default: 'out' }
          }
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            onClick: { enable: true, mode: 'push' }
          }
        },
        retina_detect: true
      });
    }
  }

  // Add return home button to header
  static addReturnHomeButton() {
    const header = document.querySelector('.futuristic-header');
    if (header && !header.querySelector('.return-home-btn')) {
      const returnBtn = document.createElement('a');
      returnBtn.href = '../../index.html';
      returnBtn.className = 'return-home-btn';
      returnBtn.innerHTML = '<i class="fas fa-home"></i> Home';
      
      const headerContent = header.querySelector('div') || header;
      headerContent.style.display = 'flex';
      headerContent.style.justifyContent = 'space-between';
      headerContent.style.alignItems = 'center';
      headerContent.appendChild(returnBtn);
    }
  }

  // Setup real-time preview updates
  static setupRealTimePreview(inputElement, previewCallback, debounceMs = 300) {
    let timeoutId;
    
    inputElement.addEventListener('input', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        previewCallback(inputElement.value);
      }, debounceMs);
    });
  }

  // Convert canvas to different formats
  static convertCanvasToFormat(canvas, format = 'png', quality = 0.9) {
    return new Promise((resolve) => {
      const mimeType = `image/${format}`;
      canvas.toBlob(resolve, mimeType, quality);
    });
  }

  // Create output section template
  static createOutputSection() {
    return `
      <div class="output-section">
        <h3 class="text-gradient mb-2">Output & Download</h3>
        <div class="output-preview">
          <i class="fas fa-image" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
          <p style="color: rgba(255,255,255,0.5);">Output will appear here</p>
        </div>
        <div class="progress-container hidden">
          <div class="progress-bar"></div>
        </div>
        <div class="output-details"></div>
      </div>
    `;
  }

  // Initialize common tool features
  static initializeTool() {
    // Add return home button
    this.addReturnHomeButton();
    
    // Initialize particles if container exists
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer) {
      this.initParticles();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '../../index.html';
      }
    });
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ToolUtils.initializeTool();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolUtils;
}
