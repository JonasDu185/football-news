import sharp from 'sharp'

const SIZES = [192, 512]
const BG = '#0B1121'   // 墨蓝
const ACCENT = '#E6482E' // 哨红
const WHITE = '#E8EDF5'

for (const size of SIZES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BG}"/>
    <!-- 足球五边形 -->
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.32}" fill="none" stroke="${WHITE}" stroke-width="${size * 0.04}"/>
    <polygon points="${size * 0.5},${size * 0.28} ${size * 0.67},${size * 0.38} ${size * 0.64},${size * 0.56} ${size * 0.5},${size * 0.64} ${size * 0.36},${size * 0.56} ${size * 0.33},${size * 0.38}" fill="none" stroke="${WHITE}" stroke-width="${size * 0.025}"/>
    <!-- 哨红小圆 -->
    <circle cx="${size * 0.5}" cy="${size * 0.47}" r="${size * 0.07}" fill="${ACCENT}"/>
  </svg>`

  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icon-${size}.png`)

  console.log(`✅ icon-${size}.png`)
}

console.log('done')
