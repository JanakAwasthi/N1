// Shared Enhanced Utilities
(function(){
  const toasts = new Map();
  let counter = 0;

  window.showToast = function(message, type = 'info', durationMs = 3000){
    const id = `t${Date.now()}_${counter++}`;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${iconFor(type)}"></i><span>${escapeHTML(message)}</span>`;
    document.body.appendChild(el);
    toasts.set(id, el);
    if(durationMs > 0){
      setTimeout(() => window.hideToast(id), durationMs);
    }
    return id;
  };

  window.hideToast = function(id){
    const el = toasts.get(id);
    if(el){ el.remove(); toasts.delete(id); }
  };

  function iconFor(type){
    switch(type){
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'error': return 'fa-times-circle';
      default: return 'fa-info-circle';
    }
  }

  function escapeHTML(str){
    return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }
})();