// Main backend server for all tools
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.static('tools'));

// PDF Converter endpoint (example: DOCX to PDF)
app.post('/api/pdf-convert', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const file = req.files.file;
  const uploadPath = path.join(__dirname, 'uploads', file.name);
  const outputPath = uploadPath.replace(/\.[^.]+$/, '.pdf');
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
  await file.mv(uploadPath);
  // Use libreoffice for conversion (must be installed on server)
  exec(`libreoffice --headless --convert-to pdf --outdir ${path.dirname(uploadPath)} ${uploadPath}`, (err) => {
    if (err) return res.status(500).json({ error: 'Conversion failed' });
    res.download(outputPath, () => {
      fs.unlinkSync(uploadPath);
      fs.unlinkSync(outputPath);
    });
  });
});

// TODO: Add endpoints for video trimming, file compression, format conversion

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
