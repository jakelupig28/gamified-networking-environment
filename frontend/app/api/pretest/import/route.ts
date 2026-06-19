import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

type PretestQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

// Polyfill browser globals that pdf-parse (pdf.js) expects in Node.js runtime
function polyfillPdfGlobals() {
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
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  polyfillPdfGlobals();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const path = require('path');
  const fs = require('fs');
  const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
  const workerCode = fs.readFileSync(workerPath, 'utf8');
  pdfjs.GlobalWorkerOptions.workerSrc = `data:text/javascript;base64,${Buffer.from(workerCode).toString('base64')}`;
  
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  let fullText = "";
  
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    let pageText = "";
    let lastY: number | null = null;
    
    for (const item of textContent.items as any[]) {
      const str = item.str || "";
      const y = item.transform ? item.transform[5] : null;
      
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
        // Significant vertical y coordinate change means a new line in PDF
        pageText += "\n";
      } else if (item.hasEOL) {
        pageText += "\n";
      } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
        pageText += " ";
      }
      
      pageText += str;
      if (y !== null) {
        lastY = y;
      }
    }
    fullText += pageText + "\n";
  }
  
  return fullText;
}

function parsePretestFromText(text: string): PretestQuestion[] {
  // Normalize newlines and clean text
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Split into lines
  const lines = cleanText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  
  // 1. Detect and separate the Answer Key section from the Questions section
  const answerKeyMap: Record<number, number> = {};
  let questionsLines = [...lines];

  const answerKeyStartIndex = findAnswerKeyStartIndex(lines);
  if (answerKeyStartIndex !== -1) {
    questionsLines = lines.slice(0, answerKeyStartIndex);
    const answerKeyLines = lines.slice(answerKeyStartIndex);
    
    // Pre-process answer key lines to merge split lines (e.g. number on one line, answer letter on next)
    const processedAnswerKeyLines: string[] = [];
    for (let j = 0; j < answerKeyLines.length; j++) {
      const currentLine = answerKeyLines[j].trim();
      if (/^\d+[\.\:\)\-]*$/i.test(currentLine) && j + 1 < answerKeyLines.length) {
        const nextLine = answerKeyLines[j + 1].trim();
        if (/^[A-D]$/i.test(nextLine)) {
          processedAnswerKeyLines.push(currentLine + " " + nextLine);
          j++; // skip next line
          continue;
        }
      }
      processedAnswerKeyLines.push(currentLine);
    }
    const answerKeyText = processedAnswerKeyLines.join("\n");
    
    // Parse answer key pairs, e.g. "1. A", "2) B", "3: C", "4 - D"
    const pairRegex = /\b(\d+)\b[\s\.\:\)\-\=\(\/]+\(?([A-D])\)?\b/gi;
    let match;
    while ((match = pairRegex.exec(answerKeyText)) !== null) {
      const qNum = parseInt(match[1], 10);
      const choiceChar = match[2].toUpperCase();
      const choiceIndex = choiceChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      answerKeyMap[qNum] = choiceIndex;
    }
  }

  const questions: PretestQuestion[] = [];
  let currentQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
    qNum?: number;
  } | null = null;
  
  // Regex to match question start: e.g., "1.", "1)", "Q1:", "Q1.", "[1]", etc. Allow leading asterisks.
  const questionStartRegexActual = /^[\*\s]*(?:Q|Question)?\s*\[?(\d+)\]?[\.\:\)\-\s]/i;
  
  // Regex to match options: e.g., "A.", "A)", "a.", "a)", "[A]", "A -", etc. (allow optional leading asterisk)
  const optionRegex = /^\*?\s*[a-d][\.\:\)\-\s]/i;
  const optionPrefixStripper = /^[a-d][\.\:\)\-\s]+\*?|^\[[a-d]\]\s*\*?|^\*\s*[a-d][\.\:\)\-\s]+/i;

  const commitCurrentQuestion = () => {
    if (currentQuestion) {
      if (currentQuestion.question && currentQuestion.options.length > 0) {
        // Pad options to exactly 4 if they are fewer
        while (currentQuestion.options.length < 4) {
          currentQuestion.options.push("Option " + (currentQuestion.options.length + 1));
        }
        // Trim options to exactly 4 if they are more
        if (currentQuestion.options.length > 4) {
          currentQuestion.options = currentQuestion.options.slice(0, 4);
        }
        
        // Find correct answer from Answer Key Map
        // Check order of appearance first, then fall back to literal parsed question number
        const appearanceIndex = questions.length + 1;
        const literalNumber = currentQuestion.qNum || appearanceIndex;
        
        let answerVal = undefined;
        if (answerKeyMap[appearanceIndex] !== undefined) {
          answerVal = answerKeyMap[appearanceIndex];
        } else if (answerKeyMap[literalNumber] !== undefined) {
          answerVal = answerKeyMap[literalNumber];
        }
        
        if (answerVal !== undefined) {
          currentQuestion.correctAnswer = answerVal;
        }
        
        const { qNum, ...questionToPush } = currentQuestion;
        questions.push(questionToPush as PretestQuestion);
      }
      currentQuestion = null;
    }
  };

  for (let i = 0; i < questionsLines.length; i++) {
    const line = questionsLines[i];
    
    // Check if line is a new question
    const qMatch = line.match(questionStartRegexActual);
    const isNewQuestion = qMatch || (
      /^\d+[\.\:\)\-]/i.test(line) && (!currentQuestion || currentQuestion.options.length > 0)
    );

    if (isNewQuestion) {
      commitCurrentQuestion();
      
      const numMatch = line.match(/^[\*\s]*(?:Q|Question)?\s*\[?(\d+)\]?[\.\:\)\-\s]/i);
      const qNum = numMatch ? parseInt(numMatch[1], 10) : (questions.length + 1);

      // Strip question number prefix and any leading asterisks/spaces
      let strippedQuestion = line.replace(/^[\*\s]*(?:Q|Question)?\s*\[?\d+\]?[\.\:\)\-\s]*/i, "").trim();
      // Also strip trailing bold asterisks (e.g. "**" at the end of the question title)
      strippedQuestion = strippedQuestion.replace(/\*\*+$/, "").replace(/\*+$/, "").trim();

      currentQuestion = {
        question: strippedQuestion,
        options: [],
        correctAnswer: 0,
        qNum: qNum
      };
      continue;
    }

    if (!currentQuestion) {
      // If we are not inside a question, ignore standalone text or treat it as the start of a question
      if (line.length > 5) {
        currentQuestion = {
          question: line,
          options: [],
          correctAnswer: 0
        };
      }
      continue;
    }

    // Check if line contains multiple options inline (e.g. "A. Classless  B. Classful")
    const parsedInlineOptions = parseOptionsFromLine(line);
    if (parsedInlineOptions) {
      for (const opt of parsedInlineOptions) {
        currentQuestion.options.push(opt.option);
        if (opt.isCorrect) {
          currentQuestion.correctAnswer = currentQuestion.options.length - 1;
        }
      }
      continue;
    }

    // Check if line is a single option
    const isOption = optionRegex.test(line) || /^[a-d]\s+/i.test(line);
    if (isOption) {
      const isCorrectMarked = line.includes("*") || line.startsWith("*") || line.endsWith("*");
      let optText = line.replace(optionPrefixStripper, "").replace(/\*/g, "").trim();
      
      currentQuestion.options.push(optText);
      if (isCorrectMarked) {
        currentQuestion.correctAnswer = currentQuestion.options.length - 1;
      }
      continue;
    }

    // Check if line is correct answer declaration (fallback inline answers)
    const ansMatch = line.match(/^(?:Answer|Ans|Correct|Key|Correct Answer)\s*[\:\-\=]?\s*([a-d])/i);
    if (ansMatch) {
      const ansChar = ansMatch[1].toUpperCase();
      currentQuestion.correctAnswer = ansChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      continue;
    }

    // Otherwise, append text to question title if we don't have options yet
    if (currentQuestion.options.length === 0) {
      currentQuestion.question += " " + line;
    }
  }

  // Commit last question
  commitCurrentQuestion();

  return questions;
}

