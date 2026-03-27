// Converts a TTF font to Three.js typeface.json format
// Usage: node scripts/convert-font.mjs <input.ttf> <output.json>
//
// Three.js Font expects:
//   - Glyphs keyed by the character itself (e.g. "m"), NOT char code
//   - Y-coordinates going UP (positive), but OpenType getPath returns y-down
//     so we negate all y values
//   - Contour winding must be reversed from OpenType convention so that
//     Three.js ShapePath.toShapes() correctly identifies outer vs hole paths

import opentype from "opentype.js"
import fs from "fs"

const inputPath = process.argv[2]
const outputPath = process.argv[3]
const reverseWinding = !process.argv.includes("--no-reverse")

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/convert-font.mjs <input.ttf> <output.json> [--no-reverse]"
  )
  process.exit(1)
}

const font = opentype.loadSync(inputPath)
const scale = 1000 / font.unitsPerEm

const chars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ?!.,'\"0123456789"

// Split OpenType path commands into contours (groups between M..Z)
function splitContours(commands) {
  const contours = []
  let current = []
  for (const cmd of commands) {
    if (cmd.type === "M" && current.length > 0) {
      contours.push(current)
      current = []
    }
    current.push(cmd)
  }
  if (current.length > 0) contours.push(current)
  return contours
}

// Reverse a single contour's drawing direction.
// The first point stays as the M (moveTo), but subsequent drawing commands
// are traversed in reverse order with their control points swapped.
function reverseContour(cmds) {
  if (cmds.length <= 1) return cmds

  // Filter out Z (close path) commands — they have no coordinates
  const drawCmds = cmds.filter((c) => c.type !== "Z")
  if (drawCmds.length <= 1) return drawCmds

  // Collect the endpoint of each drawing command
  const points = drawCmds.map((c) => ({ x: c.x, y: c.y }))

  // The reversed contour starts at the last drawing command's endpoint
  const reversed = [
    {
      type: "M",
      x: points[points.length - 1].x,
      y: points[points.length - 1].y,
    },
  ]

  // Walk backwards from the last drawing command to the second (index 1, skipping the M at 0)
  for (let i = drawCmds.length - 1; i >= 1; i--) {
    const cmd = drawCmds[i]
    // The destination of the reversed command is the previous command's endpoint
    const dest = points[i - 1]
    switch (cmd.type) {
      case "L":
        reversed.push({ type: "L", x: dest.x, y: dest.y })
        break
      case "Q":
        // Quadratic: control point stays, destination flips
        reversed.push({
          type: "Q",
          x1: cmd.x1,
          y1: cmd.y1,
          x: dest.x,
          y: dest.y,
        })
        break
      case "C":
        // Cubic: swap control points 1<->2, destination flips
        reversed.push({
          type: "C",
          x1: cmd.x2,
          y1: cmd.y2,
          x2: cmd.x1,
          y2: cmd.y1,
          x: dest.x,
          y: dest.y,
        })
        break
      default:
        break
    }
  }

  return reversed
}

function formatCmd(cmd, s) {
  // Three.js Font parser reads quadratic as: q endX endY cpX cpY
  // and cubic as: b endX endY cp1X cp1Y cp2X cp2Y
  // (endpoint comes FIRST, then control points)
  switch (cmd.type) {
    case "M":
      return `m ${Math.round(cmd.x * s)} ${Math.round(-cmd.y * s)} `
    case "L":
      return `l ${Math.round(cmd.x * s)} ${Math.round(-cmd.y * s)} `
    case "Q":
      return `q ${Math.round(cmd.x * s)} ${Math.round(-cmd.y * s)} ${Math.round(cmd.x1 * s)} ${Math.round(-cmd.y1 * s)} `
    case "C":
      return `b ${Math.round(cmd.x * s)} ${Math.round(-cmd.y * s)} ${Math.round(cmd.x1 * s)} ${Math.round(-cmd.y1 * s)} ${Math.round(cmd.x2 * s)} ${Math.round(-cmd.y2 * s)} `
    default:
      return ""
  }
}

const glyphs = {}

for (const char of chars) {
  const glyph = font.charToGlyph(char)
  if (!glyph || glyph.index === 0) continue

  const path = glyph.getPath(0, 0, font.unitsPerEm)
  let contours = splitContours(path.commands)

  if (reverseWinding) {
    contours = contours.map(reverseContour)
  }

  const data = {
    ha: Math.round(glyph.advanceWidth * scale),
    x_min: Math.round((glyph.xMin || 0) * scale),
    x_max: Math.round((glyph.xMax || 0) * scale),
    o: "",
  }

  let outline = ""
  for (const contour of contours) {
    for (const cmd of contour) {
      outline += formatCmd(cmd, scale)
    }
  }

  data.o = outline.trim()
  glyphs[char] = data
}

const result = {
  glyphs,
  familyName: font.names.fontFamily?.en || "Unknown",
  ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale),
  underlinePosition: Math.round(
    (font.tables.post?.underlinePosition || -100) * scale
  ),
  underlineThickness: Math.round(
    (font.tables.post?.underlineThickness || 50) * scale
  ),
  boundingBox: {
    yMin: Math.round((font.tables.head?.yMin || 0) * scale),
    xMin: Math.round((font.tables.head?.xMin || 0) * scale),
    yMax: Math.round((font.tables.head?.yMax || 0) * scale),
    xMax: Math.round((font.tables.head?.xMax || 0) * scale),
  },
  resolution: 1000,
  original_font_information: {
    format: 0,
    copyright: font.names.copyright?.en || "",
    fontFamily: font.names.fontFamily?.en || "",
    fontSubfamily: font.names.fontSubfamily?.en || "",
    fullName: font.names.fullName?.en || "",
  },
  cssFontWeight: "bold",
  cssFontStyle: "normal",
}

fs.writeFileSync(outputPath, JSON.stringify(result))
console.log(`Converted ${Object.keys(glyphs).length} glyphs to ${outputPath}`)
