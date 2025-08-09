/**
 * Enhanced QR Code Generator with High Precision and Multiple Features
 * Supports all QR types, high-quality generation, and better customization
 */

class EnhancedQRGenerator {
    constructor() {
        this.currentQRCode = null;
        this.currentType = 'text';
        this.currentData = '';
        this.qrHistory = [];
        
        this.initializeEventListeners();
        this.updateSizeDisplay();
        this.loadQRHistory();
    }

    initializeEventListeners() {
        // QR Type buttons
        document.querySelectorAll('.qr-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchQRType(e.target.dataset.type));
        });

        // Size and quality controls
        document.getElementById('qr-size').addEventListener('input', (e) => {
            this.updateSizeDisplay();
            this.regenerateQR();
        });

        document.getElementById('qr-quality').addEventListener('change', () => this.regenerateQR());
        document.getElementById('qr-margin').addEventListener('input', () => this.regenerateQR());

        // Color and style inputs
        document.getElementById('fg-color').addEventListener('change', () => this.regenerateQR());
        document.getElementById('bg-color').addEventListener('change', () => this.regenerateQR());
        document.getElementById('error-level').addEventListener('change', () => this.regenerateQR());
        document.getElementById('qr-style').addEventListener('change', () => this.regenerateQR());

        // Logo upload
        document.getElementById('logo-upload').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('remove-logo').addEventListener('click', () => this.removeLogo());

        // Action buttons
        document.getElementById('download-png').addEventListener('click', () => this.downloadQR('png'));
        document.getElementById('download-jpg').addEventListener('click', () => this.downloadQR('jpg'));
        document.getElementById('download-svg').addEventListener('click', () => this.downloadQR('svg'));
        document.getElementById('copy-qr').addEventListener('click', () => this.copyQRToClipboard());
        document.getElementById('print-qr').addEventListener('click', () => this.printQR());

        // Batch generation
        document.getElementById('batch-input').addEventListener('input', () => this.updateBatchPreview());
        document.getElementById('generate-batch').addEventListener('click', () => this.generateBatch());

