# Tool Links Fix - Open in Same Tab

## Issue Fixed:
Tool links on the homepage were opening in new tabs instead of the same tab.

## Root Cause:
The main category cards used `onclick="window.open('...', '_blank')"` which forced links to open in new tabs.

## Solution Applied:
Changed all `window.open()` calls from `'_blank'` to `'_self'` to open tools in the same tab.

## Tools Updated (18 total):
✅ Store Text
✅ Image Compressor  
✅ Image Enhancer
✅ Image Resizer
✅ Image Format Converter
✅ ID Photo Maker
✅ Photo to PDF
✅ Document Scanner
✅ PDF Merger
✅ Digital Signature
✅ Watermark Remover
✅ QR Generator
✅ QR Scanner
✅ Image Cropper
✅ Image Merger
✅ Image Resolution Changer
✅ Image Background Remover
✅ Image Collage Maker

## Links Still Opening in New Tab (Correctly):
- WhatsApp contact button (external link)
- How-to-use help page (documentation)

## Result:
All tool links now open in the same tab as requested, while external links and help pages correctly continue to open in new tabs.

## Files Modified:
- `c:\Users\janak\OneDrive\Documents\stt\index.html`

## Verification:
All `window.open()` calls for tools now use `'_self'` parameter instead of `'_blank'`.
