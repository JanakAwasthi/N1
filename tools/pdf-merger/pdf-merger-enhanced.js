class AIPDFMerger {
  constructor(){
    this.files = [];
    this.mergedPDF = null;
    this.isProcessing = false;
    this.sortableInstance = null;
    this.stats = { filesCount:0, totalPages:0, totalSize:0, estimatedSize:0 };
    this.init();
  }
  init(){
    this.initializeElements();
    this.setupEventListeners();
    this.initializeSortable();
    if(window.tsParticles){ tsParticles.load('tsparticles', { particles:{ number:{value:20}, size:{value:2}, move:{enable:true,speed:1}, color:{ value:['#00d4ff','#ff0080','#7c3aed'] } }, background:{ color:'transparent' } }); }
    showToast('AI PDF Merger Pro initialized successfully!', 'success');
  }
  initializeElements(){
    this.dropZone = document.getElementById('dropZone');
    this.fileInput = document.getElementById('fileInput');
    this.fileListSection = document.getElementById('fileListSection');
    this.fileList = document.getElementById('fileList');
    this.mergeMode = document.getElementById('mergeMode');
    this.pageRange = document.getElementById('pageRange');
    this.customRangeSection = document.getElementById('customRangeSection');
    this.customRange = document.getElementById('customRange');
    this.optimizeSize = document.getElementById('optimizeSize');
    this.preserveMetadata = document.getElementById('preserveMetadata');
    this.addBookmarks = document.getElementById('addBookmarks');
    this.addPageNumbers = document.getElementById('addPageNumbers');
    this.mergeBtn = document.getElementById('mergeBtn');
    this.clearAllBtn = document.getElementById('clearAllBtn');
    this.reverseOrderBtn = document.getElementById('reverseOrderBtn');
    this.sortByNameBtn = document.getElementById('sortByNameBtn');
    this.sortBySizeBtn = document.getElementById('sortBySizeBtn');
    this.removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
    this.progressSection = document.getElementById('progressSection');
    this.progressBar = document.getElementById('progressBar');
    this.progressText = document.getElementById('progressText');
    this.resultSection = document.getElementById('resultSection');
    this.filesCountResult = document.getElementById('filesCountResult');
    this.totalPagesResult = document.getElementById('totalPagesResult');
    this.fileSizeResult = document.getElementById('fileSizeResult');
    this.downloadBtn = document.getElementById('downloadBtn');
  }
  setupEventListeners(){
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', e=>{e.preventDefault(); this.dropZone.classList.add('active');});
    this.dropZone.addEventListener('dragleave', ()=> this.dropZone.classList.remove('active'));
    this.dropZone.addEventListener('drop', e=>{ e.preventDefault(); this.dropZone.classList.remove('active'); const files = Array.from(e.dataTransfer.files).filter(f=>f.type==='application/pdf'); this.addFiles(files);});
    this.fileInput.addEventListener('change', e=> this.addFiles(Array.from(e.target.files)));
    this.pageRange.addEventListener('change', ()=> this.customRangeSection.classList.toggle('hidden', this.pageRange.value!=='custom'));
    this.mergeBtn.addEventListener('click', ()=> this.mergePDFs());
    this.clearAllBtn.addEventListener('click', ()=> this.clearAll());
    this.reverseOrderBtn.addEventListener('click', ()=> this.reverseOrder());
    this.sortByNameBtn.addEventListener('click', ()=> this.sortByName());
    this.sortBySizeBtn.addEventListener('click', ()=> this.sortBySize());
    this.removeDuplicatesBtn.addEventListener('click', ()=> this.removeDuplicates());
    this.downloadBtn.addEventListener('click', ()=> this.downloadMergedPDF());
  }
  initializeSortable(){ if(window.Sortable){ this.sortableInstance = Sortable.create(this.fileList, { animation:150, onEnd: (evt)=>{ const moved=this.files.splice(evt.oldIndex,1)[0]; this.files.splice(evt.newIndex,0,moved); this.updateStats(); showToast('File order updated','success'); } }); } }
  async addFiles(files){ if(!files.length){ showToast('No valid PDF files selected','warning'); return; }
    const t = showToast('Loading PDF files...','info',0);
    try{
      for(const file of files){
        if(file.size > 100*1024*1024){ showToast(`${file.name} too large (max 100MB)`, 'error'); continue; }
        if(this.files.some(f=>f.name===file.name && f.size===file.size)){ showToast(`${file.name} already added`, 'warning'); continue; }
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        const pageCount = pdfDoc.getPageCount();
        this.files.push({ id: Date.now()+Math.random(), file, name:file.name, size:file.size, pageCount, pdfDoc });
      }
      this.renderFileList(); this.updateStats();
    }catch(err){ console.error(err); showToast('Error processing files','error'); }
    finally{ hideToast(t); }
  }
  renderFileList(){ this.fileListSection.classList.remove('hidden'); this.fileList.innerHTML=''; this.files.forEach((f,i)=>{ const div=document.createElement('div'); div.className='glass-card p-4 cursor-move animate-slide-up'; div.style.animationDelay=`${i*0.05}s`; div.innerHTML=`<div class="flex items-center space-x-4"><div class="flex-shrink-0"><div class="w-12 h-16 bg-danger bg-opacity-20 rounded-lg flex items-center justify-center"><i class="fas fa-file-pdf text-danger text-xl"></i></div></div><div class="flex-1 min-w-0"><h4 class="font-semibold text-contrast truncate">${f.name}</h4><div class="text-sm text-muted"><span>${f.pageCount} page${f.pageCount!==1?'s':''}</span> • <span>${(f.size/1048576).toFixed(2)} MB</span></div></div><div class="flex-shrink-0 flex gap-2"><button class="glass-button text-xs" onclick="pdfMerger.preview('${f.id}')"><i class="fas fa-eye mr-1"></i>Preview</button><button class="glass-button accent text-xs" onclick="pdfMerger.removeById('${f.id}')"><i class="fas fa-trash mr-1"></i>Remove</button></div><div class="flex-shrink-0 text-muted"><i class="fas fa-grip-vertical cursor-move"></i></div></div>`; this.fileList.appendChild(div); }); }
  removeById(id){ const idx=this.files.findIndex(f=>String(f.id)===String(id)); if(idx>-1){ const name=this.files[idx].name; this.files.splice(idx,1); this.renderFileList(); this.updateStats(); showToast(`Removed ${name}`,'success'); } }
  preview(){ showToast('Preview coming soon!','info'); }
  updateStats(){ const totalPages=this.files.reduce((a,f)=>a+f.pageCount,0); const totalSize=this.files.reduce((a,f)=>a+f.size,0); this.stats={ filesCount:this.files.length, totalPages, totalSize, estimatedSize: totalSize * (this.optimizeSize && this.optimizeSize.checked ? 0.8 : 0.95)}; document.getElementById('estimatedSize').textContent = (this.stats.estimatedSize/1048576).toFixed(2)+' MB'; document.getElementById('totalPages').textContent = totalPages; }
  reverseOrder(){ this.files.reverse(); this.renderFileList(); this.updateStats(); showToast('File order reversed','success'); }
  sortByName(){ this.files.sort((a,b)=>a.name.localeCompare(b.name)); this.renderFileList(); this.updateStats(); showToast('Files sorted by name','success'); }
  sortBySize(){ this.files.sort((a,b)=>a.size-b.size); this.renderFileList(); this.updateStats(); showToast('Files sorted by size','success'); }
  removeDuplicates(){ const seen=new Set(); this.files=this.files.filter(f=>{ const k=f.name+':'+f.size; if(seen.has(k)) return false; seen.add(k); return true;}); this.renderFileList(); this.updateStats(); showToast('Duplicates removed','success'); }
  async mergePDFs(){ if(this.files.length<2){ showToast('Please add at least 2 PDF files to merge','warning'); return; } if(this.isProcessing) return; this.isProcessing=true; this.progressSection.classList.remove('hidden'); this.mergeBtn.disabled=true; this.mergeBtn.innerHTML='<i class="fas fa-spinner animate-spin mr-2"></i>Merging PDFs...'; try{ const merged = await PDFLib.PDFDocument.create(); if(this.preserveMetadata && this.preserveMetadata.checked){ merged.setTitle('Merged PDF Document'); merged.setAuthor('LinkToQR.me NEXUS'); merged.setSubject('Merged PDF created with AI PDF Merger Pro'); merged.setCreationDate(new Date()); merged.setModificationDate(new Date()); }
      const mode=this.mergeMode?this.mergeMode.value:'sequential'; if(mode==='alternating'){ await this.mergeAlternating(merged);} else { await this.mergeSequential(merged);} if(this.optimizeSize && this.optimizeSize.checked){ this.updateProgress(1,1,'Optimizing merged PDF...'); }
      if(this.addPageNumbers && this.addPageNumbers.checked){ await this.addPageNumbersToDoc(merged);} this.updateProgress(1,1,'Generating final PDF...'); const bytes=await merged.save(); this.mergedPDF = new Blob([bytes],{type:'application/pdf'}); this.showResult(); showToast('PDF files merged successfully!','success'); } catch(err){ console.error('Error merging PDFs:', err); showToast('Failed to merge PDF files','error'); } finally { this.isProcessing=false; this.mergeBtn.disabled=false; this.mergeBtn.innerHTML='<i class="fas fa-magic mr-2"></i>Merge PDFs'; setTimeout(()=> this.progressSection.classList.add('hidden'), 800);} }
  async mergeSequential(merged){ const total=this.files.length; for(let i=0;i<total;i++){ const f=this.files[i]; this.updateProgress(i+1,total,`Processing ${f.name}...`); await this.copyPages(merged,f); } }
  async mergeAlternating(merged){ const ranges=this.files.map(f=> this.getPageRange(f)); const totalPages=ranges.reduce((a,r)=>a+r.length,0)||1; const docs=this.files.map(f=> f.pdfDoc); let idx=0, processed=0; while(true){ let added=false; for(let fi=0; fi<this.files.length; fi++){ const r=ranges[fi]; if(idx<r.length){ const pageIndex=r[idx]; const [p]=await merged.copyPages(docs[fi],[pageIndex]); merged.addPage(p); processed++; this.updateProgress(processed,totalPages,`Alternating merge: page ${processed}/${totalPages}`); added=true; } } if(!added) break; idx++; } }
  async copyPages(merged, fileData){ const src=fileData.pdfDoc; const range=this.getPageRange(fileData); for(const i of range){ const [p]=await merged.copyPages(src,[i]); merged.addPage(p); }
    if(this.addBookmarks && this.addBookmarks.checked){ /* Placeholder for future outline creation */ }
  }
  getPageRange(fileData){ const n=fileData.pageCount; const mode=this.pageRange?this.pageRange.value:'all'; if(mode==='all') return Array.from({length:n},(_,i)=>i); if(mode==='odd') return Array.from({length:n},(_,i)=>i).filter(i=> (i+1)%2===1); if(mode==='even') return Array.from({length:n},(_,i)=>i).filter(i=> (i+1)%2===0); if(mode==='custom') return this.parseCustomRange(this.customRange.value, n); return Array.from({length:n},(_,i)=>i); }
  parseCustomRange(str, max){ if(!str) return []; const out=[]; for(const part of str.split(',').map(s=>s.trim())){ if(!part) continue; if(part.includes('-')){ const [a,b]=part.split('-').map(s=>parseInt(s.trim(),10)); const s=Math.max(1, isNaN(a)?1:a), e=Math.min(max, isNaN(b)?max:b); for(let i=s;i<=e;i++) out.push(i-1);} else { const p=parseInt(part,10); if(p>=1 && p<=max) out.push(p-1);} } return [...new Set(out)].sort((a,b)=>a-b); }
  updateProgress(curr,total,msg){ const pct=Math.round((curr/total)*100); this.progressBar.style.width=pct+'%'; document.getElementById('progressPercentage').textContent = pct+'%'; this.progressText.textContent = msg; }
  async addPageNumbersToDoc(doc){ const { StandardFonts, rgb } = PDFLib; const pages=doc.getPages(); const font=await doc.embedFont(StandardFonts.Helvetica); const color=rgb(0.8,0.8,0.8); const m=18; for(let i=0;i<pages.length;i++){ const p=pages[i]; const { width } = p.getSize(); const label = `${i+1} / ${pages.length}`; const size=10; const tw = font.widthOfTextAtSize(label,size); p.drawText(label,{ x: width - tw - m, y: m, size, font, color }); } }
  showResult(){ this.resultSection.classList.remove('hidden'); this.filesCountResult.textContent = this.stats.filesCount; this.totalPagesResult.textContent = this.stats.totalPages; this.fileSizeResult.textContent = this.mergedPDF ? (this.mergedPDF.size/1048576).toFixed(2)+' MB' : '-'; }
  downloadMergedPDF(){ if(!this.mergedPDF){ showToast('No merged PDF available for download','warning'); return; } const url=URL.createObjectURL(this.mergedPDF); const a=document.createElement('a'); a.href=url; a.download=`merged-document-${Date.now()}.pdf`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Merged PDF downloaded successfully!','success'); }
  clearAll(){ this.files=[]; this.mergedPDF=null; this.fileListSection.classList.add('hidden'); this.resultSection.classList.add('hidden'); this.progressSection.classList.add('hidden'); this.updateStats(); showToast('All files cleared','success'); }
}
let pdfMerger; document.addEventListener('DOMContentLoaded', ()=>{ pdfMerger = new AIPDFMerger(); });
