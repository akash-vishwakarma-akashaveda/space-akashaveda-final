import sharp from 'sharp';
import fs from 'node:fs';

async function buildIcons() {
  const logoPath = 'public/logo.png';
  if (fs.existsSync('public/test-on-dark.png')) fs.unlinkSync('public/test-on-dark.png');
  if (fs.existsSync('public/test-on-light.png')) fs.unlinkSync('public/test-on-light.png');

  // Favicon 64x64
  await sharp(logoPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/favicon.png');

  // Apple touch icon 180x180
  await sharp(logoPath)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background: { r: 7, g: 6, b: 13, alpha: 1 } })
    .png()
    .toFile('public/apple-touch-icon.png');

  const b64 = (await sharp('public/favicon.png').toBuffer()).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${b64}"/></svg>\n`;
  fs.writeFileSync('public/favicon.svg', svg);
  console.log('Icons generated successfully');
}

buildIcons().catch(console.error);
