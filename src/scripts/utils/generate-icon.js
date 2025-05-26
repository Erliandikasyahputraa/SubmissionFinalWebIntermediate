const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [48, 96, 144, 192, 384, 512];
const inputImage = path.resolve(__dirname, '../../public/camera-icon.png');
const outputDir = path.resolve(__dirname, '../../public/icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate icons for each size
  for (const size of sizes) {
    await sharp(inputImage)
      .resize(size, size)
      .toFile(path.resolve(outputDir, `maskable-icon-x${size}.png`));
    
    // Generate non-maskable version
    await sharp(inputImage)
      .resize(size, size)
      .toFile(path.resolve(outputDir, `icon-${size}x${size}.png`));
  }

  // Generate favicon
  await sharp(inputImage)
    .resize(32, 32)
    .toFile(path.resolve(__dirname, '../../public/favicon.png'));
}

generateIcons();