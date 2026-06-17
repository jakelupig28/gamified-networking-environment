import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';


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
const YT_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})[^\s]*/i;

function extractYoutubeUrl(text: string): string | null {
  const match = text.match(YT_REGEX);
  return match ? match[0] : null;
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

async function parsePdf(buffer: Buffer, defaultTitle: string): Promise<ParsedModule> {
  // Polyfill browser globals that pdf-parse (pdf.js) expects in Node.js runtime
  if (typeof global !== 'undefined') {
    if (!(global as any).DOMMatrix) {
      (global as any).DOMMatrix = class DOMMatrix {
        constructor() {}
      };
    }
    if (!(global as any).ImageData) {
      (global as any).ImageData = class ImageData {
        constructor() {}
      };
    }
    if (!(global as any).Path2D) {
      (global as any).Path2D = class Path2D {
        constructor() {}
      };
    }
  }

  // Use pdf-parse for text extraction (reliable, no worker issues)
  const pdfParseModule = require('pdf-parse');
  let PDFParseClass = pdfParseModule.PDFParse;
  if (!PDFParseClass && pdfParseModule.default) {
    PDFParseClass = pdfParseModule.default.PDFParse || pdfParseModule.default;
  }
  
  const parser = new PDFParseClass({ data: buffer });
  const textResult = await parser.getText();
  const text = textResult.text;
  await parser.destroy();

  // Extract embedded JPEG/PNG images directly from PDF binary
  const allImages = extractImagesFromPdf(buffer);

  // Split text by lines, preserve non-empty lines
  const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  // Filter out PDF page markers like "-- 1 of 10 --", "Page 3", etc.
  const filteredLines = lines.filter((l: string) => {
    if (/^-+\s*\d+\s+(of|\/)\s+\d+\s*-+$/i.test(l)) return false;
    if (/^page\s+\d+$/i.test(l)) return false;
    return true;
  });

  const topics: Topic[] = [];
  let currentTopic: Topic | null = null;
  let currentSubtopic: Subtopic | null = null;
  let textBuffer: string[] = [];
  let imageIndex = 0;

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;
    const textContent = textBuffer.join('\n\n').trim();
    textBuffer = [];
    if (!textContent) return;
    const material: Material = {
      id: Date.now() + Math.floor(Math.random() * 1000),
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

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 1 — Exact user format: "Topic N: Title" / "Subtopic N: Title"
    // ═══════════════════════════════════════════════════════════════════════
    const exactTopicMatch    = /^Topic\s*\d*\s*[:\-–—]?\s+\S/i.test(line);
    const exactSubtopicMatch = /^Sub[\s\-]?topic\s*\d*\s*[:\-–—]?\s+\S/i.test(line);

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 2 — Other common keyword formats
    // ═══════════════════════════════════════════════════════════════════════
    const keywordTopicMatch    = /^(chapter|lecture|unit)\s*\d*\s*[:\-–—]?\s+\S/i.test(line);
    const keywordSubtopicMatch = /^(section|sub[\s\-]?section)\s*[\d.]*\s*[:\-–—]?\s+\S/i.test(line);

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 3 — Numbered headings fallback (STRICT)
    // ═══════════════════════════════════════════════════════════════════════
    const afterNumber = line.replace(/^\d+\.\s*/, '');
    const numberedTopicFallback = /^\d+\.\s+[A-Za-z]{3}/.test(line) &&
                                  !/^\d+\.\d+/.test(line) &&
                                  line.length < 60 &&
                                  !afterNumber.includes('.') &&
                                  !afterNumber.includes(':') &&
                                  !/\(.*\)/.test(line);
    const afterSubNumber = line.replace(/^\d+\.\d+[\d.]*\s*/, '');
    const numberedSubtopicFallback = /^\d+\.\d+[\d.]*\s+[A-Za-z]{2}/.test(line) &&
                                     line.length < 60 &&
                                     !afterSubNumber.includes('.') &&
                                     !/\(.*\)/.test(line);

    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITY 4 — ALL-CAPS heuristic
    // ═══════════════════════════════════════════════════════════════════════
    const words = line.split(/\s+/).filter(w => w.length > 0);
    const isAllCapsHeading = line.length < 50 &&
                             line === line.toUpperCase() &&
                             words.length >= 3 &&
                             /[A-Z]/.test(line) &&
                             !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(line);

    const isSubtopicMarker = exactSubtopicMatch || keywordSubtopicMatch || numberedSubtopicFallback;
    const isTopicMarker    = !isSubtopicMarker && (
      exactTopicMatch || keywordTopicMatch || numberedTopicFallback || isAllCapsHeading
    );

    if (isTopicMarker) {
      flushTextBuffer();
      currentTopic = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: line,
        subtopics: [],
        materials: []
      };
      topics.push(currentTopic);
      currentSubtopic = null;

    } else if (isSubtopicMarker) {
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
        title: line,
        materials: []
      };
      currentTopic.subtopics.push(currentSubtopic);

    } else {
      const ytUrl = extractYoutubeUrl(line);
      if (ytUrl) {
        flushTextBuffer();
        const videoTitle = line.replace(ytUrl, '').trim() || 'Lecture Video';
        const videoMaterial: Material = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'video',
          title: videoTitle,
          content: ytUrl
        };
        addMaterialToCurrent(videoMaterial);
      }
      else if (/^\[\s*(image|figure|img)\s*:/i.test(line)) {
        flushTextBuffer();
        const title = line.replace(/[\[\]]/g, '').trim();
        if (imageIndex < allImages.length) {
          const imgMaterial: Material = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            type: 'image',
            title: title,
            content: allImages[imageIndex],
            imageAlign: 'center'
          };
          addMaterialToCurrent(imgMaterial);
          imageIndex++;
        } else {
          const imgMaterial: Material = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            type: 'image',
            title: title,
            content: '',
            imageAlign: 'center'
          };
          addMaterialToCurrent(imgMaterial);
        }
      }
      // ═══════════════════════════════════════════════════════════════════
      // Detect YouTube video TITLES extracted from PDF (no URL available).
      // ═══════════════════════════════════════════════════════════════════
      else {
        const nextIdx = i + 1;
        const nextLine = nextIdx < filteredLines.length ? filteredLines[nextIdx] : null;
        const nextIsTopic = nextLine && /^Topic\s*\d*\s*[:\-–—]?\s+\S/i.test(nextLine);
        const isLastLine = nextIdx >= filteredLines.length;
        const isShortTitleLike = line.length < 90 && line.length > 5 &&
                                  !/[.!?]$/.test(line) &&
                                  !/^\d/.test(line) &&
                                  !/^●/.test(line) &&
                                  !/^\$/.test(line);

        if (isShortTitleLike && (nextIsTopic || isLastLine)) {
          flushTextBuffer();
          const videoMaterial: Material = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            type: 'video',
            title: line,
            content: `yt-search:${line}`
          };
          addMaterialToCurrent(videoMaterial);
        } else {
          textBuffer.push(line);
        }
      }
    }
  }

  flushTextBuffer();

  // Distribute extracted images across topics — one image per topic, in order.
  // Each topic in the PDF should have a corresponding image placed right after the topic title.
  if (allImages.length > 0 && topics.length > 0) {
    for (let t = 0; t < topics.length && t < allImages.length; t++) {
      const imgMaterial: Material = {
        id: Date.now() + Math.floor(Math.random() * 1000) + t,
        type: 'image',
        title: 'Reference Image',
        content: allImages[t],
        imageAlign: 'center'
      };
      // Insert image at the beginning of the topic's materials (right after the title)
      topics[t].materials.unshift(imgMaterial);
    }
    // If there are more images than topics, add extras to the last topic
    for (let t = topics.length; t < allImages.length; t++) {
      const imgMaterial: Material = {
        id: Date.now() + Math.floor(Math.random() * 1000) + t,
        type: 'image',
        title: 'Reference Image',
        content: allImages[t],
        imageAlign: 'center'
      };
      topics[topics.length - 1].materials.push(imgMaterial);
    }
  }

  return {
    title: defaultTitle,
    topics
  };
}

