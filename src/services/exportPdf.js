const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../templates', templateName);
  return fs.readFileSync(templatePath, 'utf-8');
}

function injectData(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : '';
  });
}

async function generatePDF(templateName, data) {
  const template = loadTemplate(templateName);
  const html = injectData(template, data);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: false,         
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generatePDF };