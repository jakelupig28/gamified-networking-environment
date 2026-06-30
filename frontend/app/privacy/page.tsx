"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <div className="border-b border-brand-border/60 pb-6 space-y-2">
          <span className="text-[10px] text-brand-cyan font-black uppercase tracking-widest font-mono">Legal Documents</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-brand-muted text-xs font-mono">Last Updated: June 30, 2026</p>
        </div>

        {/* Content Cards */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 md:p-8 shadow-xl space-y-8 text-xs leading-relaxed text-brand-muted">
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">1. Introduction</h2>
            <p>
              Welcome to NetMaster. We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, store, and share your information when you access 
              and participate in our gamified networking learning platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">2. Information We Collect</h2>
            <p>
              We collect information that you directly provide when registering an account, completing your student profile, 
              participating in discussion boards, and completing networking challenges. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-brand-text">Account Identifiers:</strong> Name, email address, password, student ID, and course details.
              </li>
              <li>
                <strong className="text-brand-text">Learning Telemetry:</strong> Pre-test scores, watching video indicators, interactive activity metrics, 
                and Packet Tracer lab `.pka` configurations uploaded for grading.
              </li>
              <li>
                <strong className="text-brand-text">System Logs:</strong> Device logs, IP address data, browser signatures, and navigation metrics collected for secure quiz verification.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">3. How We Use Your Data</h2>
            <p>
              Your data is collected and processed for the following operational requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To initialize and secure your gamified learner account.</li>
              <li>To evaluate configurations, grade static routes, and compile XP scores for leaderboard ranking.</li>
              <li>To implement academic integrity protocols (tab visibility and fullscreen lockouts during assessments).</li>
              <li>To display earned achievements, badges, and learning progress inside your student profile dashboard.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">4. Information Sharing & Third Parties</h2>
            <p>
              NetMaster operates as an educational resource center. We do not sell, rent, or distribute your personal 
              information to advertising partners. Telemetry data, grading scores, and leaderboard placements are shared 
              only with your designated course instructors and system administrators for educational assessment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">5. Data Retention & Deletion</h2>
            <p>
              We store your data for as long as your student account is active. You may request the deletion of your account 
              and associated database configurations by contacting support or your course administrator. Once processed, 
              your telemetry data will be permanently purged or anonymized.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-brand-text">6. Security Protocols</h2>
            <p>
              We implement industry-standard database access security layers, HTTPS link encryption, and hashing passwords to protect 
              your data. While we strive to maintain secure operational layers, no method of digital transmission or storage is 100% 
              fail-safe.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
