"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CertificationVerificationPage() {
  const [certNo, setCertNo] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNo.trim()) return;

    setIsLoading(true);
    setHasChecked(false);
    setVerificationResult(null);

    try {
      const [usersRes, modulesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/modules")
      ]);

      const usersData = await usersRes.json();
      const modulesData = await modulesRes.json();

      if (usersData.success && usersData.users && modulesData.success && modulesData.modules) {
        const users = usersData.users;
        const modulesList = modulesData.modules;

        const targetCertId = certNo.trim().toUpperCase();

        const generateCertificateId = (email: string) => {
          let hash = 0;
          for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
          return `NM-2026-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
        };

        let matchedUser = null;
        for (const u of users) {
          if (generateCertificateId(u.email) === targetCertId) {
            matchedUser = u;
            break;
          }
        }

        if (matchedUser) {
          const totalModulesCount = modulesList.length;
          const completedModulesCount = modulesList.filter((mod: any) =>
            mod.topics.every((t: any) => matchedUser.completedTopics?.[t.id] === true)
          ).length;
          const isAllTopicsCompleted = totalModulesCount > 0 && completedModulesCount === totalModulesCount;

          const pretestModules = modulesList.filter((mod: any) => mod.pretest && mod.pretest.length > 0);
          const totalPretestsCount = pretestModules.length;
          const completedPretestsCount = pretestModules.filter((mod: any) =>
            matchedUser.pretestScores?.[mod.id] !== undefined
          ).length;
          const isAllPretestsCompleted = totalPretestsCount > 0 && completedPretestsCount === totalPretestsCount;

          const simLabModuleIds = [1782184909611, 1782186928370, 1782197552474, 1782199846377];
          const totalSimLabsCount = simLabModuleIds.length;
          const completedSimLabsCount = simLabModuleIds.filter((mId) => {
            const score = matchedUser.interactiveScores?.[mId]?.["simulationLab"];
            return score !== undefined && score >= 80;
          }).length;
          const isAllSimLabsCompleted = completedSimLabsCount === totalSimLabsCount;

          const packetTracerIds = ["pt-lab-1", "pt-lab-2", "pt-lab-3", "pt-lab-4"];
          const totalPTLabsCount = packetTracerIds.length;
          const completedPTLabsCount = packetTracerIds.filter((labId: string) =>
            matchedUser.labSubmissions?.[labId] !== undefined
          ).length;
          const isAllPTLabsCompleted = completedPTLabsCount === totalPTLabsCount;

          const totalQuizzesCount = modulesList.length;
          const completedQuizzesCount = modulesList.filter((mod: any) =>
            matchedUser.quizScores?.[mod.id] !== undefined
          ).length;
          const isAllQuizzesCompleted = totalQuizzesCount > 0 && completedQuizzesCount === totalQuizzesCount;

          const isEligible =
            isAllTopicsCompleted &&
            isAllPretestsCompleted &&
            isAllSimLabsCompleted &&
            isAllPTLabsCompleted &&
            isAllQuizzesCompleted;

          if (isEligible) {
            setVerificationResult({
              success: true,
              studentName: matchedUser.name,
              certId: targetCertId,
              dateCompleted: "Verified Completion",
              program: "Advanced Computer Networking Curriculum"
            });
          } else {
            setVerificationResult({
              success: false,
              reason: "ineligible"
            });
          }
        } else {
          setVerificationResult({
            success: false,
            reason: "not_found"
          });
        }
      } else {
        setVerificationResult({
          success: false,
          reason: "api_error"
        });
      }
    } catch (err) {
      console.error(err);
      setVerificationResult({
        success: false,
        reason: "api_error"
      });
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4 pt-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Certificate <span className="text-brand-cyan">Verification Center</span>
          </h1>
          <p className="text-brand-muted text-sm leading-relaxed">
            Verify academic credentials issued by NetMaster. Enter the certificate number below to check its validity and authenticity.
          </p>
        </div>

        {/* Input box */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 shadow-xl max-w-xl mx-auto">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="cert-input" className="text-[10px] font-black uppercase tracking-wider text-brand-muted">
                Certificate Number
              </label>
              <div className="flex gap-3">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted/70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  <input
                    id="cert-input"
                    type="text"
                    placeholder="e.g. NM-2026-F93A-8C2D"
                    value={certNo}
                    onChange={(e) => setCertNo(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-4 py-3 text-xs font-mono tracking-wider focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all text-brand-text placeholder-brand-muted/50 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !certNo.trim()}
                  className="px-6 bg-brand-cyan hover:bg-brand-cyan-hover disabled:bg-brand-border disabled:text-brand-muted text-brand-bg font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  {isLoading ? "Checking..." : "Verify"}
                </button>
              </div>
            </div>
            <p className="text-[9px] text-brand-muted font-medium">
              Note: Certificate numbers are case-insensitive and format-flexible. They are printed on the bottom right corner of NetMaster certifications.
            </p>
          </form>
        </div>

        {/* Verification Status Results */}
        {hasChecked && (
          <div className="max-w-xl mx-auto animate-scaleIn">
            {verificationResult?.success ? (
              <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
                
                {/* Result Header */}
                <div className="flex items-center gap-4 border-b border-green-500/15 pb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <span className="text-[8px] font-black tracking-widest text-green-400 font-mono uppercase">Status</span>
                    <h3 className="font-extrabold text-xs text-green-400 mt-0.5">✓ LEGITIMATE CERTIFICATE VERIFIED</h3>
                  </div>
                </div>

                {/* Details Table */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-brand-border/20">
                    <span className="text-brand-muted font-medium">Recipient Student</span>
                    <span className="col-span-2 font-bold text-brand-text">{verificationResult.studentName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-brand-border/20">
                    <span className="text-brand-muted font-medium">Curriculum Path</span>
                    <span className="col-span-2 font-semibold text-brand-text">{verificationResult.program}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-brand-border/20">
                    <span className="text-brand-muted font-medium">Certificate No.</span>
                    <span className="col-span-2 font-bold text-brand-cyan font-mono tracking-wider">{verificationResult.certId}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-brand-muted font-medium">Issuer Institution</span>
                    <span className="col-span-2 font-semibold text-brand-text">NetMaster Academy of IT Excellence</span>
                  </div>
                </div>

                <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10 text-[10px] text-green-400 leading-relaxed">
                  Academic records confirm this candidate has completed all virtual sandboxes, pre-tests, quizzes, and Packet Tracer config files.
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>

                <div className="flex items-center gap-4 border-b border-red-500/15 pb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <span className="text-[8px] font-black tracking-widest text-red-400 font-mono uppercase">Status</span>
                    <h3 className="font-extrabold text-xs text-red-400 mt-0.5">✗ UNVERIFIED CERTIFICATE NUMBER</h3>
                  </div>
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  {verificationResult?.reason === "ineligible"
                    ? "The certificate code matches a registered student, but the candidate has not yet successfully passed all modules, simulation labs, or exams required to earn their official certification."
                    : "The certificate number entered does not match any verified graduates or issued records in the NetMaster academic database. Please check for spelling mistakes and try again."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
