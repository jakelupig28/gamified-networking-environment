"use client";

import { useState } from "react";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
}

export default function CertificateModal({
  isOpen,
  onClose,
  studentName,
  studentEmail,
}: CertificateModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Hashing helper for unique, letters+numbers certificate ID
  const generateCertificateId = (email: string) => {
    if (!email) return "NM-2026-0000";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
    return `NM-2026-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
  };

  const handleDownloadImage = () => {
    setIsDownloading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/certificate_template.png";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw background template
      ctx?.drawImage(img, 0, 0);
      
      if (ctx) {
        const certId = generateCertificateId(studentEmail);
        const w = img.width;
        const h = img.height;
        
        // 1. Recipient Name: top-[30.2%] left-[18.2%] w-[63.6%] h-[7.3%]
        ctx.font = `bold ${w * 0.032}px Georgia, serif`;
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(studentName, w * 0.5, h * 0.3385);
        
        // 2. Program: top-[47.6%] left-[18.2%] w-[63.6%] h-[4.9%]
        ctx.font = `bold ${w * 0.016}px sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.fillText("Advanced Computer Networking Curriculum", w * 0.5, h * 0.5005);
        
        // 3. Date: top-[60.6%] left-[33.7%] w-[32.6%] h-[4.9%]
        const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        ctx.font = `bold ${w * 0.013}px sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.fillText(dateStr, w * 0.5, h * 0.6305);
        
        // 4. Left Signature Name: top-[73%] left-[19%] w-[27%]
        ctx.font = `italic bold ${w * 0.012}px Georgia, serif`;
        ctx.fillStyle = "#475569";
        ctx.fillText("NetMaster Academic Board", w * 0.325, h * 0.7525);
        
        // Left Signature Title: top-[78.2%] left-[19%] w-[27%]
        ctx.font = `600 ${w * 0.009}px sans-serif`;
        ctx.fillStyle = "#64748b";
        ctx.fillText("Authorized Certification Unit", w * 0.325, h * 0.802);
        
        // 5. Right Signature Name: top-[73%] left-[51%] w-[27%]
        ctx.font = `italic bold ${w * 0.012}px Georgia, serif`;
        ctx.fillStyle = "#475569";
        ctx.fillText("Dr. E. V. Kathará", w * 0.645, h * 0.7525);
        
        // Right Signature Title: top-[78.2%] left-[51%] w-[27%]
        ctx.font = `600 ${w * 0.009}px sans-serif`;
        ctx.fillStyle = "#64748b";
        ctx.fillText("Curriculum Director", w * 0.645, h * 0.802);
        
        // 6. Cert ID: top-[85.5%] right-[5.5%] w-[18%] (right-aligned)
        ctx.font = `bold ${w * 0.010}px monospace`;
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "right";
        ctx.fillText(certId, w * 0.945, h * 0.8775);
      }
      
      try {
        const link = document.createElement("a");
        link.download = `Certificate_of_Completion_${studentName.replace(/\s+/g, "_")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Error generating data URL:", err);
        alert("Failed to export image due to browser canvas permissions. Please try Print/Save as PDF instead.");
      } finally {
        setIsDownloading(false);
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load certificate template image:", err);
      setIsDownloading(false);
      alert("Failed to download the certificate image. Please try using the Print/Save as PDF option.");
    };
  };

  const certId = generateCertificateId(studentEmail);

  return (
    <div id="certificate-print-root" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-8 animate-fadeIn print:bg-white print:p-0 print:absolute print:inset-0">
      
      {/* Print controls - hidden in print */}
      <div className="absolute top-4 right-4 flex items-center gap-3 print:hidden">
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-hover disabled:bg-brand-border disabled:text-brand-muted text-brand-bg font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 animate-pulse-subtle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {isDownloading ? "Generating..." : "Download Image (PNG)"}
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-brand-bg font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14" rx="1"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/></svg>
          Print/Save PDF
        </button>
        <button
          onClick={onClose}
          className="p-2.5 bg-brand-border/60 hover:bg-brand-border rounded-lg text-brand-text transition-all border border-brand-border cursor-pointer shadow-lg active:scale-95"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Certificate Frame */}
      <div 
        id="certificate-print-frame" 
        className="w-full max-w-4xl aspect-[1.414/1] relative overflow-hidden shadow-2xl print:border-none print:bg-white print:text-slate-900 print:shadow-none print:w-full print:h-full print:rounded-none"
        style={{ 
          backgroundImage: "url('/certificate_template.png')", 
          backgroundSize: "100% 100%", 
          backgroundRepeat: "no-repeat" 
        }}
      >
        {/* 1. Recipient name overlay covering the placeholder box */}
        <div className="absolute top-[30.2%] left-[18.2%] w-[63.6%] h-[7.3%] bg-[#EDEAE6] flex items-center justify-center font-serif text-sm sm:text-base md:text-xl font-bold text-[#1e293b]">
          {studentName}
        </div>
        {/* Cover recipient helper text under the name box */}
        <div className="absolute top-[37.5%] left-[30%] w-[40%] h-[3.5%] bg-[#FAF8F5]"></div>

        {/* 2. Course name overlay covering the program placeholder box */}
        <div className="absolute top-[47.6%] left-[18.2%] w-[63.6%] h-[4.9%] bg-[#EDEAE6] flex items-center justify-center font-sans text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-[#1e293b]">
          Advanced Computer Networking Curriculum
        </div>
        {/* Cover course helper text under the course box */}
        <div className="absolute top-[52.5%] left-[30%] w-[40%] h-[3.5%] bg-[#FAF8F5]"></div>

        {/* 3. Date overlay covering the date placeholder box */}
        <div className="absolute top-[60.6%] left-[33.7%] w-[32.6%] h-[4.9%] bg-[#EDEAE6] flex items-center justify-center font-sans text-[9px] sm:text-xs font-bold text-[#1e293b]">
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>
        {/* Cover date helper text under the date box */}
        <div className="absolute top-[65.5%] left-[40%] w-[20%] h-[3.5%] bg-[#FAF8F5]"></div>

        {/* 4. Left signature overlay (NetMaster Administration) */}
        <div className="absolute top-[73%] left-[19%] w-[27%] h-[4.5%] bg-[#FAF8F5] flex items-center justify-center font-serif text-[10px] sm:text-xs italic font-bold text-slate-700">
          NetMaster Academic Board
        </div>
        {/* Left title overlay */}
        <div className="absolute top-[78.2%] left-[19%] w-[27%] h-[4%] bg-[#FAF8F5] flex items-center justify-center font-sans text-[8px] sm:text-[10px] font-semibold text-slate-500">
          Authorized Certification Unit
        </div>

        {/* 5. Right signature overlay (Curriculum Lead Director) */}
        <div className="absolute top-[73%] left-[51%] w-[27%] h-[4.5%] bg-[#FAF8F5] flex items-center justify-center font-serif text-[10px] sm:text-xs italic font-bold text-slate-700">
          Dr. E. V. Kathará
        </div>
        {/* Right title overlay */}
        <div className="absolute top-[78.2%] left-[51%] w-[27%] h-[4%] bg-[#FAF8F5] flex items-center justify-center font-sans text-[8px] sm:text-[10px] font-semibold text-slate-500">
          Curriculum Director
        </div>

        {/* 6. Unique Certificate ID overlay on bottom right */}
        <div className="absolute top-[85.5%] right-[5.5%] w-[18%] h-[4.5%] bg-[#FAF8F5] flex items-center justify-end font-mono text-[9px] sm:text-[11px] font-bold text-slate-800">
          {certId}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide everything in body */
          body > div:first-child {
            display: none !important;
          }
          /* Show ONLY this modal container */
          #certificate-print-root {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #certificate-print-frame {
            background-image: url('/certificate_template.png') !important;
            background-size: 100% 100% !important;
            background-repeat: no-repeat !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: none !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 3rem !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
