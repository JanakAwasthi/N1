// Color Palette Generator functionality
class ColorPaletteGenerator {
    constructor() {
        this.paletteHistory = JSON.parse(localStorage.getItem('paletteHistory') || '[]');
        this.currentPalette = [];
        this.setupEventListeners();
        this.updateHistory();
        this.generatePalette(); // Generate initial palette
    }

    setupEventListeners() {
        // Base color inputs
        document.getElementById('baseColor').addEventListener('input', (e) => {
            document.getElementById('baseColorHex').value = e.target.value;
            this.generatePalette();
        });

        document.getElementById('baseColorHex').addEventListener('input', (e) => {
            const hex = e.target.value;
            if (this.isValidHex(hex)) {
                document.getElementById('baseColor').value = hex;
                this.generatePalette();
            }
        });

        // Color count slider
        document.getElementById('colorCount').addEventListener('input', (e) => {
            document.getElementById('colorCountValue').textContent = e.target.value;
            this.generatePalette();
        });

        // Palette type selector
        document.getElementById('paletteType').addEventListener('change', () => {
            this.generatePalette();
        });
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    generatePalette() {
        const baseColor = document.getElementById('baseColor').value;
        const paletteType = document.getElementById('paletteType').value;
        const colorCount = parseInt(document.getElementById('colorCount').value);

        const hsl = this.hexToHsl(baseColor);
        let colors = [];

        switch (paletteType) {
            case 'monochromatic':
                colors = this.generateMonochromatic(hsl, colorCount);
                break;
            case 'analogous':
                colors = this.generateAnalogous(hsl, colorCount);
                break;
            case 'complementary':
                colors = this.generateComplementary(hsl, colorCount);
                break;
            case 'triadic':
                colors = this.generateTriadic(hsl, colorCount);
                break;
            case 'tetradic':
                colors = this.generateTetradic(hsl, colorCount);
                break;
            case 'split-complementary':
                colors = this.generateSplitComplementary(hsl, colorCount);
                break;
        }

        this.currentPalette = colors;
        this.displayPalette(colors);
        this.addToHistory(colors, paletteType);
    }

    generateMonochromatic(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        
        for (let i = 0; i < count; i++) {
            const lightness = Math.max(10, Math.min(90, l + (i - Math.floor(count/2)) * 15));
            const saturation = Math.max(20, Math.min(100, s + (i - Math.floor(count/2)) * 10));
            colors.push(this.hslToHex([h, saturation, lightness]));
        }
        
        return colors;
    }

    generateAnalogous(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const step = 30;
        
        for (let i = 0; i < count; i++) {
            const hue = (h + (i - Math.floor(count/2)) * step + 360) % 360;
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 20));
            const saturation = Math.max(40, Math.min(90, s + (Math.random() - 0.5) * 20));
            colors.push(this.hslToHex([hue, saturation, lightness]));
        }
        
