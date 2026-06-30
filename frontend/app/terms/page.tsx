"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <div className="border-b border-brand-border/60 pb-6 space-y-2">
          <span className="text-[10px] text-brand-cyan font-black uppercase tracking-widest font-mono">Legal Documents</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Terms & Conditions</h1>
          <p className="text-brand-muted text-xs font-mono">Last Updated: June 30, 2026</p>
        </div>

        {/* Content Cards */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 shadow-xl space-y-8 text-xs leading-relaxed text-brand-muted">
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">1. Agreement to Terms</h2>
            <p>
              By creating an account, launching network simulations, and uploading Packet Tracer configurations to NetMaster, 
              you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, you must 
              cease access to this platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">2. Platform License & Permitted Use</h2>
            <p>
              We grant you a non-exclusive, non-transferable, revocable license to access the learning modules, participate in 
              simulation terminal sandboxes, and download Packet Tracer configuration templates strictly for academic, educational 
              learning purposes. You agree not to distribute or exploit platform resources commercially.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">3. Academic Integrity & Anti-Cheating Policy</h2>
            <p>
              NetMaster is designed to verify and build true technical networking competency. You agree to adhere to the 
              following strict academic integrity guidelines during assessments (Pre-tests, Interactive Activities, and Exams):
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-brand-text">Independent Effort:</strong> All quiz submissions, drag-drop answers, and terminal CLI commands 
                must represent your own independent academic work.
              </li>
              <li>
                <strong className="text-brand-text">Cheating Detections:</strong> Exiting fullscreen mode, switching browser tabs, or launching 
                unauthorized browser panels during secure test windows will record automated cheating logs forwarded directly to your course professor.
              </li>
              <li>
                <strong className="text-brand-text">Config Plagiarism:</strong> Uploading Cisco Packet Tracer files compiled by other students will result in 
                score cancellations and academic discipline.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">4. User Content & Forums</h2>
            <p>
              You are responsible for any text, replies, or configurations you submit to the Discussion Feed forums. You agree 
              not to publish offensive content, copy peer solutions, or violate system configurations. We reserve the right to 
              moderate and remove posts that violate academic standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">5. Platform Telemetry Disclaimer</h2>
            <p>
              NetMaster provides sandbox virtualization and network emulation. We strive to provide accurate routing 
              telemetry (e.g. OSPF calculations, bits ANDing, gateway reachability) but do not guarantee that the 
              emulation behaves identically to physical hardware interfaces under all non-standard configurations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">6. Limitation of Liability</h2>
            <p>
              NetMaster is provided on an "as-is" and "as-available" basis. In no event shall NetMaster, its system administrators, 
              or academic institutions be liable for any direct, indirect, incidental, or consequential damages resulting 
              from your use or inability to use this platform.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