function findAnswerKeyStartIndex(lines: string[]): number {
  // 1. Look for explicit header first
  const headerRegex = /^(?:Answer\s*Key|Answers|Correct\s*Answers|Key|ANSWERS|ANSWER\s*KEY)[\s\:\-\=]*/i;
  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i])) {
      return i;
    }
  }

  // 2. Look for the start of implicit answer list: e.g. "1. A" or "1) A" or "1: A" at the end of the file.
  const answerLineRegex = /^(?:Q|Question)?\s*\[?1\]?[\s\.\:\)\-\=]+\(?[A-D]\)?\.?\s*$/i;
  const inlineAnswerRegex = /^(?:Q|Question)?\s*\[?1\]?[\s\.\:\)\-\=]+\(?[A-D]\)?[,\s]+(?:Q|Question)?\s*\[?2\]?[\s\.\:\)\-\=]+\(?[A-D]\)?/i;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (inlineAnswerRegex.test(lines[i])) {
      return i;
    }
    if (answerLineRegex.test(lines[i])) {
      // Verify if the next line (if exists) is "2. [A-D]" or similar to be sure it's part of a list
      if (i + 1 < lines.length) {
        const nextLineRegex = /^(?:Q|Question)?\s*\[?2\]?[\s\.\:\)\-\=]+\(?[A-D]\)?/i;
        if (nextLineRegex.test(lines[i + 1])) {
          return i;
        }
      } else {
        return i;
      }
    }
  }

  return -1;
}

