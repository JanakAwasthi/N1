(function(){
  'use strict';

  // DOM refs
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const el = {
    drop: $('#dropArea'),
    input: $('#fileInput'),
    list: $('#list'),
    count: $('#count'),
    quality: $('#quality'),
    qualityVal: $('#qualityVal'),
    format: $('#format'),
    maxW: $('#maxWidth'),
    maxH: $('#maxHeight'),
    compressAll: $('#compressAll'),
    downloadZip: $('#downloadZip'),
    progressWrap: $('#progressWrap'),
    progressText: $('#progressText'),
    progressPct: $('#progressPct'),
    progressBar: $('#progressBar'),
  };

  // State
  const items = []; // {id, file, name, type, size, url, w, h, compressedBlob, compressedUrl, cw, ch}
  let idCounter = 0;

  // Init
  attachEvents();
  updateCount();

  function attachEvents(){
    // Drag & drop
    ['dragenter','dragover'].forEach(evt => el.drop.addEventListener(evt, (e)=>{ e.preventDefault(); el.drop.classList.add('drag-active'); }));
    ['dragleave','drop'].forEach(evt => el.drop.addEventListener(evt, (e)=>{ e.preventDefault(); el.drop.classList.remove('drag-active'); }));
    el.drop.addEventListener('drop', (e)=>{
      const files = Array.from(e.dataTransfer?.files || []).filter(isImageFile);
      if(!files.length){ showToast?.('No images detected in drop.', 'warning'); return; }
      addFiles(files);
    });

    // Click to browse
    el.drop.addEventListener('click', ()=> el.input.click());
    el.input.addEventListener('change', ()=>{
      const files = Array.from(el.input.files || []).filter(isImageFile);
      addFiles(files);
      el.input.value = '';
    });

    // Controls
    el.quality.addEventListener('input', ()=> el.qualityVal.textContent = Number(el.quality.value).toFixed(2));
    el.compressAll.addEventListener('click', compressAll);
    el.downloadZip.addEventListener('click', downloadAsZip);
  }

  function isImageFile(f){
    return f && f.type.startsWith('image/');
  }

  function addFiles(files){
    const newOnes = [];
    for(const f of files){
      const exists = items.some(it => it.name === f.name && it.size === f.size);
      if(exists) continue; // dedupe by name+size
      const url = URL.createObjectURL(f);
      const it = { id: ++idCounter, file: f, name: f.name, type: f.type, size: f.size, url, w: 0, h: 0, compressedBlob: null, compressedUrl: null, cw: 0, ch: 0 };
      items.push(it);
      newOnes.push(it);
    }
    if(newOnes.length){
      renderList();
      updateCount();
      showToast?.(`Added ${newOnes.length} image(s).`, 'success');
      // Preload dims async
      newOnes.forEach(readDims);
    }
  }

  async function readDims(it){
    try {
      const bmp = await createImageBitmap(it.file).catch(()=>null);
      if(bmp){ it.w = bmp.width; it.h = bmp.height; bmp.close?.(); updateItemCard(it.id); return; }
      // Fallback via HTMLImageElement
      const img = await loadImage(it.url);
      it.w = img.naturalWidth; it.h = img.naturalHeight;
      updateItemCard(it.id);
    } catch(e){ /* ignore */ }
  }

  function loadImage(url){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=> resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function renderList(){
    el.list.innerHTML = items.map(it => itemCard(it)).join('');
    // Wire buttons
    items.forEach(it => {
      const root = document.getElementById(`item-${it.id}`);
      root?.querySelector('.btn-remove')?.addEventListener('click', ()=> removeItem(it.id));
      root?.querySelector('.btn-compress')?.addEventListener('click', ()=> compressOne(it.id));
      root?.querySelector('.btn-download')?.addEventListener('click', ()=> downloadOne(it.id));
    });
    refreshZipButton();
  }

  function itemCard(it){
    const origKB = formatBytes(it.size);
    const compKB = it.compressedBlob ? formatBytes(it.compressedBlob.size) : null;
    const saved = (it.compressedBlob && it.compressedBlob.size < it.size)
      ? `−${((1 - it.compressedBlob.size/it.size)*100).toFixed(1)}%`
      : '';
    return `
      <div id="item-${it.id}" class="thumb p-3 flex gap-3 items-center">
        <img src="${it.compressedUrl || it.url}" alt="${escapeHTML(it.name)}" class="w-24 h-24 object-cover rounded" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-contrast font-semibold truncate" title="${escapeHTML(it.name)}">${escapeHTML(it.name)}</span>
            ${it.compressedBlob ? `<span class="badge">Compressed</span>` : ''}
          </div>
          <div class="text-sm text-muted mt-1">
            <span>${it.w && it.h ? `${it.w}×${it.h}px` : '...'}</span>
            <span class="mx-2">•</span>
            <span>${origKB}</span>
            ${compKB ? `<span class="mx-2">→</span><span>${compKB}</span> <span class="mx-1">${saved}</span>` : ''}
          </div>
          <div class="mt-2 flex gap-2 flex-wrap">
            <button class="glass-button px-3 py-1.5 btn-compress"><i class="fas fa-bolt mr-1"></i>Compress</button>
            <button class="glass-button px-3 py-1.5 btn-download" ${it.compressedBlob? '' : 'disabled'}><i class="fas fa-download mr-1"></i>Download</button>
            <button class="glass-button px-3 py-1.5 btn-remove"><i class="fas fa-times mr-1"></i>Remove</button>
          </div>
        </div>
      </div>`;
  }

  function updateItemCard(id){
    const it = items.find(x=>x.id===id);
    if(!it) return;
    const root = document.getElementById(`item-${id}`);
    if(!root) return;
    const html = itemCard(it);
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    const fresh = temp.firstElementChild;
    root.replaceWith(fresh);
    // Rewire
    fresh.querySelector('.btn-remove')?.addEventListener('click', ()=> removeItem(id));
    fresh.querySelector('.btn-compress')?.addEventListener('click', ()=> compressOne(id));
    fresh.querySelector('.btn-download')?.addEventListener('click', ()=> downloadOne(id));
    refreshZipButton();
  }

  function removeItem(id){
    const idx = items.findIndex(x=>x.id===id);
    if(idx === -1) return;
    const it = items[idx];
    URL.revokeObjectURL(it.url);
    if(it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
    items.splice(idx,1);
    const card = document.getElementById(`item-${id}`);
    card?.remove();
    updateCount();
    refreshZipButton();
  }

  function updateCount(){
    el.count.textContent = String(items.length);
  }

  async function compressOne(id){
    const it = items.find(x=>x.id===id);
    if(!it){ return; }
    try {
      setProgressVisible(true, `Compressing ${it.name}...`);
      const opts = currentOptions();
      const result = await compressImage(it.file, opts);
      if(!result){ throw new Error('Compression failed'); }
      // Cleanup previous
      if(it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
      it.compressedBlob = result.blob;
      it.cw = result.width; it.ch = result.height;
      it.compressedUrl = URL.createObjectURL(result.blob);
      updateItemCard(id);
      showToast?.(`Compressed ${it.name}`, 'success');
    } catch(err){
      console.error(err);
      showToast?.(`Failed: ${it?.name || 'item'}. ${err.message||err}`, 'error');
    } finally {
      setProgressVisible(false);
    }
  }

  async function compressAll(){
    if(!items.length){ showToast?.('Add images first.', 'warning'); return; }
    const opts = currentOptions();
    let done = 0;
    setProgressVisible(true, 'Preparing...');
    for(const it of items){
      try{
        setProgressText(`Compressing ${it.name} (${++done}/${items.length})`);
        const result = await compressImage(it.file, opts);
        if(result){
          if(it.compressedUrl) URL.revokeObjectURL(it.compressedUrl);
          it.compressedBlob = result.blob;
          it.cw = result.width; it.ch = result.height;
          it.compressedUrl = URL.createObjectURL(result.blob);
          updateItemCard(it.id);
        }
      }catch(err){
        console.error(err);
      }
      setProgressPercent(Math.round(done/items.length*100));
    }
    setProgressVisible(false);
    refreshZipButton();
    showToast?.('Batch compression completed.', 'success');
  }

  function currentOptions(){
    const q = clamp(parseFloat(el.quality.value) || 0.8, 0.05, 1);
    const fmt = el.format.value;
    const maxW = toPositiveInt(el.maxW.value);
    const maxH = toPositiveInt(el.maxH.value);
    return { quality: q, format: fmt, maxW, maxH };
  }

  function toPositiveInt(v){
    const n = Math.floor(Number(v));
    return isFinite(n) && n > 0 ? n : undefined;
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function refreshZipButton(){
    const anyCompressed = items.some(it => it.compressedBlob);
    el.downloadZip.disabled = !anyCompressed;
  }

  async function downloadOne(id){
    const it = items.find(x=>x.id===id);
    if(!it || !it.compressedBlob){ showToast?.('Compress first.', 'warning'); return; }
    const name = buildOutputName(it.name, it.compressedBlob.type);
    triggerDownload(it.compressedBlob, name);
  }

  async function downloadAsZip(){
    const zip = new JSZip();
    let added = 0;
    for(const it of items){
      if(!it.compressedBlob) continue;
      const name = buildOutputName(it.name, it.compressedBlob.type);
      zip.file(name, it.compressedBlob);
      added++;
    }
    if(!added){ showToast?.('Nothing to include. Compress first.', 'warning'); return; }
    setProgressVisible(true, 'Zipping files...');
    const blob = await zip.generateAsync({ type: 'blob' });
    setProgressVisible(false);
    triggerDownload(blob, `compressed-images-${Date.now()}.zip`);
  }

  function buildOutputName(origName, mime){
    const base = origName.replace(/\.[^.]+$/,'');
    const ext = mimeToExt(mime);
    return `${base}-compressed.${ext}`;
  }

  function mimeToExt(m){
    switch(m){
      case 'image/jpeg': return 'jpg';
      case 'image/webp': return 'webp';
      case 'image/png': return 'png';
      default: return 'jpg';
    }
  }

  function triggerDownload(blob, filename){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  async function compressImage(file, opts){
    // Validate
    const inputMime = file.type || 'image/jpeg';
    const outMime = resolveOutputMime(opts.format, inputMime);
    const quality = clamp(opts.quality ?? 0.8, 0.05, 1);

    // Decode image
    let bmp = null;
    try { bmp = await createImageBitmap(file); } catch(e) { bmp = null; }

    let srcWidth, srcHeight, imgEl;
    if(bmp){ srcWidth = bmp.width; srcHeight = bmp.height; }
    else {
      const url = URL.createObjectURL(file);
      imgEl = await loadImage(url).catch(()=>null);
      URL.revokeObjectURL(url);
      if(!imgEl) throw new Error('Cannot decode image');
      srcWidth = imgEl.naturalWidth; srcHeight = imgEl.naturalHeight;
    }

    // Compute target size preserving aspect
    const { maxW, maxH } = opts;
    let tw = srcWidth, th = srcHeight;
    if(maxW || maxH){
      const ratio = srcWidth / srcHeight;
      if(maxW && maxH){
        tw = Math.min(srcWidth, maxW);
        th = Math.min(srcHeight, maxH);
        // Fit within while preserving aspect
        if(tw / th > ratio){ tw = Math.round(th * ratio); } else { th = Math.round(tw / ratio); }
      } else if(maxW){
        tw = Math.min(srcWidth, maxW);
        th = Math.round(tw / (srcWidth / srcHeight));
      } else if(maxH){
        th = Math.min(srcHeight, maxH);
        tw = Math.round(th * (srcWidth / srcHeight));
      }
    }

    // Draw to canvas
    let canvas, ctx;
    try {
      canvas = new OffscreenCanvas(tw, th);
      ctx = canvas.getContext('2d');
      if(bmp) ctx.drawImage(bmp, 0, 0, tw, th); else ctx.drawImage(imgEl, 0, 0, tw, th);
      // Sharpening optional: skip for speed
      const blob = await canvas.convertToBlob({ type: outMime, quality: outMime === 'image/png' ? undefined : quality });
      if(bmp) bmp.close?.();
      return { blob, width: tw, height: th };
    } catch(e){
      // Fallback to HTMLCanvasElement
      canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      ctx = canvas.getContext('2d');
      if(!ctx) throw e;
      if(bmp) ctx.drawImage(bmp, 0, 0, tw, th); else ctx.drawImage(imgEl, 0, 0, tw, th);
      const blob = await canvasToBlob(canvas, outMime, outMime === 'image/png' ? undefined : quality);
      if(bmp) bmp.close?.();
      return { blob, width: tw, height: th };
    }
  }

  function resolveOutputMime(format, inputMime){
    if(format && format !== 'original') return format;
    // keep original unless it's unsupported by canvas encoders
    if(['image/jpeg','image/png','image/webp'].includes(inputMime)) return inputMime;
    return 'image/jpeg';
  }

  function canvasToBlob(canvas, type, quality){
    return new Promise((resolve, reject)=>{
      if(canvas.toBlob){
        canvas.toBlob((b)=> b ? resolve(b) : reject(new Error('toBlob failed')), type, quality);
      } else {
        try{
          const dataUrl = canvas.toDataURL(type, quality);
          const b = dataURLtoBlob(dataUrl);
          resolve(b);
        }catch(e){ reject(e); }
      }
    });
  }

  function dataURLtoBlob(dataURL){
    const parts = dataURL.split(',');
    const meta = parts[0];
    const base64 = parts[1];
    const contentType = meta.match(/data:([^;]+);/)[1] || 'application/octet-stream';
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for(let i=0;i<byteString.length;i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: contentType });
  }

  function setProgressVisible(visible, text){
    el.progressWrap.classList.toggle('hidden', !visible);
    if(text) setProgressText(text);
    if(visible) setProgressPercent(0);
  }

  function setProgressText(t){ el.progressText.textContent = t; }
  function setProgressPercent(p){
    el.progressPct.textContent = `${p}%`;
    el.progressBar.style.width = `${p}%`;
  }

  function formatBytes(bytes){
    if(bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes)/Math.log(k));
    return `${(bytes/Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  function escapeHTML(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
  }
})();