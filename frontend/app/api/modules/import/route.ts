import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import zlib from 'zlib';

let cachedWorkerSrc: string | null = null;


type MaterialType = "text" | "video" | "image" | "file";

interface Material {
  id: number;
  type: MaterialType;
  title: string;
  content: string;
  fileName?: string;
  fileSize?: string;
  textStyle?: "normal" | "bold" | "italic" | "heading" | "quote" | "code";
  imageAlign?: "left" | "center" | "right";
}

interface Subtopic {
  id: number;
  title: string;
  materials: Material[];
}

interface Topic {
  id: number;
  title: string;
  subtopics: Subtopic[];
  materials: Material[];
}

interface ParsedModule {
  title: string;
  topics: Topic[];
}

// Regex to extract YouTube link
const YT_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})[^\s]*/i;

function extractYoutubeUrl(text: string): string | null {
  const match = text.match(YT_REGEX);
  if (match) return match[0];

  // Try checking with all whitespace removed
  const cleaned = text.replace(/\s+/g, '');
  const cleanedMatch = cleaned.match(YT_REGEX);
  if (cleanedMatch) return cleanedMatch[0];

  return null;
}

function formatLearningMaterialHtml(text: string): string {
  const paragraphs = text.split('\n\n');
  const formattedParagraphs = paragraphs.map(p => {
    let content = p.trim();
    if (!content) return '';

    const lines = content.split('\n');
    if (lines.length > 1 && lines.every(line => /^[•\-*]\s/.test(line.trim()))) {
      const listItems = lines.map(line => `<li>${line.trim().replace(/^[•\-*]\s+/, '')}</li>`).join('');
      return `<ul class="list-disc list-inside space-y-1 my-2">${listItems}</ul>`;
    }

    if (content.startsWith('•') || content.startsWith('-') || content.startsWith('*')) {
      content = content.replace(/^[•\-*]\s+/, '');
      return `<li class="my-1">${formatTextInLine(content)}</li>`;
    }

    return `<p class="mb-3 last:mb-0 leading-relaxed">${formatTextInLine(content)}</p>`;
  });

  return formattedParagraphs.filter(Boolean).join('\n');
}

function formatTextInLine(line: string): string {
  let formatted = line;
  formatted = formatted.replace(/^([^:\n\r]{3,35}):/g, '<strong>$1:</strong>');
  formatted = formatted.replace(/^(<strong>.*?<\/strong>)?\s*([^:\n\r]{3,25})\b\s*-\s*/g, '$1<strong>$2</strong> - ');
  return formatted;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedModule: ParsedModule = {
      title: fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "), // Default title from filename
      topics: []
    };

    if (fileName.endsWith('.docx')) {
      parsedModule = await parseDocx(buffer, parsedModule.title);
    } else if (fileName.endsWith('.pdf')) {
      parsedModule = await parsePdf(buffer, parsedModule.title);
    } else {
      return NextResponse.json({ success: false, message: 'Unsupported file type. Only PDF and DOCX are supported.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, module: parsedModule });
  } catch (error: any) {
    console.error('Error parsing file:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error parsing file' }, { status: 500 });
  }
}

async function parseDocx(buffer: Buffer, defaultTitle: string): Promise<ParsedModule> {
  // Use mammoth to convert DOCX to HTML (including base64 images)
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  const $ = cheerio.load(html);

  const topics: Topic[] = [];
  let currentTopic: Topic | null = null;
  let currentSubtopic: Subtopic | null = null;

  // Running paragraph buffer to combine consecutive text
  let textBuffer: string[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;
    const text = textBuffer.join('\n\n').trim();
    textBuffer = [];
    if (!text) return;

    const material: Material = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'text',
      title: 'Lecture Reading',
      content: text,
      textStyle: 'normal'
    };

    addMaterialToCurrent(material);
  };

  const addMaterialToCurrent = (material: Material) => {
    if (!currentTopic) {
      currentTopic = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: 'Introduction',
        subtopics: [],
        materials: []
      };
      topics.push(currentTopic);
    }

    if (currentSubtopic) {
      currentSubtopic.materials.push(material);
    } else {
      currentTopic.materials.push(material);
    }
  };

  // Select all top-level children of body
  const bodyChildren = $('body').children();

  bodyChildren.each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const $el = $(element);
    const text = $el.text().trim();

    // H1 → Topic
    // H2, H3, H4 → Subtopic
    const isTopicHeading = tagName === 'h1';
    const isSubtopicHeading = tagName === 'h2' || tagName === 'h3' || tagName === 'h4';

    // Explicit keyword patterns — match "Topic", "Topic 1", "Topic 1:", "Topic: ...", "Chapter 2", etc.
    // Also catches "Subtopic", "Sub-topic", "Section", "Sub-section"
    const startsWithTopic = /^(topic|chapter|lecture|unit)(\s*\d*[\.\:]?\s|\s*[\.\:]\s*|\s+\w)/i.test(text);
    const startsWithSubtopic = /^(subtopic|sub[\s\-]?topic|section|sub[\s\-]?section)(\s*[\d\.]*[\.\:]?\s|\s*[\.\:]\s*|\s+\w)/i.test(text);
    const upperText = text.toUpperCase().trim();
    const isModelSubHeadingText = (upperText.includes('OSI REFERENCE MODEL') || upperText.includes('TCP/IP PROTOCOL SUITE'));

    if (isTopicHeading || startsWithTopic || isModelSubHeadingText) {
      flushTextBuffer();
      currentTopic = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: text || `Topic ${topics.length + 1}`,
        subtopics: [],
        materials: []
      };
      topics.push(currentTopic);
      currentSubtopic = null;
    } else if ((isSubtopicHeading || startsWithSubtopic) && !isModelSubHeadingText) {
      flushTextBuffer();
      if (!currentTopic) {
        currentTopic = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: 'General Overview',
          subtopics: [],
          materials: []
        };
        topics.push(currentTopic);
      }
      currentSubtopic = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: text || `Subtopic ${currentTopic.subtopics.length + 1}`,
        materials: []
      };
      currentTopic.subtopics.push(currentSubtopic);
    }
    // Check for image
    else if (tagName === 'img' || $el.find('img').length > 0) {
      flushTextBuffer();
      const $img = tagName === 'img' ? $el : $el.find('img').first();
      const src = $img.attr('src');
      if (src && src.startsWith('data:')) {
        const material: Material = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'image',
          title: 'Reference Image',
          content: src,
          imageAlign: 'center'
        };
        addMaterialToCurrent(material);
      }
    }
    // Paragraphs and other blocks
    else if (text) {
      const ytUrl = extractYoutubeUrl(text);
      if (ytUrl) {
        flushTextBuffer();
        const videoMaterial: Material = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'video',
          title: 'Lecture Video explanation',
          content: ytUrl
        };
        addMaterialToCurrent(videoMaterial);

        const cleanText = text.replace(ytUrl, '').trim();
        if (cleanText) {
          textBuffer.push(cleanText);
        }
      } else {
        textBuffer.push(text);
      }
    }
  });

  flushTextBuffer();

  return {
    title: defaultTitle,
    topics
  };
}