function parseOptionsFromLine(line: string): { option: string, isCorrect: boolean }[] | null {
  const optionMarkerRegexActual = /(?:^|\s)(\*?)\s*\b([A-D])[\.\:\)\-\s]/gi;
  
  const matches: { index: number, prefix: string, isCorrect: boolean, char: string }[] = [];
  let match;
  optionMarkerRegexActual.lastIndex = 0;
  while ((match = optionMarkerRegexActual.exec(line)) !== null) {
    const isCorrect = match[1] === "*" || match[0].includes("*");
    matches.push({
      index: match.index,
      prefix: match[0],
      isCorrect,
      char: match[2].toUpperCase()
    });
  }

  // Validate consecutive order of matched characters: e.g. A followed by B followed by C
  let isValidSequence = true;
  for (let idx = 1; idx < matches.length; idx++) {
    const prevChar = matches[idx - 1].char.charCodeAt(0);
    const currChar = matches[idx].char.charCodeAt(0);
    if (currChar !== prevChar + 1) {
      isValidSequence = false;
      break;
    }
  }

  if (matches.length >= 2 && isValidSequence) {
    const options: { option: string, isCorrect: boolean }[] = [];
    for (let idx = 0; idx < matches.length; idx++) {
      const current = matches[idx];
      const nextIndex = (idx + 1 < matches.length) ? matches[idx + 1].index : line.length;
      let optionText = line.substring(current.index, nextIndex).trim();
      if (optionText.toLowerCase().startsWith(current.prefix.trim().toLowerCase())) {
        optionText = optionText.substring(current.prefix.trim().length).trim();
      }
      optionText = optionText.replace(/^\*?\s*/, "").replace(/\*?\s*$/, "").trim();
      options.push({
        option: optionText,
        isCorrect: current.isCorrect
      });
    }
    return options;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let plainText = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      plainText = body.text || "";
    } else {
      // Multipart form upload
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
      }

      const fileName = file.name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer });
        plainText = result.value;
      } else if (fileName.endsWith(".pdf")) {
        plainText = await extractPdfText(buffer);
      } else if (fileName.endsWith(".txt")) {
        plainText = buffer.toString("utf8");
      } else {
        return NextResponse.json({ success: false, message: "Unsupported file format. Only PDF, DOCX, and TXT are supported." }, { status: 400 });
      }
    }

    if (!plainText.trim()) {
      return NextResponse.json({ success: false, message: "No content could be extracted." }, { status: 400 });
    }

    const questions = parsePretestFromText(plainText);
    
    if (questions.length === 0) {
      return NextResponse.json({ success: false, message: "No multiple choice questions could be parsed from the content. Please verify formatting." }, { status: 400 });
    }

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error("Error importing pretest:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error parsing pre-test" }, { status: 500 });
  }
}