        return colors;
    }

    generateComplementary(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const complementaryHue = (h + 180) % 360;
        
        // Add base color
        colors.push(this.hslToHex(baseHsl));
        
        // Add complementary color
        colors.push(this.hslToHex([complementaryHue, s, l]));
        
        // Fill remaining with variations
        for (let i = 2; i < count; i++) {
            const useBase = i % 2 === 0;
            const hue = useBase ? h : complementaryHue;
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40));
            const saturation = Math.max(40, Math.min(90, s + (Math.random() - 0.5) * 30));
            colors.push(this.hslToHex([hue, saturation, lightness]));
        }
        
        return colors;
    }

    generateTriadic(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const hues = [h, (h + 120) % 360, (h + 240) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 3];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 30));
            const saturation = Math.max(40, Math.min(90, s + (Math.random() - 0.5) * 20));
            colors.push(this.hslToHex([hue, saturation, lightness]));
        }
        
        return colors;
    }

    generateTetradic(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const hues = [h, (h + 90) % 360, (h + 180) % 360, (h + 270) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 4];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 30));
            const saturation = Math.max(40, Math.min(90, s + (Math.random() - 0.5) * 20));
            colors.push(this.hslToHex([hue, saturation, lightness]));
        }
        
        return colors;
    }

    generateSplitComplementary(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const complementary = (h + 180) % 360;
        const hues = [h, (complementary - 30 + 360) % 360, (complementary + 30) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 3];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 30));
            const saturation = Math.max(40, Math.min(90, s + (Math.random() - 0.5) * 20));
            colors.push(this.hslToHex([hue, saturation, lightness]));
        }
        
        return colors;
    }

    displayPalette(colors) {
        const container = document.getElementById('paletteContainer');
        container.innerHTML = '';

        colors.forEach((color, index) => {
            const colorCard = document.createElement('div');
            colorCard.className = 'color-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer';
            
            const rgb = this.hexToRgb(color);
            const hsl = this.hexToHsl(color);
            
            colorCard.innerHTML = `
                <div class="color-preview h-32 w-full" style="background-color: ${color}"></div>
                <div class="p-4">
                    <div class="space-y-2">
                        <div class="text-xs">
                            <span class="font-semibold">HEX:</span>
                            <span class="font-mono">${color.toUpperCase()}</span>
                        </div>
                        <div class="text-xs">
                            <span class="font-semibold">RGB:</span>
                            <span class="font-mono">${rgb.r}, ${rgb.g}, ${rgb.b}</span>
                        </div>
                        <div class="text-xs">
                            <span class="font-semibold">HSL:</span>
                            <span class="font-mono">${Math.round(hsl[0])}°, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%</span>
                        </div>
                    </div>
                    <button onclick="copyColorToClipboard('${color}')" 
                            class="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1 px-2 rounded transition-colors">
                        <i class="fas fa-copy mr-1"></i>Copy
                    </button>
                </div>
            `;
            
            container.appendChild(colorCard);
        });
    }

    addToHistory(colors, type) {
        const historyItem = {
            colors: colors,
            type: type,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        this.paletteHistory.unshift(historyItem);
        this.paletteHistory = this.paletteHistory.slice(0, 10); // Keep only last 10
        localStorage.setItem('paletteHistory', JSON.stringify(this.paletteHistory));
        this.updateHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('paletteHistory');
        
        if (this.paletteHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No palettes generated yet</p>';
            return;
        }

        historyContainer.innerHTML = this.paletteHistory.map(item => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-3">
                    <div>
                        <span class="text-sm font-medium capitalize">${item.type.replace('-', ' ')}</span>
                        <span class="text-xs text-gray-500 ml-2">${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <button onclick="loadPalette(${item.id})" class="text-blue-500 hover:text-blue-700 text-sm">
                        <i class="fas fa-redo mr-1"></i>Load
                    </button>
                </div>
                <div class="flex space-x-2">
                    ${item.colors.map(color => `
                        <div class="w-8 h-8 rounded border-2 border-white shadow-sm cursor-pointer" 
                             style="background-color: ${color}" 
                             onclick="copyColorToClipboard('${color}')"
                             title="Click to copy ${color}"></div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the palette history?')) {
            this.paletteHistory = [];
            localStorage.removeItem('paletteHistory');
            this.updateHistory();
            showNotification('Palette history cleared', 'success');
        }
    }

    loadPalette(id) {
        const item = this.paletteHistory.find(p => p.id === id);
        if (item) {
            this.currentPalette = item.colors;
            this.displayPalette(item.colors);
            document.getElementById('paletteType').value = item.type;
            showNotification('Palette loaded successfully', 'success');
        }
    }

    exportPalette(format) {
        if (this.currentPalette.length === 0) {
            showNotification('No palette to export', 'error');
            return;
        }

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'css':
                content = this.generateCSSExport();
                filename = 'color-palette.css';
                mimeType = 'text/css';
                break;
            case 'json':
                content = this.generateJSONExport();
                filename = 'color-palette.json';
                mimeType = 'application/json';
                break;
            case 'ase':
                showNotification('ASE export coming soon', 'info');
                return;
        }

        this.downloadFile(content, filename, mimeType);
        showNotification(`Palette exported as ${format.toUpperCase()}`, 'success');
    }

    generateCSSExport() {
        let css = ':root {\n';
        this.currentPalette.forEach((color, index) => {
            css += `  --color-${index + 1}: ${color};\n`;
        });
        css += '}\n\n';
        
        css += '/* Color Classes */\n';
        this.currentPalette.forEach((color, index) => {
            css += `.bg-color-${index + 1} { background-color: ${color}; }\n`;
            css += `.text-color-${index + 1} { color: ${color}; }\n`;
            css += `.border-color-${index + 1} { border-color: ${color}; }\n\n`;
        });
        
        return css;
    }

    generateJSONExport() {
        const palette = {
            name: `Generated Palette ${new Date().toLocaleDateString()}`,
            colors: this.currentPalette.map((color, index) => ({
                name: `Color ${index + 1}`,
                hex: color,
                rgb: this.hexToRgb(color),
                hsl: this.hexToHsl(color)
            })),
            createdAt: new Date().toISOString()
        };
        
        return JSON.stringify(palette, null, 2);
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Color conversion utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    }

    hslToHex(hsl) {
        const [h, s, l] = [hsl[0] / 360, hsl[1] / 100, hsl[2] / 100];
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}

const colorPaletteGenerator = new ColorPaletteGenerator();

// Global functions
function generatePalette() {
    colorPaletteGenerator.generatePalette();
}

function copyColorToClipboard(color) {
    navigator.clipboard.writeText(color).then(() => {
        showNotification(`Color ${color} copied to clipboard!`, 'success');
    });
}

function clearHistory() {
    colorPaletteGenerator.clearHistory();
}

function loadPalette(id) {
    colorPaletteGenerator.loadPalette(id);
}

function exportPalette(format) {
    colorPaletteGenerator.exportPalette(format);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
