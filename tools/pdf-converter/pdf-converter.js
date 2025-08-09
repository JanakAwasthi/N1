// PDF Converter Frontend Logic
// This example converts DOCX to PDF using the backend
function convertPDF() {
  const input = document.getElementById('pdf-input');
  const resultDiv = document.getElementById('pdf-result');
  resultDiv.innerHTML = '';
  if (!input.files.length) {
    resultDiv.innerHTML = '<span style="color:red">Please select a file to convert.</span>';
    return;
  }
  const file = input.files[0];
  const formData = new FormData();
  formData.append('file', file);
  resultDiv.innerHTML = 'Converting...';
  fetch('/api/pdf-convert', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      if (!response.ok) throw new Error('Conversion failed');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted.pdf';
      link.textContent = 'Download PDF';
      resultDiv.innerHTML = '';
      resultDiv.appendChild(link);
    })
    .catch(() => {
      resultDiv.innerHTML = '<span style="color:red">Conversion failed.</span>';
    });
}