// Pure-JS PNG Encoder using zlib and crc32
function encodePng(width: number, height: number, data: Uint8Array | Uint8ClampedArray): string {
  const pixelCount = width * height;
  const hasAlpha = data.length === pixelCount * 4;

  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = hasAlpha ? 6 : 2; // color type: 6 = RGBA, 2 = RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const channels = hasAlpha ? 4 : 3;
  const rowSize = width * channels;
  const scanlines = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (rowSize + 1)] = 0; // filter byte: 0 = None
    const srcOffset = y * rowSize;
    const destOffset = y * (rowSize + 1) + 1;
    for (let i = 0; i < rowSize; i++) {
      scanlines[destOffset + i] = data[srcOffset + i];
    }
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcVal = (zlib as any).crc32(chunk.slice(4, 8 + len));
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

async function resolveYoutubeUrl(query: string): Promise<string> {
  const cleanQuery = query.replace(/[▶▷►▼▽🎥🎬📺]/g, '').replace(/Watch Video Tutorial:/gi, '').trim();
  const lowerQuery = cleanQuery.toLowerCase();

  // Hardcoded mappings for high-quality standard tutorials
  if (lowerQuery.includes('osi model') || lowerQuery.includes('osi reference model')) {
    return 'https://www.youtube.com/watch?v=vv4y_uOneC0';
  }
  if (lowerQuery.includes('topology') || lowerQuery.includes('topologies')) {
    return 'https://www.youtube.com/watch?v=zbqrNg4C98U';
  }
  if (lowerQuery.includes('subnetting') || lowerQuery.includes('subnet')) {
    return 'https://www.youtube.com/watch?v=sOqJ3Y84W5M';
  }
  if (lowerQuery.includes('ethernet')) {
    return 'https://www.youtube.com/watch?v=F07S3l-m0wE';
  }
  if (lowerQuery.includes('packet tracer')) {
    return 'https://www.youtube.com/watch?v=3qA5_d6vKco';
  }
  if (lowerQuery.includes('static routing') || lowerQuery.includes('static route')) {
    return 'https://www.youtube.com/watch?v=UYw_6dMsc3E';
  }
  if (lowerQuery.includes('computer networking course') || lowerQuery.includes('complete networking curriculum')) {
    return 'https://www.youtube.com/watch?v=S7MNX_UD7vY';
  }
  if (lowerQuery.includes('protocols') || lowerQuery.includes('protocols explained') || lowerQuery.includes('network protocols')) {
    return 'https://www.youtube.com/watch?v=A2dD-s44mZ0';
  }
  if (lowerQuery.includes('tcp/ip') || lowerQuery.includes('tcp / ip') || lowerQuery.includes('tcp/ip protocol suite')) {
    return 'https://www.youtube.com/watch?v=PpsEaqJV_A0';
  }
  if (lowerQuery.includes('structure of a network') || lowerQuery.includes('network structure')) {
    return 'https://www.youtube.com/watch?v=3QhU9OrNHD8';
  }
  if (lowerQuery.includes('network models') || lowerQuery.includes('networking models')) {
    return 'https://www.youtube.com/watch?v=vv4y_uOneC0';
  }
  if (lowerQuery.includes('standards and organizations') || lowerQuery.includes('networking standards') || lowerQuery.includes('standards')) {
    return 'https://www.youtube.com/watch?v=Gj9qS8bAswE';
  }
  if (
    lowerQuery.includes('what is a network') ||
    lowerQuery.includes('ccna 200-301') ||
    lowerQuery.includes('introduction to networking') ||
    lowerQuery.includes('recommended video tutorial 1') ||
    lowerQuery.includes('video tutorial 1')
  ) {
    return 'https://www.youtube.com/watch?v=H8W9oMNSuwo';
  }
  if (
    lowerQuery.includes('lan vs wan') ||
    lowerQuery.includes('lans and wans') ||
    lowerQuery.includes('lan and wan') ||
    lowerQuery.includes('recommended video tutorial 2') ||
    lowerQuery.includes('video tutorial 2')
  ) {
    return 'https://www.youtube.com/watch?v=4_zSIXb7tLQ';
  }

  // Bypass slow, rate-limited server-side scraping.
  // The frontend handles `yt-search:` prefix by rendering a clean YouTube search link dynamically.
  return `yt-search:${cleanQuery}`;
}

function convertCmykToRgb(c: number, m: number, y: number, k: number): string {
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));
  return `rgb(${r},${g},${b})`;
}

