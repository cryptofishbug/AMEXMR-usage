/**
 * public/logos PNG 배경 제거 + 작은 로고 최소 크기 보정
 * 사용: node scripts/process-logos.mjs
 * (첫 실행 시 ONNX 모델 다운로드 ~40MB 소요)
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGOS_DIR = path.join(__dirname, "..", "public", "logos")
const MIN_SIZE = 192 // 한 변 최소 픽셀 (이보다 작으면 업스케일 또는 패딩)

async function blobToBuffer(blob) {
  const ab = await blob.arrayBuffer()
  return Buffer.from(ab)
}

async function ensureMinSize(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  if (w >= MIN_SIZE && h >= MIN_SIZE) {
    return inputBuffer
  }
  const scale = Math.max(MIN_SIZE / w, MIN_SIZE / h, 1)
  const newW = Math.round(w * scale)
  const newH = Math.round(h * scale)
  return sharp(inputBuffer)
    .resize(newW, newH, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function main() {
  const { removeBackground } = await import("@imgly/background-removal-node")

  const files = fs.readdirSync(LOGOS_DIR).filter((f) => f.endsWith(".png") && f !== "README.md")
  console.log(`처리할 파일 ${files.length}개 (배경 제거 + 최소 ${MIN_SIZE}px 보정)\n`)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const srcPath = path.join(LOGOS_DIR, file)
    const name = path.basename(file, ".png")
    process.stdout.write(`[${i + 1}/${files.length}] ${file} ... `)

    try {
      const fileUrl = "file:///" + path.resolve(srcPath).replace(/\\/g, "/")
      const blob = await removeBackground(fileUrl, { model: "small" })
      const buf = await blobToBuffer(blob)
      const sized = await ensureMinSize(buf)
      await sharp(sized).png().toFile(srcPath)
      console.log("OK")
    } catch (err) {
      console.log("FAIL:", err.message)
    }
  }

  console.log("\n완료.")
}

main()
