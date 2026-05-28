import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between text-xs font-medium text-brand-text">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
          <span className="opacity-90">Â© 2026 NetMaster IT Excellence. All Rights Reserved.</span>
        </div>
        
        <div className="flex items-center gap-8 opacity-90">
          <Link href="#" className="hover:text-brand-cyan transition-colors">Academic Integrity</Link>
          <Link href="#" className="hover:text-brand-cyan transition-colors">Research Library</Link>
          <Link href="#" className="hover:text-brand-cyan transition-colors">Syllabus Hub</Link>
          <Link href="#" className="hover:text-brand-cyan transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}