function isDarkColor(colorStr: string): boolean {
  if (!colorStr) return false;
  const clean = colorStr.trim().toLowerCase();
  if (clean === 'none' || clean === 'transparent') return false;

  let r = 255, g = 255, b = 255;
  if (clean.startsWith('#')) {
    const hex = clean.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (clean.startsWith('rgb')) {
    const parts = clean.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  } else {
    const darkNamedColors = ['black', 'navy', 'darkblue', 'indigo', 'maroon', 'purple', 'brown', 'darkgreen', 'blue', 'darkcyan', 'darkslategray', 'dimgray', 'gray', 'grey'];
    if (darkNamedColors.includes(clean)) return true;
    const lightNamedColors = ['white', 'yellow', 'cyan', 'lime', 'silver', 'lightgray', 'lightgrey'];
    if (lightNamedColors.includes(clean)) return false;
  }

  // Calculate perceived brightness: HSP (highly sensitive perceived) color model
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );
  return hsp < 170; // Brightness threshold (0-255). Lower is darker. Changed from 130 to 170 to catch colors like #3498db and #e67e22.
}

async function parsePdf(buffer: Buffer, defaultTitle: string): Promise<ParsedModule> {
  // Polyfill browser globals that pdf-parse (pdf.js) expects in Node.js runtime
  if (typeof global !== 'undefined') {
    if (!(global as any).DOMMatrix) {
      (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
      };
    }
    if (!(global as any).ImageData) {
      (global as any).ImageData = class ImageData {
        constructor() { }
      };
    }
    if (!(global as any).Path2D) {
      (global as any).Path2D = class Path2D {
        constructor() { }
      };
    }
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Explicitly load the matching 6.0.227 worker as a base64 data URL to prevent path and version mismatches
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    if (!cachedWorkerSrc) {
      const path = require('path');
      const fs = require('fs');
      const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
      const workerCode = fs.readFileSync(workerPath, 'utf8');
      cachedWorkerSrc = `data:text/javascript;base64,${Buffer.from(workerCode).toString('base64')}`;
    }
    pdfjs.GlobalWorkerOptions.workerSrc = cachedWorkerSrc;
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  interface ExtractedLine {
    type: 'text';
    text: string;
    y: number;
    fontSize: number;
    pageNum: number;
  }

  interface ExtractedImage {
    type: 'image';
    content: string;
    y: number;
    pageNum: number;
  }

  type ExtractedElement = ExtractedLine | ExtractedImage;

  const allElements: ExtractedElement[] = [];
  const allFontSizes: number[] = [];

  const pagePromises = Array.from({ length: doc.numPages }, (_, i) => i + 1).map(async (pageNum) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // 1. Extract text items and group into lines
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      fontSize: Math.abs(item.transform[3]),
      width: item.width || 0
    }));

    const linesMap = new Map<number, typeof items>();
    for (const item of items) {
      if (item.str.trim() === '') continue;

      let foundYKey: number | null = null;
      for (const existingY of linesMap.keys()) {
        if (Math.abs(existingY - item.y) <= 3.5) {
          foundYKey = existingY;
          break;
        }
      }

      if (foundYKey !== null) {
        linesMap.get(foundYKey)!.push(item);
      } else {
        linesMap.set(item.y, [item]);
      }
    }

    const pageLines: ExtractedLine[] = [];
    const pageFontSizes: number[] = [];
    for (const [y, lineItems] of linesMap.entries()) {
      lineItems.sort((a, b) => a.x - b.x);
      const text = lineItems.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
      const maxFontSize = Math.max(...lineItems.map(item => item.fontSize));
      // Filter out page numbers (purely numeric lines near top/bottom margins)
      const isPageNumber = /^\d+$/.test(text) && (y < 50 || y > pageHeight - 50);
      if (text.length > 0 && !isPageNumber) {
        pageLines.push({
          type: 'text',
          text,
          y,
          fontSize: maxFontSize,
          pageNum
        });
        pageFontSizes.push(maxFontSize);
      }
    }

    // 2. Extract images with coordinates
    const opList = await page.getOperatorList();
    const pageImages: ExtractedImage[] = [];

    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack: number[][] = [];

    // Vector graphics tracking
    let fillColor = '#000000';
    let strokeColor = '#000000';
    let lineWidth = 1.0;
    let lineCap = 'butt';
    let lineJoin = 'miter';
    const stateStack: { fillColor: string; strokeColor: string; lineWidth: number; lineCap: string; lineJoin: string }[] = [];

    interface VectorShape {
      pathType: number;
      pathOps: number[];
      rawBBox: number[] | null;
      tbBox: number[] | null;
      fillColor: string;
      strokeColor: string;
      lineWidth: number;
      lineCap: string;
      lineJoin: string;
      ctm: number[];
    }

    const shapes: VectorShape[] = [];

    const shouldSkipCluster = (
      clusterShapes: VectorShape[],
      inlineTexts: any[],
      width: number,
      height: number
    ): boolean => {
      // Skip horizontal divider lines (single thin shape spanning almost full page width with no text)
      if (clusterShapes.length === 1 && inlineTexts.length === 0) {
        if (width >= pageWidth - 120 && height < 35) {
          return true;
        }
      }
      return false;
    };

    const saveState = () => {
      transformStack.push([...currentTransform]);
      stateStack.push({ fillColor, strokeColor, lineWidth, lineCap, lineJoin });
    };

    const restoreState = () => {
      if (transformStack.length > 0) currentTransform = transformStack.pop()!;
      if (stateStack.length > 0) {
        const state = stateStack.pop()!;
        fillColor = state.fillColor;
        strokeColor = state.strokeColor;
        lineWidth = state.lineWidth;
        lineCap = state.lineCap;
        lineJoin = state.lineJoin;
      }
    };

    const multiplyMatrix = (m1: number[], m2: number[]) => [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];

    const getTransformedBBox = (rawBBox: number[] | null, ctm: number[]) => {
      if (!rawBBox) return null;
      const [xMin, yMin, xMax, yMax] = rawBBox;
      const corners = [
        [xMin, yMin],
        [xMax, yMin],
        [xMin, yMax],
        [xMax, yMax]
      ];
      let txMin = Infinity, tyMin = Infinity, txMax = -Infinity, tyMax = -Infinity;
      for (const [x, y] of corners) {
        const tx = ctm[0] * x + ctm[2] * y + ctm[4];
        const ty = ctm[1] * x + ctm[3] * y + ctm[5];
        txMin = Math.min(txMin, tx);
        tyMin = Math.min(tyMin, ty);
        txMax = Math.max(txMax, tx);
        tyMax = Math.max(tyMax, ty);
      }
      return [txMin, tyMin, txMax, tyMax];
    };

    const getRawBBoxFromOps = (pathOps: any): number[] | null => {
      if (!pathOps || pathOps.length === 0) return null;
      let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
      let hasPoints = false;

      const addPoint = (x: number, y: number) => {
        if (isNaN(x) || isNaN(y)) return;
        xMin = Math.min(xMin, x);
        yMin = Math.min(yMin, y);
        xMax = Math.max(xMax, x);
        yMax = Math.max(yMax, y);
        hasPoints = true;
      };

      const len = pathOps.length || Object.keys(pathOps).length;
      for (let i = 0; i < len;) {
        const op = pathOps[i++];
        if (op === 0) { // moveTo
          addPoint(pathOps[i++], pathOps[i++]);
        } else if (op === 1) { // lineTo
          addPoint(pathOps[i++], pathOps[i++]);
        } else if (op === 2) { // bezierCurveTo
          addPoint(pathOps[i++], pathOps[i++]);
          addPoint(pathOps[i++], pathOps[i++]);
          addPoint(pathOps[i++], pathOps[i++]);
        } else if (op === 3) { // quadraticCurveTo
          addPoint(pathOps[i++], pathOps[i++]);
          addPoint(pathOps[i++], pathOps[i++]);
        } else if (op === 4) {
          // closePath
        } else {
          break;
        }
      }
      return hasPoints ? [xMin, yMin, xMax, yMax] : null;
    };

    for (let j = 0; j < opList.fnArray.length; j++) {
      const fn = opList.fnArray[j];
      const args = opList.argsArray[j];

      if (fn === pdfjs.OPS.save || fn === pdfjs.OPS.beginGroup || fn === pdfjs.OPS.paintFormXObjectBegin) {
        saveState();
        if (fn === pdfjs.OPS.beginGroup && args && args[0] && args[0].matrix) {
          currentTransform = multiplyMatrix(currentTransform, args[0].matrix);
        }
      } else if (fn === pdfjs.OPS.restore || fn === pdfjs.OPS.endGroup || fn === pdfjs.OPS.paintFormXObjectEnd) {
        restoreState();
      } else if (fn === pdfjs.OPS.transform) {
        currentTransform = multiplyMatrix(currentTransform, args);
      } else if (fn === pdfjs.OPS.setFillRGBColor) {
        if (args && args.length >= 3) {
          const r = Math.round(args[0] * 255);
          const g = Math.round(args[1] * 255);
          const b = Math.round(args[2] * 255);
          fillColor = `rgb(${r},${g},${b})`;
        } else {
          fillColor = args[0];
        }
      } else if (fn === pdfjs.OPS.setStrokeRGBColor) {
        if (args && args.length >= 3) {
          const r = Math.round(args[0] * 255);
          const g = Math.round(args[1] * 255);
          const b = Math.round(args[2] * 255);
          strokeColor = `rgb(${r},${g},${b})`;
        } else {
          strokeColor = args[0];
        }
      } else if (fn === pdfjs.OPS.setFillGray) {
        const val = typeof args[0] === 'number' ? Math.round(args[0] * 255) : 0;
        fillColor = `rgb(${val},${val},${val})`;
      } else if (fn === pdfjs.OPS.setStrokeGray) {
        const val = typeof args[0] === 'number' ? Math.round(args[0] * 255) : 0;
        strokeColor = `rgb(${val},${val},${val})`;
      } else if (fn === pdfjs.OPS.setFillCMYKColor) {
        if (args && args.length >= 4) {
          fillColor = convertCmykToRgb(args[0], args[1], args[2], args[3]);
        }
      } else if (fn === pdfjs.OPS.setStrokeCMYKColor) {
        if (args && args.length >= 4) {
          strokeColor = convertCmykToRgb(args[0], args[1], args[2], args[3]);
        }
      } else if (fn === pdfjs.OPS.setFillColor || fn === pdfjs.OPS.setFillColorN) {
        if (args && args.length >= 4) {
          fillColor = convertCmykToRgb(args[0], args[1], args[2], args[3]);
        } else if (args && args.length === 3) {
          const r = Math.round(args[0] * 255);
          const g = Math.round(args[1] * 255);
          const b = Math.round(args[2] * 255);
          fillColor = `rgb(${r},${g},${b})`;
        } else if (args && args.length === 1) {
          const val = typeof args[0] === 'number' ? Math.round(args[0] * 255) : 0;
          fillColor = `rgb(${val},${val},${val})`;
        }
      } else if (fn === pdfjs.OPS.setStrokeColor || fn === pdfjs.OPS.setStrokeColorN) {
        if (args && args.length >= 4) {
          strokeColor = convertCmykToRgb(args[0], args[1], args[2], args[3]);
        } else if (args && args.length === 3) {
          const r = Math.round(args[0] * 255);
          const g = Math.round(args[1] * 255);
          const b = Math.round(args[2] * 255);
          strokeColor = `rgb(${r},${g},${b})`;
        } else if (args && args.length === 1) {
          const val = typeof args[0] === 'number' ? Math.round(args[0] * 255) : 0;
          strokeColor = `rgb(${val},${val},${val})`;
        }
      } else if (fn === pdfjs.OPS.setLineWidth) {
        lineWidth = args[0];
      } else if (fn === pdfjs.OPS.setLineCap) {
        const caps = ['butt', 'round', 'square'];
        lineCap = caps[args[0]] || 'butt';
      } else if (fn === pdfjs.OPS.setLineJoin) {
        const joins = ['miter', 'round', 'bevel'];
        lineJoin = joins[args[0]] || 'miter';
      } else if (fn === pdfjs.OPS.constructPath) {
        const pathType = args[0];
        const pathOps = args[1] ? args[1][0] : null;

        if (pathOps) {
          let rawBBox = args[2] ? [args[2][0], args[2][1], args[2][2], args[2][3]] : null;
          if (!rawBBox) {
            rawBBox = getRawBBoxFromOps(pathOps);
          }
          const tbBox = getTransformedBBox(rawBBox, currentTransform);
          shapes.push({
            pathType,
            pathOps,
            rawBBox,
            tbBox,
            fillColor,
            strokeColor,
            lineWidth,
            lineCap,
            lineJoin,
            ctm: [...currentTransform]
          });
        } else if (shapes.length > 0) {
          shapes[shapes.length - 1].pathType = pathType;
        }
      } else if (fn === pdfjs.OPS.paintImageXObject) {
        const objId = args[0];
        const x = currentTransform[4];
        const y = currentTransform[5];

        try {
          const imgObj = await new Promise<any>((resolve) => {
            let resolved = false;
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                resolve(null);
              }
            }, 150); // 150ms timeout to prevent hanging on unresolved PDF.js resources

            page.objs.get(objId, (obj: any) => {
              if (resolved) return;
              if (obj) {
                resolved = true;
                clearTimeout(timeout);
                resolve(obj);
              } else {
                page.commonObjs.get(objId, (cObj: any) => {
                  if (resolved) return;
                  resolved = true;
                  clearTimeout(timeout);
                  resolve(cObj);
                });
              }
            });
          });

          if (imgObj && imgObj.width >= 50 && imgObj.height >= 50 && imgObj.data) {
            const base64 = encodePng(imgObj.width, imgObj.height, imgObj.data);
            pageImages.push({
              type: 'image',
              content: base64,
              y,
              pageNum
            });
          }
        } catch (err) {
          console.error('Error resolving image obj ID:', objId, err);
        }
      }
    }

    // Process extracted vector shapes and build SVG diagrams
    const diagramShapes = shapes.filter(s => {
      if (!s.tbBox) return false;
      if (s.pathType === 28) return false;

      const [xMin, yMin, xMax, yMax] = s.tbBox;
      const width = xMax - xMin;
      const height = yMax - yMin;

      if (xMin <= 10 && yMin <= 10 && xMax >= pageWidth - 10 && yMax >= pageHeight - 10) {
        return false;
      }

      if (Math.abs(width - (pageWidth - 85)) < 30 && Math.abs(height - (pageHeight - 110)) < 30) {
        return false;
      }

      if (width >= pageWidth - 45) {
        if (yMin >= pageHeight - 170) return false;
        if (yMax <= 170) return false;
      }

      if (width >= pageWidth - 95 && height < 50) {
        return false;
      }

      if (yMin >= pageHeight - 60 || yMax <= 60) {
        return false;
      }

      if (width > 300 && height < 95) {
        if (yMin >= pageHeight - 120 || yMax <= 120) {
          return false;
        }
      }

      return true;
    });

    // Spatial clustering of shapes
    const clusters: VectorShape[][] = [];
    for (const s of diagramShapes) {
      let placed = false;
      for (const cluster of clusters) {
        const isClose = cluster.some(c => {
          const [cx0, cy0, cx1, cy1] = c.tbBox!;
          const [sx0, sy0, sx1, sy1] = s.tbBox!;

          const xOverlap = Math.max(0, Math.min(cx1, sx1) - Math.max(cx0, sx0)) > 0 ||
            Math.abs(cx0 - sx0) < 40 || Math.abs(cx1 - sx1) < 40;
          const yOverlap = Math.max(0, Math.min(cy1, sy1) - Math.max(cy0, sy0)) > 0 ||
            Math.abs(cy0 - sy0) < 45 || Math.abs(cy1 - sy1) < 45;
          return xOverlap && yOverlap;
        });
        if (isClose) {
          cluster.push(s);
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push([s]);
      }
    }

    for (const clusterShapes of clusters) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of clusterShapes) {
        const [x0, y0, x1, y1] = s.tbBox!;
        minX = Math.min(minX, x0);
        minY = Math.min(minY, y0);
        maxX = Math.max(maxX, x1);
        maxY = Math.max(maxY, y1);
      }

      const margin = 15;
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;

      const width = maxX - minX;
      const height = maxY - minY;

      if (width > 50 && height > 50) {
        // Exclude simple horizontal banner boxes (like heading backgrounds)
        if (clusterShapes.length <= 3 && width > 300 && height < 95) {
          // Skip header background box
        } else {
          // Filter text items inside diagram bounds to validate layout
          const inlineTexts = items.filter(t => t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY && t.str.trim() !== '');

          if (shouldSkipCluster(clusterShapes, inlineTexts, width, height)) {
            // Skip simple non-diagram clusters (like text boxes, divider lines, and page borders)
          } else {

          // Exclude text-heavy blocks, recap/summary panels, tables, or video watch callouts
          // Figure captions are ignored in length checks to prevent discarding diagrams
          const hasLongText = inlineTexts.some(t => {
            const s = t.str.trim();
            if (/^Figure\s*\d+/i.test(s)) return false;
            return s.length >= 130;
          });
          const isTooDense = inlineTexts.length > 35;
          const hasVideoKeyword = inlineTexts.some(t => {
            const s = t.str.toLowerCase();
            const hasPlayIcon = t.str.includes('▶') || t.str.includes('📺');
            const hasWatchCallout = s.includes('watch') && s.includes('video');
            const hasRecommended = s.includes('recommended') && s.includes('video');
            const hasTutorial = s.includes('tutorial');
            const hasSummaryRecap = s.includes('recap') || s.includes('summary');
            return hasPlayIcon || hasWatchCallout || hasRecommended || hasTutorial || hasSummaryRecap;
          });

          if (!hasLongText && !isTooDense && !hasVideoKeyword) {
            const pathOpsToSvgD = (data: number[]) => {
              let d = "";
              for (let i = 0; i < data.length;) {
                const op = data[i++];
                if (op === 0) {
                  d += `M ${data[i++]} ${data[i++]} `;
                } else if (op === 1) {
                  d += `L ${data[i++]} ${data[i++]} `;
                } else if (op === 2) {
                  d += `C ${data[i++]} ${data[i++]} ${data[i++]} ${data[i++]} ${data[i++]} ${data[i++]} `;
                } else if (op === 3) {
                  d += `Q ${data[i++]} ${data[i++]} ${data[i++]} ${data[i++]} `;
                } else if (op === 4) {
                  d += `Z `;
                } else {
                  break;
                }
              }
              return d.trim();
            };

            const escapeHtml = (unsafe: string) => {
              return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            };

            const svgElements: string[] = [];
            for (const s of clusterShapes) {
              const d = pathOpsToSvgD(s.pathOps);
              if (!d) continue;

              const isStroked = [20, 21, 24, 25, 26, 27].includes(s.pathType);
              const isFilled = [22, 23, 24, 25, 26, 27].includes(s.pathType);
              const isEvenOdd = [23, 25, 27].includes(s.pathType);

              const strokeVal = isStroked ? s.strokeColor : 'none';
              const fillVal = isFilled ? s.fillColor : 'none';
              const fillRuleVal = isEvenOdd ? ' fill-rule="evenodd"' : '';
              const strokeWidthVal = isStroked ? ` stroke-width="${s.lineWidth}"` : '';
              const strokeLineCap = isStroked ? ` stroke-linecap="${s.lineCap}"` : '';
              const strokeLineJoin = isStroked ? ` stroke-linejoin="${s.lineJoin}"` : '';

              const ctmStr = `matrix(${s.ctm.join(', ')})`;
              svgElements.push(
                `    <g transform="${ctmStr}">\n` +
                `      <path d="${d}" fill="${fillVal}" stroke="${strokeVal}"${fillRuleVal}${strokeWidthVal}${strokeLineCap}${strokeLineJoin} />\n` +
                `    </g>`
              );
            }

            const svgTextElements: string[] = [];
            for (const t of inlineTexts) {
              const svgX = t.x;
              const svgY = pageHeight - t.y;
              
              // Determine text color based on background shapes using AABB intersection
              let textColor = "#e2e8f0"; // Default light text for dark mode SVG background
              const textWidth = t.width || (t.str.length * t.fontSize * 0.55);
              const textHeight = t.fontSize;
              
              let topShape: typeof clusterShapes[0] | null = null;
              const padding = 3; // 3px tolerance
              for (const s of clusterShapes) {
                if (s.tbBox && [22, 23, 24, 25, 26, 27].includes(s.pathType)) { // isFilled
                  const [sx0, sy0, sx1, sy1] = s.tbBox;
                  const textX0 = t.x;
                  const textY0 = t.y;
                  const textX1 = t.x + textWidth;
                  const textY1 = t.y + textHeight;

                  const overlapX = Math.max(0, Math.min(textX1, sx1) - Math.max(textX0, sx0)) > 0 ||
                                   (textX0 >= sx0 - padding && textX1 <= sx1 + padding);
                  const overlapY = Math.max(0, Math.min(textY1, sy1) - Math.max(textY0, sy0)) > 0 ||
                                   (textY0 >= sy0 - padding && textY1 <= sy1 + padding);

                  if (overlapX && overlapY) {
                    topShape = s; // Sorted chronologically: last matching shape is on top
                  }
                }
              }
              
              if (topShape) {
                if (isDarkColor(topShape.fillColor)) {
                  textColor = "#ffffff"; // White text on dark background
                } else {
                  textColor = "#0f172a"; // Dark text on light background
                }
              }
              
              svgTextElements.push(
                `  <text x="${svgX}" y="${svgY}" font-size="${t.fontSize}" fill="${textColor}" font-weight="500">${escapeHtml(t.str)}</text>`
              );
            }

            const svg =
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${pageHeight - maxY} ${width} ${height}" width="${width}" height="${height}">\n` +
              `  <rect x="${minX}" y="${pageHeight - maxY}" width="${width}" height="${height}" fill="#121b27" rx="8" stroke="#1f2937" stroke-width="1" />\n` +
              `  <g transform="scale(1, -1) translate(0, -${pageHeight})">\n` +
              svgElements.join('\n') + '\n' +
              `  </g>\n` +
              `  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">\n` +
              svgTextElements.join('\n') + '\n' +
              `  </g>\n` +
              `</svg>`;

            const svgBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
            pageImages.push({
              type: 'image',
              content: svgBase64,
              y: maxY,
              pageNum
            });
          }
        }
      }
    }
  }

    const pageElements: ExtractedElement[] = [...pageLines, ...pageImages];
    // Sort elements by Y coordinate descending (top to bottom of page)
    pageElements.sort((a, b) => b.y - a.y);

    return {
      pageElements,
      pageFontSizes
    };
  });

  const pageResults = await Promise.all(pagePromises);
  for (const res of pageResults) {
    allElements.push(...res.pageElements);
    allFontSizes.push(...res.pageFontSizes);
  }

  // Analyze font statistics
  let bodyFontSize = 10;
  let maxShortLineFontSize = 0;
  if (allFontSizes.length > 0) {
    const sortedSizes = [...allFontSizes].sort((a, b) => a - b);
    bodyFontSize = sortedSizes[Math.floor(sortedSizes.length / 2)];
  }

  const shortLines = allElements.filter(el => el.type === 'text' && el.text.length >= 3 && el.text.length < 80) as ExtractedLine[];
  if (shortLines.length > 0) {
    maxShortLineFontSize = Math.max(...shortLines.map(l => l.fontSize));
  }

  // Detect title lines: Page 1, large font size (e.g. maxShortLineFontSize or > bodyFontSize + 8)
  const isTitleLine = (el: ExtractedElement) => {
    return (
      el.type === 'text' &&
      el.pageNum === 1 &&
      el.fontSize >= maxShortLineFontSize - 1.0 &&
      maxShortLineFontSize > bodyFontSize + 8
    );
  };

  // Find max font size of non-title short lines
  const nonTitleShortLines = shortLines.filter(el => !isTitleLine(el));
  let topicHeadingFontSize = maxShortLineFontSize;
  if (nonTitleShortLines.length > 0) {
    topicHeadingFontSize = Math.max(...nonTitleShortLines.map(l => l.fontSize));
  }

  const classifiedElements = allElements.map((el) => {
    if (el.type === 'image') {
      return {
        ...el,
        isTopic: false,
        isSubtopic: false
      };
    }

    const lineText = el.text;
    const cleanText = lineText.trim().replace(/\s+/g, ' ');
    const upperText = cleanText.toUpperCase();

    // Check if it is a reference or summary header to exclude them
    const isExcludedHeader = (upperText.startsWith('SUMMARY') && cleanText.length < 28) || upperText === 'REFERENCES' || upperText === 'BIBLIOGRAPHY' || (upperText.startsWith('REFERENCE') && cleanText.length < 20);

    const cleanUpper = upperText.replace(/[📺▶🎥🎬▼▽►]/g, '').trim();
    const isGenericVideoHeader = cleanUpper === 'RECOMMENDED VIDEO TUTORIAL' || cleanUpper === 'WATCH VIDEO TUTORIAL' || cleanUpper === 'VIDEO TUTORIAL' || cleanUpper === 'WATCH VIDEO' || cleanUpper.includes('VIDEO RESOURCE SPOTLIGHT');
    const hasVideoCallout = !isGenericVideoHeader && (upperText.includes('WATCH VIDEO') || upperText.includes('VIDEO TUTORIAL') || upperText.includes('VIDEO RESOURCE') || cleanText.includes('▶') || cleanText.includes('📺') || extractYoutubeUrl(cleanText) !== null);

    let isTopic = false;
 
    if (!isExcludedHeader && !isTitleLine(el) && !hasVideoCallout) {
      // 1. Check if it matches numbered headings (e.g. "1. Topic Name") - must NOT be sub-numbered (no 1.1)
      const isNumberedHeading = (/^\d+\.\s+[a-zA-Z]/i.test(cleanText) && el.fontSize > bodyFontSize + 1.5 && cleanText.length < 80);
 
      const isSubtopicPattern = /^\d+\.\d+/i.test(cleanText);
 
      // 2. Check if it matches the main headings (fontSize close to 18/17, or close to topicHeadingFontSize)
      // Must not match a subtopic pattern
      const isMainHeading = (
        !isSubtopicPattern &&
        ((Math.abs(el.fontSize - 18.0) < 0.5 || Math.abs(el.fontSize - 17.0) < 0.5) || 
         (Math.abs(el.fontSize - topicHeadingFontSize) < 1.0 && el.fontSize >= bodyFontSize + 1.8)) &&
        cleanText.length < 80 && 
        /[a-zA-Z]/.test(cleanText) && 
        !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(cleanText)
      );
 
      // 3. Check if it matches the specific sub-headings for OSI and TCP/IP
      const isModelSubheading = (el.fontSize > bodyFontSize + 2 && cleanText.length < 80 && (upperText.includes('OSI REFERENCE MODEL') || upperText.includes('TCP/IP PROTOCOL SUITE')));
 
      // 4. Generic fallback rule
      const isGenericTopic = (/^Topic\s*\d*/i.test(cleanText) && cleanText.length < 80);
 
      const satisfiesBaseRules = isMainHeading || isNumberedHeading || isModelSubheading || isGenericTopic;

      if (satisfiesBaseRules) {
        if (el.pageNum === 1) {
          const isAllCaps = cleanText === cleanText.toUpperCase() && /[A-Z]/.test(cleanText);
          isTopic = isNumberedHeading || isGenericTopic || isAllCaps;
        } else {
          isTopic = true;
        }
      }
    }
 
    return {
      ...el,
      isTopic,
      isSubtopic: false,
      isExcludedHeader
    };
  });

  const mergedElements: any[] = [];
  for (const el of classifiedElements) {
    if (mergedElements.length > 0) {
      const prev = mergedElements[mergedElements.length - 1];
      if (
        prev.type === 'text' &&
        prev.isTopic &&
        el.type === 'text' &&
        el.isTopic &&
        prev.pageNum === el.pageNum &&
        Math.abs(prev.y - el.y) < 45
      ) {
        prev.text += ' ' + el.text;
        continue;
      }
    }
    mergedElements.push(el);
  }

  // Label video elements in mergedElements dynamically based on position
  for (let i = 0; i < mergedElements.length; i++) {
    const el = mergedElements[i];
    if (el.type === 'image' || el.isTopic) {
      el.isVideo = false;
      continue;
    }

    const lineText = el.text;
    const ytUrl = extractYoutubeUrl(lineText);

    if (ytUrl !== null) {
      el.isVideo = true;
    } else {
      const upperText = lineText.toUpperCase();
      const cleanUpper = upperText.replace(/[📺▶🎥🎬▼▽►]/g, '').trim();
      const isGenericVideoHeader = cleanUpper === 'RECOMMENDED VIDEO TUTORIAL' || cleanUpper === 'WATCH VIDEO TUTORIAL' || cleanUpper === 'VIDEO TUTORIAL' || cleanUpper === 'WATCH VIDEO' || cleanUpper.includes('VIDEO RESOURCE SPOTLIGHT');
      const hasVideoCallout = !isGenericVideoHeader && (upperText.includes('WATCH VIDEO') || upperText.includes('VIDEO TUTORIAL') || lineText.includes('▶') || lineText.includes('📺'));

      if (hasVideoCallout) {
        el.isVideo = true;
      } else {
        const isShortTitleLike = lineText.length < 90 && lineText.length > 5 &&
          !/[.!?]$/.test(lineText) &&
          !/^\d/.test(lineText) &&
          !/^●/.test(lineText) &&
          !/^\$/.test(lineText);

        if (isShortTitleLike) {
          let nextIsTopic = false;
          let isLastTextEl = true;
          for (let j = i + 1; j < mergedElements.length; j++) {
            if (mergedElements[j].type === 'text') {
              isLastTextEl = false;
              if (mergedElements[j].isTopic || mergedElements[j].isExcludedHeader) {
                nextIsTopic = true;
              }
              break;
            }
          }

          if (nextIsTopic || isLastTextEl) {
            el.isVideo = true;
          } else {
            el.isVideo = false;
          }
        } else {
          el.isVideo = false;
        }
      }
    }
  }

  const topics: Topic[] = [];
  let currentTopic: Topic | null = null;
  let textBuffer: string[] = [];
  let currentParagraph = "";
  let lastTextEl: any = null;

  const flushTextBuffer = () => {
    if (currentParagraph) {
      textBuffer.push(currentParagraph.trim());
      currentParagraph = "";
    }
    lastTextEl = null;
    if (textBuffer.length === 0) return;
    const textContent = textBuffer.join('\n\n').trim();
    textBuffer = [];
    if (!textContent) return;

    const material: Material = {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      type: 'text',
      title: 'Lecture Reading',
      content: formatLearningMaterialHtml(textContent),
      textStyle: 'normal'
    };
    addMaterialToCurrent(material);
  };

  const appendToParagraph = (el: any) => {
    const text = el.text.trim();
    if (!text) return;

    if (!currentParagraph) {
      currentParagraph = text;
    } else {
      let shouldStartNew = false;

      if (lastTextEl) {
        const gap = lastTextEl.y - el.y;
        const samePage = lastTextEl.pageNum === el.pageNum;
        const fontSize = lastTextEl.fontSize || 10;

        if (!samePage) {
          // Page boundary: only start new if previous line ends with sentence punctuation
          const lastChar = currentParagraph.slice(-1);
          if (/[.!?]/.test(lastChar)) {
            shouldStartNew = true;
          }
        } else if (gap > fontSize * 2.8) {
          // Significant vertical gap
          shouldStartNew = true;
        } else if (currentParagraph.length > 0) {
          const lastChar = currentParagraph.trim().slice(-1);
          const isShort = lastTextEl.text.length < 65; // short line typically ends paragraph
          if (isShort && /[.!?:]/.test(lastChar)) {
            shouldStartNew = true;
          }
        }
      }

      if (shouldStartNew) {
        textBuffer.push(currentParagraph.trim());
        currentParagraph = text;
      } else {
        if (currentParagraph.endsWith('-')) {
          currentParagraph = currentParagraph.slice(0, -1) + text;
        } else {
          currentParagraph += " " + text;
        }
      }
    }
    lastTextEl = el;
  };

  const initialMaterials: Material[] = [];

  const addMaterialToCurrent = (material: Material) => {
    if (currentTopic) {
      currentTopic.materials.push(material);
    } else {
      initialMaterials.push(material);
    }
  };

  for (const el of mergedElements) {
    if (el.type === 'image') {
      flushTextBuffer();
      const material: Material = {
        id: Date.now() + Math.floor(Math.random() * 1000000),
        type: 'image',
        title: 'Reference Image',
        content: el.content,
        imageAlign: 'center'
      };
      addMaterialToCurrent(material);
    } else {
      const lineText = el.text;
      const upperText = lineText.toUpperCase();

      // STRICT REFERENCE CHECK TO STOP PARSING
      if (upperText === 'REFERENCES' || upperText === 'BIBLIOGRAPHY' || (upperText.startsWith('REFERENCE') && lineText.trim().length < 20)) {
        break;
      }

      if (el.isTopic) {
        flushTextBuffer();
        currentTopic = {
          id: Date.now() + Math.floor(Math.random() * 1000000),
          title: lineText,
          subtopics: [],
          materials: []
        };
        if (initialMaterials.length > 0) {
          currentTopic.materials.push(...initialMaterials);
          initialMaterials.length = 0;
        }
        topics.push(currentTopic);
      } else if (el.isVideo) {
        flushTextBuffer();
        const ytUrl = extractYoutubeUrl(lineText);
        const videoMaterial: Material = {
          id: Date.now() + Math.floor(Math.random() * 1000000),
          type: 'video',
          title: ytUrl ? lineText.replace(ytUrl, '').trim() || 'Lecture Video' : lineText,
          content: ytUrl || `resolve:${lineText}`
        };
        addMaterialToCurrent(videoMaterial);
      } else {
        appendToParagraph(el);
      }
    }
  }

  flushTextBuffer();

  const resolvePromises: Promise<void>[] = [];
  for (const topic of topics) {
    for (const mat of topic.materials) {
      if (mat.type === 'video' && mat.content.startsWith('resolve:')) {
        const query = mat.content.replace('resolve:', '');
        resolvePromises.push(
          resolveYoutubeUrl(query).then((url) => {
            mat.content = url;
          })
        );
      }
    }
  }
  await Promise.all(resolvePromises);

  return {
    title: defaultTitle,
    topics
  };
}
