// Password Generator functionality
class PasswordGenerator {
    constructor() {
        this.passwordHistory = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        this.isReady = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeGenerator());
        } else {
            this.initializeGenerator();
        }
    }

    initializeGenerator() {
        console.log('Initializing Password Generator...');
        this.updateHistory();
        this.setupEventListeners();
        this.isReady = true;
        
        // Generate initial password
        this.generatePassword();
        console.log('Password Generator initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Length slider
        const lengthSlider = document.getElementById('passwordLength');
        const lengthValue = document.getElementById('lengthValue');
        
        if (lengthSlider && lengthValue) {
            console.log('Length slider found, adding event listener');
            lengthSlider.addEventListener('input', (e) => {
                console.log('Length changed to:', e.target.value);
                lengthValue.textContent = e.target.value;
                this.generatePassword();
                this.showPasswordGenerated();
            });
        } else {
            console.error('Length slider elements not found');
        }

        // Checkboxes
        const checkboxIds = ['includeUppercase', 'includeLowercase', 'includeNumbers', 'includeSymbols', 'excludeAmbiguous'];
        checkboxIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                console.log(`Adding listener for ${id}`);
                checkbox.addEventListener('change', () => {
                    console.log(`${id} changed to:`, checkbox.checked);
                    this.generatePassword();
                    this.showPasswordGenerated();
                });
            } else {
                console.error(`Checkbox ${id} not found`);
            }
        });
        
        console.log('Event listeners setup complete');
    }

    generatePassword() {
        console.log('generatePassword() called');
        
        if (!this.isReady) {
            console.log('Generator not ready yet');
            return;
        }

        // Get DOM elements
        const lengthInput = document.getElementById('passwordLength');
        const uppercaseCheck = document.getElementById('includeUppercase');
        const lowercaseCheck = document.getElementById('includeLowercase');
        const numbersCheck = document.getElementById('includeNumbers');
        const symbolsCheck = document.getElementById('includeSymbols');
        const ambiguousCheck = document.getElementById('excludeAmbiguous');
        const passwordField = document.getElementById('generatedPassword');

        if (!lengthInput || !passwordField) {
            console.error('Required DOM elements not found');
            return;
        }

        const length = parseInt(lengthInput.value) || 12;
        const includeUppercase = uppercaseCheck ? uppercaseCheck.checked : true;
        const includeLowercase = lowercaseCheck ? lowercaseCheck.checked : true;
        const includeNumbers = numbersCheck ? numbersCheck.checked : true;
        const includeSymbols = symbolsCheck ? symbolsCheck.checked : true;
        const excludeAmbiguous = ambiguousCheck ? ambiguousCheck.checked : false;

        console.log('Password settings:', {
            length,
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols,
            excludeAmbiguous
        });

        // Build character set
        let charset = '';
        let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        let numberChars = '0123456789';
        let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Exclude ambiguous characters if requested
        if (excludeAmbiguous) {
            uppercaseChars = uppercaseChars.replace(/[O]/g, '');
            lowercaseChars = lowercaseChars.replace(/[l]/g, '');
            numberChars = numberChars.replace(/[0]/g, '');
        }

        if (includeUppercase) charset += uppercaseChars;
        if (includeLowercase) charset += lowercaseChars;
        if (includeNumbers) charset += numberChars;
        if (includeSymbols) charset += symbolChars;

        if (charset === '') {
            console.error('No character types selected');
            alert('Please select at least one character type');
            return;
        }

        // Generate password
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        console.log('Generated password:', password);

        // Display password
        passwordField.value = password;

        // Update strength meter
        this.updateStrengthMeter(password);

        // Show save to history button
        this.showSaveToHistoryButton(password);
        
        console.log('Password generation complete');
    }

    updateStrengthMeter(password) {
        const strength = this.calculateStrength(password);
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        let strengthClass = '';
        let strengthLabel = '';
        let strengthPercentage = 0;

        if (strength.score < 30) {
            strengthClass = 'strength-weak';
            strengthLabel = 'Weak';
            strengthPercentage = 25;
        } else if (strength.score < 60) {
            strengthClass = 'strength-medium';
            strengthLabel = 'Medium';
            strengthPercentage = 50;
        } else if (strength.score < 90) {
            strengthClass = 'strength-strong';
            strengthLabel = 'Strong';
            strengthPercentage = 75;
        } else {
            strengthClass = 'strength-very-strong';
            strengthLabel = 'Very Strong';
            strengthPercentage = 100;
        }

        strengthBar.className = `h-full transition-all duration-300 ${strengthClass}`;
        strengthBar.style.width = `${strengthPercentage}%`;
        strengthText.textContent = `${strengthLabel} (${strength.score}/100)`;
    }

    calculateStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password),
            longLength: password.length >= 12,
            veryLongLength: password.length >= 16
        };

        // Length scoring
        if (checks.length) score += 20;
        if (checks.longLength) score += 10;
        if (checks.veryLongLength) score += 10;

        // Character type scoring
        if (checks.uppercase) score += 15;
        if (checks.lowercase) score += 15;
        if (checks.numbers) score += 15;
        if (checks.symbols) score += 15;

        return { score: Math.min(score, 100), checks };
    }

    showPasswordGenerated() {
        // Add visual feedback when password is generated
        const passwordField = document.getElementById('generatedPassword');
        if (passwordField) {
            passwordField.classList.add('flash-green');
            setTimeout(() => {
                passwordField.classList.remove('flash-green');
            }, 300);
        }
    }

    showSaveToHistoryButton(password) {
        // Show the save to history button after password generation
        const saveButton = document.getElementById('saveToHistoryBtn');
        if (saveButton) {
            saveButton.classList.remove('hidden');
            saveButton.onclick = () => this.saveCurrentPasswordToHistory(password);
        }
    }

    saveCurrentPasswordToHistory(password) {
        this.addToHistory(password);
        
        // Hide the save button after saving
        const saveButton = document.getElementById('saveToHistoryBtn');
        if (saveButton) {
            saveButton.classList.add('hidden');
        }
        
        showNotification('Password saved to history!', 'success');
    }

    addToHistory(password) {
        console.log('Adding password to history:', password);
        
        const websiteInput = document.getElementById('websiteName');
        const websiteName = (websiteInput ? websiteInput.value.trim() : '') || 'Unspecified';
        
        const historyItem = {
            password: password,
            website: websiteName,
            strength: this.calculateStrength(password).score,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        console.log('History item:', historyItem);

        this.passwordHistory.unshift(historyItem);
        this.passwordHistory = this.passwordHistory.slice(0, 20); // Keep only last 20
        localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        this.updateHistory();
        
        console.log('Password added to history successfully');
    }

    updateHistory() {
        const historyContainer = document.getElementById('passwordHistory');
        
        if (this.passwordHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No passwords generated yet</p>';
            return;
        }

        historyContainer.innerHTML = this.passwordHistory.map(item => {
            const strengthColor = item.strength < 30 ? 'text-red-600' : 
                                 item.strength < 60 ? 'text-yellow-600' : 
                                 item.strength < 90 ? 'text-green-600' : 'text-green-700';
            
            const websiteIcon = this.getWebsiteIcon(item.website);
            
            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center space-x-2">
                            <i class="fas ${websiteIcon} text-blue-500"></i>
                            <span class="font-medium text-gray-800">${item.website}</span>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="copyToClipboard('${item.password}')" 
                                    class="text-blue-500 hover:text-blue-700 text-sm">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="usePassword('${item.password}')" 
                                    class="text-green-500 hover:text-green-700 text-sm">
                                <i class="fas fa-redo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="font-mono text-sm bg-white px-3 py-2 rounded border mb-2 truncate">${item.password}</div>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>${new Date(item.timestamp).toLocaleString()}</span>
                        <span class="${strengthColor}">Strength: ${item.strength}/100</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the password history?')) {
            this.passwordHistory = [];
            localStorage.removeItem('passwordHistory');
            this.updateHistory();
            showNotification('Password history cleared', 'success');
        }
    }

    getWebsiteIcon(website) {
        const websiteLower = website.toLowerCase();
        
        // Common website icons mapping
        const iconMap = {
            'gmail': 'fa-envelope',
            'email': 'fa-envelope',
            'facebook': 'fa-share-alt',
            'twitter': 'fa-share-alt',
            'instagram': 'fa-camera',
            'linkedin': 'fa-briefcase',
            'github': 'fa-code',
            'amazon': 'fa-shopping-cart',
            'netflix': 'fa-play',
            'youtube': 'fa-video',
            'spotify': 'fa-music',
            'bank': 'fa-university',
            'banking': 'fa-university',
            'credit': 'fa-credit-card',
            'paypal': 'fa-credit-card',
            'apple': 'fa-mobile-alt',
            'google': 'fa-search',
            'microsoft': 'fa-windows',
            'steam': 'fa-gamepad',
            'discord': 'fa-comments',
            'slack': 'fa-comments',
            'zoom': 'fa-video',
            'dropbox': 'fa-cloud',
            'onedrive': 'fa-cloud',
            'icloud': 'fa-cloud'
        };

        for (const [key, icon] of Object.entries(iconMap)) {
            if (websiteLower.includes(key)) {
                return icon;
            }
        }

        return 'fa-globe'; // Default icon
    }
}

// Initialize when DOM is ready
let passwordGenerator;

// Simple initialization
console.log('Starting Password Generator initialization...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, creating password generator');
        passwordGenerator = new PasswordGenerator();
    });
} else {
    console.log('DOM already loaded, creating password generator immediately');
    passwordGenerator = new PasswordGenerator();
}