        // History
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());

        // Input field listeners for real-time generation
        this.addInputListeners();
    }

    addInputListeners() {
        // Text inputs with debouncing for better performance
        const inputs = [
            'text-input', 'url-input', 'email-to', 'email-subject', 'email-body',
            'phone-input', 'sms-number', 'sms-message', 'wifi-ssid', 'wifi-password',
            'vcard-firstname', 'vcard-lastname', 'vcard-organization', 'vcard-phone',
            'vcard-email', 'vcard-website', 'vcard-address', 'location-lat', 'location-lng',
            'location-name', 'event-title', 'event-location', 'event-start', 'event-end',
            'event-description', 'bitcoin-address', 'bitcoin-amount', 'bitcoin-label'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                let timeout;
                element.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.generateQRCode(), 300);
                });
                element.addEventListener('change', () => this.generateQRCode());
            }
        });

        // Select inputs
        const selects = ['wifi-security', 'wifi-hidden', 'event-allday'];
        selects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.generateQRCode());
            }
        });
    }

    updateSizeDisplay() {
        const size = document.getElementById('qr-size').value;
        document.getElementById('size-value').textContent = size + 'px';
    }

    switchQRType(type) {
        // Update active button
        document.querySelectorAll('.qr-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-type=\"${type}\"]`).classList.add('active');

        // Show/hide forms
        document.querySelectorAll('.qr-form').forEach(form => {
            form.classList.remove('active');
            form.classList.add('hidden');
        });
        
        const activeForm = document.getElementById(`${type}-form`);
        if (activeForm) {
            activeForm.classList.remove('hidden');
            activeForm.classList.add('active');
        }

        this.currentType = type;
        this.generateQRCode();
    }

    getQRData() {
        let data = '';
        
        switch(this.currentType) {
            case 'text':
                data = document.getElementById('text-input').value.trim();
                break;
                
            case 'url':
                data = document.getElementById('url-input').value.trim();
                if (data && !data.startsWith('http://') && !data.startsWith('https://')) {
                    data = 'https://' + data;
                }
                break;
                
            case 'email':
                const emailTo = document.getElementById('email-to').value.trim();
                const emailSubject = document.getElementById('email-subject').value.trim();
                const emailBody = document.getElementById('email-body').value.trim();
                
                if (emailTo) {
                    data = `mailto:${emailTo}`;
                    const params = [];
                    if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
                    if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
                    if (params.length > 0) data += '?' + params.join('&');
                }
                break;
                
            case 'phone':
                const phone = document.getElementById('phone-input').value.trim();
                if (phone) data = `tel:${phone}`;
                break;
                
            case 'sms':
                const smsNumber = document.getElementById('sms-number').value.trim();
                const smsMessage = document.getElementById('sms-message').value.trim();
                if (smsNumber) {
                    data = `sms:${smsNumber}`;
                    if (smsMessage) data += `?body=${encodeURIComponent(smsMessage)}`;
                }
                break;
                
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value.trim();
                const password = document.getElementById('wifi-password').value.trim();
                const security = document.getElementById('wifi-security').value;
                const hidden = document.getElementById('wifi-hidden').checked;
                
                if (ssid) {
                    data = `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
                }
                break;
                
            case 'vcard':
                const firstName = document.getElementById('vcard-firstname').value.trim();
                const lastName = document.getElementById('vcard-lastname').value.trim();
                const organization = document.getElementById('vcard-organization').value.trim();
                const phone_vc = document.getElementById('vcard-phone').value.trim();
                const email_vc = document.getElementById('vcard-email').value.trim();
                const website = document.getElementById('vcard-website').value.trim();
                const vcard_address = document.getElementById('vcard-address').value.trim();
                
                if (firstName || lastName) {
                    data = 'BEGIN:VCARD\\nVERSION:3.0\\n';
                    data += `FN:${firstName} ${lastName}\\n`;
                    data += `N:${lastName};${firstName};;;\\n`;
                    if (organization) data += `ORG:${organization}\\n`;
                    if (phone_vc) data += `TEL:${phone_vc}\\n`;
                    if (email_vc) data += `EMAIL:${email_vc}\\n`;
                    if (website) data += `URL:${website}\\n`;
                    if (vcard_address) data += `ADR:;;${vcard_address};;;;\\n`;
                    data += 'END:VCARD';
                }
                break;
                
            case 'location':
                const lat = document.getElementById('location-lat').value.trim();
                const lng = document.getElementById('location-lng').value.trim();
                const locName = document.getElementById('location-name').value.trim();
                
                if (lat && lng) {
                    if (locName) {
                        data = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(locName)})`;
                    } else {
                        data = `geo:${lat},${lng}`;
                    }
                }
                break;

            case 'event':
                const title = document.getElementById('event-title').value.trim();
                const location = document.getElementById('event-location').value.trim();
                const start = document.getElementById('event-start').value;
                const end = document.getElementById('event-end').value;
                const description = document.getElementById('event-description').value.trim();
                const allday = document.getElementById('event-allday').checked;
                
                if (title && start) {
                    data = 'BEGIN:VEVENT\\n';
                    data += `SUMMARY:${title}\\n`;
                    if (location) data += `LOCATION:${location}\\n`;
                    if (description) data += `DESCRIPTION:${description}\\n`;
                    
                    const startDate = new Date(start);
                    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 3600000);
                    
                    if (allday) {
                        data += `DTSTART;VALUE=DATE:${this.formatDateOnly(startDate)}\\n`;
                        data += `DTEND;VALUE=DATE:${this.formatDateOnly(endDate)}\\n`;
                    } else {
                        data += `DTSTART:${this.formatDateTime(startDate)}\\n`;
                        data += `DTEND:${this.formatDateTime(endDate)}\\n`;
                    }
                    
                    data += 'END:VEVENT';
                }
                break;

            case 'bitcoin':
                const bitcoin_address = document.getElementById('bitcoin-address').value.trim();
                const amount = document.getElementById('bitcoin-amount').value.trim();
                const label = document.getElementById('bitcoin-label').value.trim();
                
                if (bitcoin_address) {
                    data = `bitcoin:${bitcoin_address}`;
                    const params = [];
                    if (amount) params.push(`amount=${amount}`);
                    if (label) params.push(`label=${encodeURIComponent(label)}`);
                    if (params.length > 0) data += '?' + params.join('&');
                }
                break;
        }
        
        return data;
    }

    formatDateTime(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    formatDateOnly(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    }

    async generateQRCode() {
        const data = this.getQRData();
        
        if (!data) {
            document.getElementById('qr-display').innerHTML = '<p class=\"text-gray-500 text-center py-8\">Enter data to generate QR code</p>';
            return;
        }

        this.currentData = data;

        try {
            const size = parseInt(document.getElementById('qr-size').value);
            const quality = parseInt(document.getElementById('qr-quality').value);
            const margin = parseInt(document.getElementById('qr-margin').value);
            const fgColor = document.getElementById('fg-color').value;
            const bgColor = document.getElementById('bg-color').value;
            const errorLevel = document.getElementById('error-level').value;
            const style = document.getElementById('qr-style').value;

            // Generate high-quality QR code using QRCode.js library
            const qrCodeOptions = {
                text: data,
                width: size * quality,
                height: size * quality,
                colorDark: fgColor,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel[errorLevel],
                margin: margin,
                dotScale: style === 'dots' ? 0.8 : 1,
                quietZone: margin,
                quietZoneColor: bgColor,
                logoWidth: 0,
                logoHeight: 0,
                logoBackgroundTransparent: true
            };

            // Clear previous QR code
            document.getElementById('qr-display').innerHTML = '';

            // Generate QR code
            this.currentQRCode = new QRCode(document.getElementById('qr-display'), qrCodeOptions);

            // Add logo if uploaded
            if (this.logoImage) {
                setTimeout(() => this.addLogoToQR(), 100);
            }

            // Show QR info
            this.updateQRInfo(data);

            // Add to history
            this.addToHistory(data, this.currentType);

        } catch (error) {
            console.error('Error generating QR code:', error);
            document.getElementById('qr-display').innerHTML = '<p class=\"text-red-500 text-center py-8\">Error generating QR code</p>';
        }
    }

    regenerateQR() {
        if (this.currentData) {
            this.generateQRCode();
        }
    }

    updateQRInfo(data) {
        const info = document.getElementById('qr-info');
        const byteSize = new Blob([data]).size;
        const charCount = data.length;
        
        info.innerHTML = `
            <div class=\"grid grid-cols-2 gap-4 text-sm\">
                <div><span class=\"font-medium\">Type:</span> ${this.currentType.toUpperCase()}</div>
                <div><span class=\"font-medium\">Size:</span> ${byteSize} bytes</div>
                <div><span class=\"font-medium\">Characters:</span> ${charCount}</div>
                <div><span class=\"font-medium\">Error Level:</span> ${document.getElementById('error-level').value}</div>
            </div>
        `;
    }

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.logoImage = img;
                this.regenerateQR();
                document.getElementById('remove-logo').classList.remove('hidden');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeLogo() {
        this.logoImage = null;
        document.getElementById('logo-upload').value = '';
        document.getElementById('remove-logo').classList.add('hidden');
        this.regenerateQR();
    }

    addLogoToQR() {
        if (!this.logoImage || !this.currentQRCode) return;

        const canvas = document.querySelector('#qr-display canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const logoSize = Math.min(canvas.width, canvas.height) * 0.2;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        // Create circular mask for logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();

        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

        // Draw logo
        ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();
    }

    downloadQR(format) {
        if (!this.currentQRCode) {
            this.showError('No QR code to download');
            return;
        }

        const canvas = document.querySelector('#qr-display canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        const filename = `qr-code-${this.currentType}-${Date.now()}`;

        if (format === 'svg') {
            // Generate SVG version
            this.downloadAsSVG(filename);
        } else {
            // Download as raster image
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            link.download = `${filename}.${format}`;
            link.href = canvas.toDataURL(mimeType, 0.9);
            link.click();
        }
    }

    downloadAsSVG(filename) {
        // Generate SVG version of QR code
        const size = parseInt(document.getElementById('qr-size').value);
        const data = this.currentData;
        
        try {
            const qr = qrcode(0, 'M');
            qr.addData(data);
            qr.make();
            
            const svg = qr.createSvgTag(4, 0);
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            
            const link = document.createElement('a');
            link.download = `${filename}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            
            URL.revokeObjectURL(link.href);
        } catch (error) {
            this.showError('Failed to generate SVG');
        }
    }

    async copyQRToClipboard() {
        if (!this.currentQRCode) {
            this.showError('No QR code to copy');
            return;
        }

        const canvas = document.querySelector('#qr-display canvas');
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                this.showSuccess('QR code copied to clipboard!');
            });
        } catch (error) {
            console.error('Failed to copy QR code:', error);
            this.showError('Failed to copy QR code');
        }
    }

    printQR() {
        if (!this.currentQRCode) {
            this.showError('No QR code to print');
            return;
        }

        const canvas = document.querySelector('#qr-display canvas');
        if (!canvas) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code Print</title>
                    <style>
                        body { margin: 0; padding: 20px; text-align: center; }
                        canvas { max-width: 100%; height: auto; }
                        .info { margin-top: 20px; font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
                    <h2>QR Code - ${this.currentType.toUpperCase()}</h2>
                    <canvas id=\"print-canvas\"></canvas>
                    <div class=\"info\">
                        <p>Data: ${this.currentData}</p>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();

        // Copy canvas to print window
        const printCanvas = printWindow.document.getElementById('print-canvas');
        const printCtx = printCanvas.getContext('2d');
        printCanvas.width = canvas.width;
        printCanvas.height = canvas.height;
        printCtx.drawImage(canvas, 0, 0);

        printWindow.print();
    }

    updateBatchPreview() {
        const input = document.getElementById('batch-input').value;
        const lines = input.split('\\n').filter(line => line.trim());
        document.getElementById('batch-count').textContent = lines.length;
    }

    async generateBatch() {
        const input = document.getElementById('batch-input').value;
        const lines = input.split('\\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            this.showError('Please enter data for batch generation');
            return;
        }

        this.showLoading('Generating QR codes...');

        const zip = new JSZip();
        const size = parseInt(document.getElementById('qr-size').value);

        for (let i = 0; i < lines.length; i++) {
            const data = lines[i].trim();
            try {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                
                const qr = new QRCode(canvas, {
                    text: data,
                    width: size,
                    height: size,
                    colorDark: document.getElementById('fg-color').value,
                    colorLight: document.getElementById('bg-color').value,
                    correctLevel: QRCode.CorrectLevel[document.getElementById('error-level').value]
                });

                // Convert canvas to blob and add to zip
                const blob = await new Promise(resolve => canvas.toBlob(resolve));
                zip.file(`qr-code-${i + 1}.png`, blob);

                // Update progress
                const progress = Math.round(((i + 1) / lines.length) * 100);
                document.getElementById('batch-progress').textContent = `${progress}%`;
            } catch (error) {
                console.error(`Error generating QR code ${i + 1}:`, error);
            }
        }

        // Download zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `qr-codes-batch-${Date.now()}.zip`;
        link.href = URL.createObjectURL(zipBlob);
        link.click();
        
        URL.revokeObjectURL(link.href);
        this.hideLoading();
        this.showSuccess(`Generated ${lines.length} QR codes!`);
    }

    addToHistory(data, type) {
        const item = {
            id: Date.now(),
            data: data,
            type: type,
            timestamp: new Date().toISOString()
        };

        this.qrHistory.unshift(item);
        
        // Keep only last 20 items
        if (this.qrHistory.length > 20) {
            this.qrHistory = this.qrHistory.slice(0, 20);
        }

        this.saveQRHistory();
        this.updateHistoryDisplay();
    }

    loadQRHistory() {
        const saved = localStorage.getItem('qrHistory');
        if (saved) {
            this.qrHistory = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    saveQRHistory() {
        localStorage.setItem('qrHistory', JSON.stringify(this.qrHistory));
    }

    updateHistoryDisplay() {
        const container = document.getElementById('qr-history');
        container.innerHTML = '';

        this.qrHistory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item p-3 border rounded-lg cursor-pointer hover:bg-gray-50';
            div.innerHTML = `
                <div class=\"flex justify-between items-start\">
                    <div class=\"flex-1\">
                        <div class=\"font-medium text-sm\">${item.type.toUpperCase()}</div>
                        <div class=\"text-xs text-gray-500 truncate\">${item.data}</div>
                        <div class=\"text-xs text-gray-400\">${new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                    <button onclick=\"qrGenerator.regenerateFromHistory(${index})\" 
                            class=\"text-blue-600 hover:text-blue-800 text-sm\">
                        Regenerate
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    regenerateFromHistory(index) {
        const item = this.qrHistory[index];
        if (item) {
            // Set the appropriate form data
            this.switchQRType(item.type);
            
            // Fill in the data based on type
            switch (item.type) {
                case 'text':
                    document.getElementById('text-input').value = item.data;
                    break;
                case 'url':
                    document.getElementById('url-input').value = item.data.replace(/^https?:\/\//, '');
                    break;
                // Add more cases as needed
            }
            
            this.generateQRCode();
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all QR history?')) {
            this.qrHistory = [];
            this.saveQRHistory();
            this.updateHistoryDisplay();
        }
    }

    showLoading(message) {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white shadow-lg`;
        
        notification.innerHTML = `
            <div class=\"flex items-center\">
                <i class=\"fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2\"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.qrGenerator = new EnhancedQRGenerator();
});