/**
 * Extract JPEG and PNG images directly from the raw PDF binary buffer.
 * PDFs store JPEG images with their native SOI (FF D8) and EOI (FF D9)
 * markers intact. PNG images keep their signature (89 50 4E 47).
 * This scans the buffer for these signatures and extracts valid images
 * as base64 data URIs — no pdfjs-dist or worker needed.
 */
function extractImagesFromPdf(buffer: Buffer): string[] {
  const images: string[] = [];
  const MIN_IMAGE_SIZE = 5000; // Skip tiny images (icons/bullets) — at least ~5KB

  // ── JPEG extraction: scan for SOI (FF D8 FF) → EOI (FF D9) ──
  let offset = 0;
  while (offset < buffer.length - 2) {
    if (
      buffer[offset] === 0xFF &&
      buffer[offset + 1] === 0xD8 &&
      offset + 2 < buffer.length &&
      buffer[offset + 2] === 0xFF
    ) {
      let endOffset = offset + 3;
      let found = false;
      while (endOffset < buffer.length - 1) {
        if (buffer[endOffset] === 0xFF && buffer[endOffset + 1] === 0xD9) {
          endOffset += 2;
          found = true;
          break;
        }
        endOffset++;
      }
      if (found && (endOffset - offset) >= MIN_IMAGE_SIZE) {
        const jpegData = buffer.slice(offset, endOffset);
        const base64 = jpegData.toString('base64');
        images.push(`data:image/jpeg;base64,${base64}`);
      }
      offset = found ? endOffset : offset + 1;
    } else {
      offset++;
    }
  }

  // ── PNG extraction: scan for PNG signature → IEND ──
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const IEND_SIG = Buffer.from([0x49, 0x45, 0x4E, 0x44]);
  offset = 0;
  while (offset < buffer.length - PNG_SIG.length) {
    const idx = buffer.indexOf(PNG_SIG, offset);
    if (idx === -1) break;

    const iendIdx = buffer.indexOf(IEND_SIG, idx + PNG_SIG.length);
    if (iendIdx !== -1) {
      const endOffset = iendIdx + IEND_SIG.length + 4; // +4 for CRC after IEND
      if ((endOffset - idx) >= MIN_IMAGE_SIZE && endOffset <= buffer.length) {
        const pngData = buffer.slice(idx, endOffset);
        const base64 = pngData.toString('base64');
        images.push(`data:image/png;base64,${base64}`);
      }
      offset = endOffset;
    } else {
      offset = idx + 1;
    }
  }

  return images;
}
