const fs = require('fs');
const path = require('path');

const reportPath = '/Users/rahulr/.gemini/antigravity/brain/46a3b761-3063-4cac-834e-7926a7135abf/dbms_project_report.md';
let content = fs.readFileSync(reportPath, 'utf8');

// Basic Markdown to HTML conversion
let html = content
  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    try {
      const imageData = fs.readFileSync(src).toString('base64');
      const mimeType = src.endsWith('.png') ? 'image/png' : 'image/webp';
      return `<div style="margin:20px 0;text-align:center"><img src="data:${mimeType};base64,${imageData}" style="max-width:100%;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3)" alt="${alt}"><p style="color:#888;font-size:0.9rem;margin-top:10px">${alt}</p></div>`;
    } catch (e) {
      return `[Image missing: ${alt}]`;
    }
  })
  .replace(/```sql\n([\s\S]*?)```/g, '<pre style="background:#1e1e1e;color:#d4d4d4;padding:15px;border-radius:8px;overflow-x:auto"><code>$1</code></pre>')
  .replace(/```mermaid\n([\s\S]*?)```/g, '<div style="background:#f8f9fa;padding:20px;border-radius:8px;border:1px solid #ddd;margin:20px 0;font-family:monospace;white-space:pre">$1</div><p style="font-size:0.8rem;color:#666;text-align:center">(ER Diagram Definition)</p>')
  .replace(/\n/g, '<br>');

const finalHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cricket DBMS Project Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 40px 20px;
            background: #fff;
        }
        h1 { color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px; }
        h2 { color: #1a1a1a; margin-top: 30px; border-left: 4px solid #3b82f6; padding-left: 15px; }
        h3 { color: #444; margin-top: 25px; }
        pre { font-size: 14px; line-height: 1.4; }
        code { font-family: 'Fira Code', 'Courier New', monospace; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 0.9rem; }
    </style>
</head>
<body>
    ${html}
    <div class="footer">
        Generated for DBMS Project Submission &copy; 2026
    </div>
</body>
</html>
`;

fs.writeFileSync('/Users/rahulr/DBMSnew/Cricket_Project_Report.html', finalHtml);
console.log('Stand-alone HTML report generated at /Users/rahulr/DBMSnew/Cricket_Project_Report.html');