function generatePassword() {
    console.log('Global generatePassword() called');
    if (passwordGenerator && passwordGenerator.isReady) {
        passwordGenerator.generatePassword();
        passwordGenerator.showPasswordGenerated();
    } else {
        console.error('Password generator not ready or not initialized');
        // Try to initialize if not ready
        if (!passwordGenerator) {
            passwordGenerator = new PasswordGenerator();
        }
    }
}

function copyPassword() {
    const passwordField = document.getElementById('generatedPassword');
    if (passwordField && passwordField.value) {
        passwordField.select();
        document.execCommand('copy');
        showNotification('Password copied to clipboard!', 'success');
    } else {
        showNotification('No password to copy!', 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Password copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Password copied to clipboard!', 'success');
    });
}

function clearHistory() {
    if (passwordGenerator) {
        passwordGenerator.clearHistory();
    }
}

function usePassword(password) {
    document.getElementById('generatedPassword').value = password;
    if (passwordGenerator) {
        passwordGenerator.updateStrengthMeter(password);
        // Show save button for reused password
        passwordGenerator.showSaveToHistoryButton(password);
    }
    showNotification('Password loaded from history', 'success');
}

function saveCurrentPassword() {
    const passwordField = document.getElementById('generatedPassword');
    if (passwordField && passwordField.value && passwordGenerator) {
        passwordGenerator.saveCurrentPasswordToHistory(passwordField.value);
    } else {
        showNotification('No password to save!', 'error');
    }
}

