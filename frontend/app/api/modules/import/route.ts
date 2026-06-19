import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import zlib from 'zlib';


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

    if (isTopicHeading || startsWithTopic) {
      flushTextBuffer();
      currentTopic = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: text || `Topic ${topics.length + 1}`,
        subtopics: [],
        materials: []
      };
      topics.push(currentTopic);
      currentSubtopic = null;
    } else if (isSubtopicHeading || startsWithSubtopic) {
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
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
  } catch (err) {
    console.error('Failed to resolve YouTube URL for query:', query, err);
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
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
  const path = require('path');
  const fs = require('fs');
  const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
  const workerCode = fs.readFileSync(workerPath, 'utf8');
  pdfjs.GlobalWorkerOptions.workerSrc = `data:text/javascript;base64,${Buffer.from(workerCode).toString('base64')}`;
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

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    
    // 1. Extract text items and group into lines
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      fontSize: Math.abs(item.transform[3])
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
    for (const [y, lineItems] of linesMap.entries()) {
      lineItems.sort((a, b) => a.x - b.x);
      const text = lineItems.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
      const maxFontSize = Math.max(...lineItems.map(item => item.fontSize));
      if (text.length > 0) {
        pageLines.push({
          type: 'text',
          text,
          y,
          fontSize: maxFontSize,
          pageNum
        });
        allFontSizes.push(maxFontSize);
      }
    }

    // 2. Extract images with coordinates
    const opList = await page.getOperatorList();
    const pageImages: ExtractedImage[] = [];
    
    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack: number[][] = [];

    for (let j = 0; j < opList.fnArray.length; j++) {
      const fn = opList.fnArray[j];
      const args = opList.argsArray[j];
      
      if (fn === pdfjs.OPS.save) {
        transformStack.push([...currentTransform]);
      } else if (fn === pdfjs.OPS.restore) {
        if (transformStack.length > 0) {
          currentTransform = transformStack.pop()!;
        }
      } else if (fn === pdfjs.OPS.transform) {
        const [a1, b1, c1, d1, e1, f1] = args;
        const [a2, b2, c2, d2, e2, f2] = currentTransform;
        currentTransform = [
          a2 * a1 + c2 * b1,
          b2 * a1 + d2 * b1,
          a2 * c1 + c2 * d1,
          b2 * c1 + d2 * d1,
          a2 * e1 + c2 * f1 + e2,
          b2 * e1 + d2 * f1 + f2
        ];
      } else if (fn === pdfjs.OPS.paintImageXObject) {
        const objId = args[0];
        const x = currentTransform[4];
        const y = currentTransform[5];
        
        try {
          const imgObj = await new Promise<any>((resolve) => {
            page.objs.get(objId, (obj: any) => {
              if (obj) resolve(obj);
              else {
                page.commonObjs.get(objId, (cObj: any) => {
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

    const pageElements: ExtractedElement[] = [...pageLines, ...pageImages];
    // Sort elements by Y coordinate descending (top to bottom of page)
    pageElements.sort((a, b) => b.y - a.y);
    allElements.push(...pageElements);
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

  const classifiedElements = allElements.map((el) => {
    if (el.type === 'image') {
      return {
        ...el,
        isTopic: false,
        isSubtopic: false
      };
    }
    
    const lineText = el.text;
    const isTopic = (
      // Literal topic match
      (/^Topic\s*\d*/i.test(lineText) && lineText.length < 80) ||
      // Strictly match only the largest font size (Heading 1) in the document!
      (
        maxShortLineFontSize > bodyFontSize + 2.5 &&
        el.fontSize >= maxShortLineFontSize - 0.5 &&
        lineText.length < 80 &&
        /[a-zA-Z]/.test(lineText) &&
        !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(lineText)
      )
    );

    return {
      ...el,
      isTopic,
      isSubtopic: false
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
            if (mergedElements[j].isTopic) {
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

  const topics: Topic[] = [];
  let currentTopic: Topic | null = null;
  let textBuffer: string[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;
    const textContent = textBuffer.join('\n\n').trim();
    textBuffer = [];
    if (!textContent) return;
    
    const material: Material = {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      type: 'text',
      title: 'Lecture Reading',
      content: textContent,
      textStyle: 'normal'
    };
    addMaterialToCurrent(material);
  };

  const addMaterialToCurrent = (material: Material) => {
    if (!currentTopic) {
      currentTopic = {
        id: Date.now() + Math.floor(Math.random() * 1000000),
        title: 'Introduction',
        subtopics: [],
        materials: []
      };
      topics.push(currentTopic);
    }
    currentTopic.materials.push(material);
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
      if (el.isTopic) {
        flushTextBuffer();
        currentTopic = {
          id: Date.now() + Math.floor(Math.random() * 1000000),
          title: lineText,
          subtopics: [],
          materials: []
        };
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
        textBuffer.push(lineText);
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
