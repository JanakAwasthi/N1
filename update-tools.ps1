# PowerShell script to update all tools with favicon, SEO, and navigation

$toolDirs = Get-ChildItem -Path ".\tools" -Directory

foreach ($dir in $toolDirs) {
    $toolName = $dir.Name
    $indexPath = Join-Path $dir.FullName "index.html"
    
    if (Test-Path $indexPath) {
        Write-Host "Updating $toolName..."
        
        $content = Get-Content $indexPath -Raw
        
        # Check if favicon is already present
  if ($content -notmatch "favicon\.ico") {
            Write-Host "  Adding favicon to $toolName"
            
            # Add favicon after the title tag
            $faviconHtml = @"
  
  <!-- Favicon and App Icons (.ico everywhere) -->
  <link rel="icon" type="image/x-icon" href="../../favicon.ico">
  <link rel="shortcut icon" type="image/x-icon" href="../../favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../../favicon.ico">
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="Advanced $($toolName.Replace('-', ' ')) tool - Part of LinkToQR.me NEXUS toolkit.">
  <meta name="keywords" content="$($toolName.Replace('-', ' ')), LinkToQR, web tools, nexus">
  <meta name="author" content="LinkToQR.me NEXUS">
  
  <!-- Social Media Meta Tags -->
  <meta property="og:title" content="$($toolName.Replace('-', ' ')) - LinkToQR.me NEXUS">
  <meta property="og:description" content="Advanced $($toolName.Replace('-', ' ')) tool - Part of LinkToQR.me NEXUS toolkit.">
  <meta property="og:image" content="../../favicon.ico">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$($toolName.Replace('-', ' ')) - LinkToQR.me NEXUS">
  <meta name="twitter:description" content="Advanced $($toolName.Replace('-', ' ')) tool - Part of LinkToQR.me NEXUS toolkit.">
  <meta name="twitter:image" content="../../favicon.ico">
"@
            
            $content = $content -replace "</title>", "</title>$faviconHtml"
        }
        
        # Check if home navigation is present
        if ($content -notmatch "HOME|Home") {
            Write-Host "  Adding navigation to $toolName"
            
            # Look for body tag and add navigation
            $navHtml = @"

  <!-- Header -->
  <header class="cyber-header sticky top-0 z-50 w-full py-4 mb-8" style="background: rgba(10, 10, 10, 0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0, 212, 255, 0.3);">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <a href="../../index.html" class="flex items-center">
          <span class="text-3xl font-bold" style="background: linear-gradient(45deg, #00d4ff, #ff0080); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">⚡ LinkToQR.me</span>
          <span class="text-lg font-semibold text-gray-400 ml-2">NEXUS</span>
        </a>

        <!-- Tool Name -->
        <div class="hidden md:block">
          <span class="text-xl font-semibold text-cyan-400">$($toolName.ToUpper().Replace('-', ' '))</span>
        </div>

        <!-- Navigation -->
        <nav class="flex space-x-4">
          <a href="../../index.html" style="background: linear-gradient(45deg, #00d4ff, #ff0080); border: none; border-radius: 25px; padding: 8px 20px; color: white; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center;">
            <i class="fas fa-home mr-2"></i>HOME
          </a>
        </nav>
      </div>
    </div>
  </header>
"@
            
            $content = $content -replace "<body([^>]*)>", "<body`$1>$navHtml"
        }
        
        Set-Content $indexPath $content -Encoding UTF8
        Write-Host "  ✓ Updated $toolName"
    }
}

Write-Host "All tools updated!"