function debugPasswordGenerator() {
    console.log('=== PASSWORD GENERATOR DEBUG ===');
    console.log('passwordGenerator exists:', !!passwordGenerator);
    console.log('passwordGenerator.isReady:', passwordGenerator ? passwordGenerator.isReady : 'N/A');
    
    // Check DOM elements
    const elements = {
        passwordLength: document.getElementById('passwordLength'),
        lengthValue: document.getElementById('lengthValue'),
        generatedPassword: document.getElementById('generatedPassword'),
        includeUppercase: document.getElementById('includeUppercase'),
        includeLowercase: document.getElementById('includeLowercase'),
        includeNumbers: document.getElementById('includeNumbers'),
        includeSymbols: document.getElementById('includeSymbols'),
        excludeAmbiguous: document.getElementById('excludeAmbiguous'),
        websiteName: document.getElementById('websiteName')
    };
    
    console.log('DOM elements:', elements);
    
    // Try manual generation
    if (passwordGenerator) {
        console.log('Attempting manual password generation...');
        passwordGenerator.generatePassword();
    } else {
        console.log('Creating new password generator...');
        passwordGenerator = new PasswordGenerator();
    }
    
    console.log('=== END DEBUG ===');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Additional failsafe - generate password immediately when page loads
window.addEventListener('load', function() {
    setTimeout(() => {
        if (passwordGenerator) {
            // Ensure password is generated and saved to history
            const passwordField = document.getElementById('generatedPassword');
            if (!passwordField.value) {
                passwordGenerator.generatePassword();
            }
        } else {
            // If passwordGenerator still not ready, try to generate manually
            const passwordField = document.getElementById('generatedPassword');
            if (passwordField && !passwordField.value) {
                // Generate a simple password as fallback
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 12; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                passwordField.value = password;
                
                // Show save to history button for manually generated password
                const saveButton = document.getElementById('saveToHistoryBtn');
                if (saveButton) {
                    saveButton.classList.remove('hidden');
                    saveButton.onclick = () => {
                        const websiteName = document.getElementById('websiteName')?.value?.trim() || 'Unspecified';
                        const historyItem = {
                            password: password,
                            website: websiteName,
                            strength: 75,
                            timestamp: new Date().toISOString(),
                            id: Date.now()
                        };
                        
                        let history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
                        history.unshift(historyItem);
                        history = history.slice(0, 20);
                        localStorage.setItem('passwordHistory', JSON.stringify(history));
                        
                        saveButton.classList.add('hidden');
                        showNotification('Password saved to history!', 'success');
                    };
                }
            }
        }
    }, 200); // Increased delay to ensure DOM is ready
});
