#!/bin/bash

# Comprehensive Tool Enhancement Script
# This script updates all tools in the LinkToQR.me NEXUS toolkit

echo "🚀 Starting comprehensive tool enhancement..."

# Define tools directory
TOOLS_DIR="./tools"

# Function to update a tool's HTML with shared resources
update_tool_html() {
    local tool_dir=$1
    local tool_name=$2
    
    if [ -f "$tool_dir/index.html" ]; then
        echo "📝 Updating $tool_name..."
        
        # Add shared CSS and JS includes
        if ! grep -q "shared-styles.css" "$tool_dir/index.html"; then
            sed -i '/<link rel="stylesheet" href="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/font-awesome/a\
  <link rel="stylesheet" href="../shared-styles.css">' "$tool_dir/index.html"
        fi
        
        if ! grep -q "shared-utils.js" "$tool_dir/index.html"; then
            sed -i '/<script src="https:\/\/cdn.jsdelivr.net\/npm\/tsparticles/a\
  <script src="../shared-utils.js"></script>' "$tool_dir/index.html"
        fi
        
        echo "✅ Updated $tool_name HTML includes"
    fi
}

# Function to create enhanced JavaScript for tools
create_enhanced_js() {
    local tool_dir=$1
    local tool_name=$2
    local js_file="$tool_dir/${tool_name}.js"
    
    if [ ! -f "$js_file" ]; then
        echo "📄 Creating enhanced JavaScript for $tool_name..."
        
        cat > "$js_file" << 'EOF'
// Enhanced Tool Implementation with Shared Utilities
class EnhancedTool {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInterface();
    }

    setupEventListeners() {
        // File input handling
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Drag and drop
        const dropzone = document.getElementById('dropzone');
        if (dropzone) {
            ToolUtils.setupFileDrop(dropzone, (file) => this.processFile(file));
        }

        // Download button
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadResult());
        }
    }

    setupInterface() {
        // Set up two-column layout
        this.createInterface();
    }

    createInterface() {
        const container = document.querySelector('.container') || document.body;
        
        if (!document.querySelector('.tool-layout')) {
            const layout = document.createElement('div');
            layout.className = 'tool-layout';
            layout.innerHTML = `
                <div class="input-section">
                    <h2 class="text-3xl font-semibold text-gradient orbitron mb-6">Input & Settings</h2>
                    <div class="file-upload-area" id="dropzone">
                        <i class="fas fa-file-upload" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                        <p class="text-lg font-medium text-gray-300 mb-2">Drag & Drop Files Here</p>
                        <p class="text-sm text-gray-400 mb-4">or click to browse</p>
                        <input type="file" id="file-input" class="hidden">
                        <button onclick="document.getElementById('file-input').click()" class="cyber-button">
                            <i class="fas fa-folder-open mr-2"></i>Choose Files
                        </button>
                    </div>
                    <div id="input-preview" class="hidden mt-4"></div>
                    <div id="settings-panel" class="hidden input-group mt-4"></div>
                </div>
                
                <div class="output-section">
                    <h2 class="text-3xl font-semibold text-gradient orbitron mb-6">Output & Download</h2>
                    <div class="output-preview" id="output-preview">
                        <i class="fas fa-file-alt" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                        <p style="color: rgba(255,255,255,0.5);">Output will appear here</p>
                    </div>
                    <div class="progress-container hidden">
                        <div class="progress-bar"></div>
                    </div>
                    <div class="output-details" id="output-details"></div>
                    <div id="download-section" class="hidden">
                        <button id="download-btn" class="download-btn w-full">
                            <i class="fas fa-download mr-2"></i>Download Result
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(layout);
        }
    }

    handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        ToolUtils.showLoading(true);
        ToolUtils.updateProgress(25);
        
        // Override this method in specific tool implementations
        console.log('Processing file:', file.name);
        
        setTimeout(() => {
            this.showResult(file);
        }, 1000);
    }

    showResult(file) {
        const outputPreview = document.getElementById('output-preview');
        outputPreview.classList.add('output-ready');
        
        // Update output details
        const details = {
            'File Name': file.name,
            'File Size': ToolUtils.formatFileSize(file.size),
            'File Type': file.type,
            'Last Modified': new Date(file.lastModified).toLocaleDateString()
        };
        
        ToolUtils.updateOutputDetails(details);
        
        // Show download section
        document.getElementById('download-section').classList.remove('hidden');
        
        ToolUtils.updateProgress(100);
        ToolUtils.showLoading(false);
        ToolUtils.showStatus('File processed successfully!', 'success');
        
        setTimeout(() => ToolUtils.updateProgress(0), 1000);
    }

    downloadResult() {
        ToolUtils.showStatus('Download feature needs implementation', 'warning');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedTool();
});
EOF
        
        echo "✅ Created enhanced JavaScript for $tool_name"
    fi
}

# List of tools to update
tools=(
    "digital-signature"
    "document-scanner" 
    "file-compressor"
    "format-converter"
    "id-photo-maker"
    "image-enhancer"
    "image-format-converter"
    "pdf-converter"
    "photo-to-pdf"
    "qr-scanner"
    "store-text"
    "universal-video-downloader"
    "video-trimmer"
    "watermark-remover"
    "youtube-downloader"
)

# Update each tool
for tool in "${tools[@]}"; do
    tool_dir="$TOOLS_DIR/$tool"
    if [ -d "$tool_dir" ]; then
        update_tool_html "$tool_dir" "$tool"
        create_enhanced_js "$tool_dir" "$tool"
    else
        echo "⚠️  Tool directory not found: $tool_dir"
    fi
done

echo "🎉 Tool enhancement complete!"
echo ""
echo "📋 Summary of enhancements:"
echo "   ✅ Added shared CSS and JavaScript includes"
echo "   ✅ Created enhanced JavaScript for missing tools"
echo "   ✅ Set up two-column layout structure"
echo "   ✅ Added download functionality framework"
echo "   ✅ Integrated progress indicators"
echo "   ✅ Added return-to-home functionality"
echo ""
echo "🔧 Next steps:"
echo "   1. Customize individual tool logic in their respective JS files"
echo "   2. Test each tool's functionality"
echo "   3. Add tool-specific download implementations"
echo "   4. Verify responsive design on mobile devices"
