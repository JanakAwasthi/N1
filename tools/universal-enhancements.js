/**
 * Universal Tool Enhancements
 * Enhanced version that works with shared utilities
 */

// Add enhanced scrolling and UI features to any tool
function initializeToolEnhancements() {
    // Add scroll-to-top button
    addScrollToTopButton();
    
    // Enhanced scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Auto-resize textareas if any exist
    autoResizeTextareas();
    
    // Enhanced form styling
    enhanceFormInputs();
    
    // Initialize particles if container exists
    if (document.getElementById('particles-js')) {
        ToolUtils.initParticles();
    }
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
    
    // Apply global dark theme and contrast fixes
    applyDarkThemeOverrides();
    
    // Improve focus visibility for accessibility
    addAccessibleFocusStyles();

    // Inject branding, SEO, and monetization
    injectFavicon();
    injectSEOMetadata();
    injectStructuredData();
    injectAdSenseAutoAds();
    ensureManualAdUnit();
}

// Add scroll-to-top button
function addScrollToTopButton() {
    const existing = document.querySelector('.scroll-to-top-btn');
    if (existing) return;
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollButton.className = 'scroll-to-top-btn';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 120px;
        right: 30px;
        background: linear-gradient(45deg, #00d4ff, #ff0080);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        font-size: 16px;
    `;

    document.body.appendChild(scrollButton);

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Auto-resize textareas
function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.max(this.scrollHeight, 100) + 'px';
        });
    });
}

// Enhance form inputs with better styling
function enhanceFormInputs() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="url"], textarea');
    
    inputs.forEach(input => {
        // Add focus enhancement
        input.addEventListener('focus', function() {
            this.style.borderColor = '#00d4ff';
            this.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
        
        // Improve text color and background for better visibility
        if (input.style.color === '' || input.style.color === 'black') {
            input.style.color = '#ffffff';
            input.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
            input.style.border = '2px solid rgba(0, 212, 255, 0.3)';
            input.style.borderRadius = '8px';
            input.style.padding = '10px';
        }
    });
}

// Add keyboard shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+H for Home
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '../../index.html';
        }
        
        // Ctrl+D for Download (if download button exists)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn && !downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
        
        // Escape to clear any active modals or reset interface
        if (e.key === 'Escape') {
            // Clear any status messages
            const statusMessages = document.querySelectorAll('.status-message');
            statusMessages.forEach(msg => msg.remove());
        }
    });
}

// Enhanced file handling
function enhanceFileHandling() {
    // Prevent page refresh on file drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
}

// Add tool-specific analytics (optional)
function addAnalytics() {
    // Track tool usage (implement if needed)
    const toolName = document.title.split(' - ')[0];
    console.log(`Tool loaded: ${toolName}`);
}

// Add CSS for enhanced scrollbars if not already present
function addEnhancedScrollbarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced scrollbar styling */
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 6px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(45deg, #00d4ff, #ff0080); border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(45deg, #ff0080, #00d4ff); }
        html { scroll-behavior: smooth; }
        input[type="text"]:focus, 
        input[type="password"]:focus, 
        input[type="email"]:focus, 
        input[type="url"]:focus, 
        textarea:focus { outline: none !important; border-color: #00d4ff !important; box-shadow: 0 0 10px rgba(0, 212, 255, 0.3) !important; }
    `;
    document.head.appendChild(style);
}

function applyDarkThemeOverrides(){
    document.body.classList.add('dark-enhanced');
    const styleId = 'dark-theme-overrides';
    if(document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      body.dark-enhanced { background: #0a0a0f; color: #ffffff; }
      body.dark-enhanced a { color: #00d4ff; }
      body.dark-enhanced .bg-white, body.dark-enhanced .bg-gray-50, body.dark-enhanced .bg-green-50, body.dark-enhanced .bg-blue-50 { background: rgba(26,26,40,0.95) !important; }
      body.dark-enhanced .text-gray-900, body.dark-enhanced .text-gray-800, body.dark-enhanced .text-black { color: #ffffff !important; }
      body.dark-enhanced .text-gray-700, body.dark-enhanced .text-gray-600, body.dark-enhanced .text-gray-500 { color: #b0b0c0 !important; }
      body.dark-enhanced .border-gray-200, body.dark-enhanced .border-gray-300 { border-color: #222244 !important; }
      body.dark-enhanced input, body.dark-enhanced select, body.dark-enhanced textarea { background: rgba(30,30,44,0.95) !important; color:#fff !important; border:1px solid #00d4ff !important; }
      body.dark-enhanced .dropzone, body.dark-enhanced .file-upload-area { border:2px dashed #00d4ff !important; background: rgba(0,212,255,0.08) !important; }
      body.dark-enhanced .merge-progress, body.dark-enhanced .progress-bar { background: linear-gradient(90deg, #00d4ff, #ff0080) !important; }
      body.dark-enhanced .glass-button, body.dark-enhanced .cyber-button { background: linear-gradient(90deg, #00d4ff, #7c3aed) !important; color: #fff !important; }
      body.dark-enhanced .download-btn { background: linear-gradient(45deg, #00ff88, #00cc66) !important; color:#fff; }
      body.dark-enhanced .rounded-xl, body.dark-enhanced .rounded-lg { border-color: #222244 !important; }
      body.dark-enhanced .feature-card { background: linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.06)) !important; border:1px solid rgba(0,212,255,0.25) !important; }
    `;
    document.head.appendChild(style);
}

function addAccessibleFocusStyles(){
    const styleId = 'accessible-focus-styles';
    if(document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :focus { outline: 2px solid #ff0080 !important; outline-offset: 2px; }
      button:focus, a:focus, input:focus, select:focus, textarea:focus { box-shadow: 0 0 0 3px rgba(255,0,128,0.25) !important; }
    `;
    document.head.appendChild(style);
}

// Inject favicon if missing
function injectFavicon(){
    // Use .ico globally as requested
    const hasIcon = document.querySelector('link[rel="icon"]');
    if(!hasIcon){
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        // adjust relative path for nested tools
        link.href = (location.pathname.includes('/tools/')) ? '../../favicon.ico' : './favicon.ico';
        document.head.appendChild(link);
    }
}

// Inject baseline SEO metadata if missing
function injectSEOMetadata(){
    const head = document.head;
    const title = document.title || 'LinkToQR.me NEXUS Tools';

    if(!document.querySelector('meta[name="description"]')){
        const m = document.createElement('meta');
        m.name = 'description';
        m.content = `${title} - Fast, private, and free online tools.`;
        head.appendChild(m);
    }
    if(!document.querySelector('meta[name="keywords"]')){
        const m = document.createElement('meta');
        m.name = 'keywords';
        m.content = 'online tools, pdf, image, qr, compressor, merger, scanner, converter, crop, edit, secure, linktoqr, nexus';
        head.appendChild(m);
    }
    if(!document.querySelector('link[rel="canonical"]')){
        const link = document.createElement('link');
        link.rel = 'canonical';
        const url = location.origin + location.pathname;
        link.href = url;
        head.appendChild(link);
    }
    // Open Graph
    if(!document.querySelector('meta[property="og:title"]')){
        const m = document.createElement('meta'); m.setAttribute('property','og:title'); m.content = title; head.appendChild(m);
    }
    if(!document.querySelector('meta[property="og:type"]')){
        const m = document.createElement('meta'); m.setAttribute('property','og:type'); m.content = 'website'; head.appendChild(m);
    }
    if(!document.querySelector('meta[property="og:image"]')){
        const m = document.createElement('meta'); m.setAttribute('property','og:image'); m.content = location.origin + '/favicon.ico'; head.appendChild(m);
    }
    if(!document.querySelector('meta[name="twitter:card"]')){
        const m = document.createElement('meta'); m.name = 'twitter:card'; m.content = 'summary_large_image'; head.appendChild(m);
    }

    // Optional: placeholder site verification (replace token in production)
    if(!document.querySelector('meta[name="google-site-verification"]')){
        const m = document.createElement('meta');
        m.name = 'google-site-verification';
        m.content = 'REPLACE_WITH_YOUR_VERIFICATION_TOKEN';
        head.appendChild(m);
    }
}

// Inject JSON-LD structured data for Organization and WebSite
function injectStructuredData(){
    if(!document.getElementById('jsonld-org')){
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'jsonld-org';
        script.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'LinkToQR.me NEXUS',
            url: location.origin,
            logo: location.origin + '/favicon.ico'
        });
        document.head.appendChild(script);
    }

    if(!document.getElementById('jsonld-site')){
        const script2 = document.createElement('script');
        script2.type = 'application/ld+json';
        script2.id = 'jsonld-site';
        script2.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: document.title || 'LinkToQR.me NEXUS',
            url: location.origin,
            potentialAction: {
                '@type': 'SearchAction',
                target: `${location.origin}/?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
            }
        });
        document.head.appendChild(script2);
    }
}

// Inject AdSense Auto Ads script if missing
function injectAdSenseAutoAds(){
    const clientId = 'ca-pub-6126558809611102';
    if(!document.querySelector('meta[name="google-adsense-account"]')){
        const m = document.createElement('meta');
        m.name = 'google-adsense-account';
        m.content = clientId;
        document.head.appendChild(m);
    }
    if(!document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')){
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        s.setAttribute('crossorigin','anonymous');
        document.head.appendChild(s);
    }
}

// Ensure at least one manual responsive ad unit exists
function ensureManualAdUnit(){
    const hasAd = document.querySelector('ins.adsbygoogle');
    if(hasAd) return;

    // Create an ad container near the top of main content or body
    const container = document.querySelector('main') || document.body;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin:16px 0; display:block; text-align:center;';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', 'ca-pub-6126558809611102');
    ins.setAttribute('data-ad-slot', '9131891151');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    wrapper.appendChild(ins);
    container.insertBefore(wrapper, container.firstChild);

    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) { /* ignore */ }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeToolEnhancements();
    addEnhancedScrollbarStyles();
});

// Also initialize if script is loaded after DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToolEnhancements);
} else {
    initializeToolEnhancements();
    addEnhancedScrollbarStyles();
}
