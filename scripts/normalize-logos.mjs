/**
 * public/logos 내 파일을 partner ID 기준으로 리네임 + PNG 변환
 * 사용: node scripts/normalize-logos.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGOS_DIR = path.join(__dirname, "..", "public", "logos")

// 현재 파일명 → partner ID (확장자 제외한 원본 이름 그대로)
const FILE_TO_PARTNER = {
  "air-canada-airline-logo-flag-carrier-canada-937748d02c9964b9ac64eb73647d09a6.png": "aeroplan",
  "all accor.jfif": "all",
  "brand-logo-product-design-trademark-korean-air-a1ea36e1ce09034f26f9e941c0ea8d5b.png": "koreanair",
  "cathay-pacific-airlines-jobable-travel-flight-cathay-pacific-logo-cb88bba82c4a544425d4632198af5147.png": "cathay",
  "delta-flight-museum-atlanta-delta-air-lines-airplane-airline-2e8475ba6f55b14fd7d09bb74cd55b8b.png": "delta",
  "eva air.png": "eva",
  "hainan.png": "hainan",
  "herpa-wings-528320-finnair-airbus-a350xwb-1-500-scale-diecast-model-airbus-a350-xwb-1-500-scale-model-aircraft-fly-emirates-logo-25daf5f7f555b5473d05a9645bc5c64f.png": "finnair",
  "hilton.png": "hilton",
  "ihg.png": "ihg",
  "Japan_Airlines_crane_1989.webp": "jal",
  "klm-amsterdam-airport-schiphol-airline-flag-carrier-skyteam-d7f283d22988be7adaf399b76cb6af4f.png": "flyingblue",
  "logo-singapore-airlines-computer-icons-clip-art-scalable-vector-graphics-singapore-airlines-logo-b9ffab152bd91bcb3510920f4481b87d.png": "singapore",
  "logo-thai-airasia-philippines-airasia-product-vector-airline-tickets-f8c68c15f858573ba10768aae2fe62b6.png": "airasia",
  "marriot.png": "marriott",
  "Qatar-Airways-Symbol.png": "qatar",
  "turkish-airlines-antalya-istanbul-ataturk-airport-boeing-777-logo-others-c947be6184f6ca4eaebe88ed4bb2e7a1.png": "turkish",
  "united-airlines-delta-air-lines-american-airlines-logo-airline-8c9785724610eee1700e22df2c8b0838.png": "united",
  "vietnam-airlines-airplane-jetstar-pacific-airplane-3f8b4d96a7660058a21f9779d2030b76.png": "vietnam",
  "wyndham.jfif": "wyndham",
}

async function main() {
  const sharp = (await import("sharp")).default
  const files = fs.readdirSync(LOGOS_DIR)

  for (const file of files) {
    if (file === "README.md") continue
    const partnerId = FILE_TO_PARTNER[file]
    if (!partnerId) {
      console.warn("매핑 없음, 스킵:", file)
      continue
    }

    const srcPath = path.join(LOGOS_DIR, file)
    const destPath = path.join(LOGOS_DIR, `${partnerId}.png`)

    if (path.basename(file, path.extname(file)) === partnerId && path.extname(file).toLowerCase() === ".png") {
      console.log("이미 올바른 이름:", file)
      continue
    }

    try {
      await sharp(srcPath)
        .png()
        .toFile(destPath)
      console.log(`${file} → ${partnerId}.png`)
      if (path.resolve(srcPath) !== path.resolve(destPath)) {
        fs.unlinkSync(srcPath)
      }
    } catch (err) {
      console.error(file, err.message)
    }
  }

  console.log("완료.")
}

main()
