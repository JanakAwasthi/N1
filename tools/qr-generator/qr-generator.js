/**
 * Advanced QR Code Generator with Full Functionality
 * Supports multiple QR types, customization, and download options
 */

class QRCodeGenerator {
    constructor() {
        this.currentQRCode = null;
        this.currentType = 'text';
        this.currentData = '';
        
        this.initializeEventListeners();
        this.updateSizeDisplay();
    }

    initializeEventListeners() {
        // QR Type buttons
        document.querySelectorAll('.qr-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchQRType(e.target.dataset.type));
        });

        // Size slider
        document.getElementById('qr-size').addEventListener('input', (e) => {
            this.updateSizeDisplay();
            this.regenerateQR();
        });

        // Color inputs
        document.getElementById('fg-color').addEventListener('change', () => this.regenerateQR());
        document.getElementById('bg-color').addEventListener('change', () => this.regenerateQR());
        document.getElementById('error-level').addEventListener('change', () => this.regenerateQR());

        // Input field listeners for real-time generation
        this.addInputListeners();
    }

    addInputListeners() {
        // Text inputs
        const inputs = [
            'text-input', 'url-input', 'email-to', 'email-subject', 'email-body',
            'phone-input', 'sms-number', 'sms-message', 'wifi-ssid', 'wifi-password',
            'vcard-firstname', 'vcard-lastname', 'vcard-organization', 'vcard-phone',
            'vcard-email', 'vcard-website', 'location-lat', 'location-lng'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.generateQRCode());
                element.addEventListener('change', () => this.generateQRCode());
            }
        });

        // Select inputs
        document.getElementById('wifi-security').addEventListener('change', () => this.generateQRCode());
    }

    updateSizeDisplay() {
        const size = document.getElementById('qr-size').value;
        document.getElementById('size-value').textContent = size + 'px';
    }

    switchQRType(type) {
        // Update active button
        document.querySelectorAll('.qr-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

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
                
                if (ssid) {
                    data = `WIFI:T:${security};S:${ssid};P:${password};H:false;;`;
                }
                break;
                
            case 'vcard':
                const firstName = document.getElementById('vcard-firstname').value.trim();
                const lastName = document.getElementById('vcard-lastname').value.trim();
                const org = document.getElementById('vcard-organization').value.trim();
                const vcardPhone = document.getElementById('vcard-phone').value.trim();
                const vcardEmail = document.getElementById('vcard-email').value.trim();
                const website = document.getElementById('vcard-website').value.trim();
                
                if (firstName || lastName) {
                    data = 'BEGIN:VCARD\nVERSION:3.0\n';
                    data += `FN:${firstName} ${lastName}\n`;
                    data += `N:${lastName};${firstName};;;\n`;
                    if (org) data += `ORG:${org}\n`;
                    if (vcardPhone) data += `TEL:${vcardPhone}\n`;
                    if (vcardEmail) data += `EMAIL:${vcardEmail}\n`;
                    if (website) data += `URL:${website}\n`;
                    data += 'END:VCARD';
                }
                break;
                
            case 'location':
                const lat = document.getElementById('location-lat').value.trim();
                const lng = document.getElementById('location-lng').value.trim();
                
                if (lat && lng) {
                    data = `geo:${lat},${lng}`;
                }
                break;
        }
        
        return data;
    }

    generateQRCode() {
        const data = this.getQRData();
        
        if (!data) {
            this.hideQRCode();
            return;
        }

        this.currentData = data;
        this.createQRCode(data);
        this.updateQRInfo(data);
        this.showQRCode();
    }

    createQRCode(data) {
        const qrContainer = document.getElementById('qr-code');
        qrContainer.innerHTML = ''; // Clear previous QR code

        const size = parseInt(document.getElementById('qr-size').value);
        const fgColor = document.getElementById('fg-color').value;
        const bgColor = document.getElementById('bg-color').value;
        const errorLevel = document.getElementById('error-level').value;

        // Map error correction levels
        const errorLevels = {
            'L': QRCode.CorrectLevel.L,
            'M': QRCode.CorrectLevel.M,
            'Q': QRCode.CorrectLevel.Q,
            'H': QRCode.CorrectLevel.H
        };

        try {
            this.currentQRCode = new QRCode(qrContainer, {
                text: data,
                width: size,
                height: size,
                colorDark: fgColor,
                colorLight: bgColor,
                correctLevel: errorLevels[errorLevel] || QRCode.CorrectLevel.H
            });        } catch (error) {
            console.error('Error generating QR code:', error);
            ToolUtils.showStatus('Error generating QR code. Please check your input.', 'error');
        }
    }

    regenerateQR() {
        if (this.currentData) {
            this.createQRCode(this.currentData);
        }
    }    updateQRInfo(data) {
        // Update output details using shared utility
        const details = {
            'Type': this.currentType.toUpperCase(),
            'Size': document.getElementById('qr-size').value + 'px',
            'Error Level': document.getElementById('error-level').value,
            'Data Length': data.length + ' characters',
            'Format': 'QR Code',
            'Colors': `${document.getElementById('fg-color').value} / ${document.getElementById('bg-color').value}`
        };
        
        ToolUtils.updateOutputDetails(details);
    }    showQRCode() {
        const preview = document.getElementById('qr-preview');
        const container = document.getElementById('qr-container');
        const downloadOptions = document.getElementById('download-options');

        preview.classList.add('output-ready');
        container.classList.remove('hidden');
        downloadOptions.classList.remove('hidden');

        // Hide placeholder
        const icon = preview.querySelector('i');
        const text = preview.querySelector('p');
        if (icon) icon.style.display = 'none';
        if (text) text.style.display = 'none';
        
        ToolUtils.showStatus('QR Code generated successfully!', 'success', 2000);
    }    hideQRCode() {
        const preview = document.getElementById('qr-preview');
        const container = document.getElementById('qr-container');
        const downloadOptions = document.getElementById('download-options');

        preview.classList.remove('output-ready');
        container.classList.add('hidden');
        downloadOptions.classList.add('hidden');

        // Show placeholder
        const icon = preview.querySelector('i');
        const text = preview.querySelector('p');
        if (icon) icon.style.display = 'block';
        if (text) text.style.display = 'block';
        
        // Clear output details
        ToolUtils.updateOutputDetails({});
    }    showError(message) {
        ToolUtils.showStatus(message, 'error');
        const preview = document.getElementById('qr-preview');
        preview.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;"></i>
            <p style="color: var(--error)">${message}</p>
        `;
    }
}

// Enhanced download functions
function downloadQR(format) {
    const qrCode = document.querySelector('#qr-code canvas');
    if (!qrCode) {
        ToolUtils.showStatus('No QR code to download', 'error');
        return;
    }

    const canvas = qrCode;
    const size = document.getElementById('qr-size').value;
    
    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(50);
    
    try {
        if (format === 'svg') {
            downloadSVG();
            return;
        }

        canvas.toBlob((blob) => {
            const filename = `qr-code-${Date.now()}.${format}`;
            const downloadBtn = ToolUtils.createDownloadButton(blob, filename, `Download ${format.toUpperCase()}`);
            
            // Auto-download
            downloadBtn.click();
            
            ToolUtils.showLoading(false);
            ToolUtils.updateProgress(100);
            ToolUtils.showStatus(`QR code downloaded as ${format.toUpperCase()}`, 'success');
            
            setTimeout(() => ToolUtils.updateProgress(0), 1000);
        }, format === 'png' ? 'image/png' : 'image/jpeg', 0.9);
        
    } catch (error) {
        ToolUtils.showLoading(false);
        ToolUtils.showStatus('Error downloading QR code', 'error');
    }
}

function downloadSVG() {
    const qrData = qrGenerator.currentData;
    if (!qrData) {
        ToolUtils.showStatus('No QR code data available', 'error');
        return;
    }

    const canvas = document.querySelector('#qr-code canvas');
    const size = parseInt(document.getElementById('qr-size').value);
    const fgColor = document.getElementById('fg-color').value;
    const bgColor = document.getElementById('bg-color').value;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
         width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
         <rect width="${size}" height="${size}" fill="${bgColor}"/>
         <image xlink:href="${canvas.toDataURL()}" width="${size}" height="${size}"/>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const filename = `qr-code-${Date.now()}.svg`;
    const downloadBtn = ToolUtils.createDownloadButton(blob, filename, 'Download SVG');
    downloadBtn.click();
    
    ToolUtils.showStatus('QR code downloaded as SVG', 'success');
}

function printQR() {
    const qrCode = document.querySelector('#qr-code canvas');
    if (!qrCode) {
        ToolUtils.showStatus('No QR code to print', 'error');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>QR Code Print</title>
                <style>
                    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <img src="${qrCode.toDataURL()}" alt="QR Code" />
                <script>window.print(); window.close();</script>
            </body>
        </html>
    `);
    
    ToolUtils.showStatus('QR code sent to printer', 'success');
}

function getMyLocation() {
    if (!navigator.geolocation) {
        ToolUtils.showStatus('Geolocation is not supported by this browser.', 'error');
        return;
    }

    ToolUtils.showLoading(true);
    ToolUtils.showStatus('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('location-lat').value = position.coords.latitude.toFixed(6);
            document.getElementById('location-lng').value = position.coords.longitude.toFixed(6);
            qrGenerator.generateQRCode();
            ToolUtils.showLoading(false);
            ToolUtils.showStatus('Location acquired successfully!', 'success');
        },
        (error) => {
            ToolUtils.showLoading(false);
            ToolUtils.showStatus('Error getting location: ' + error.message, 'error');
        }
    );
}

// Initialize the QR Generator when DOM is loaded
let qrGenerator;
document.addEventListener('DOMContentLoaded', () => {
    qrGenerator = new QRCodeGenerator();
});
