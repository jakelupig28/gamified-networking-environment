import Link from 'next/link';

export default function Navbar({ showLinks = true, showAuth = true }: { showLinks?: boolean, showAuth?: boolean }) {
  return (
    <nav className="flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto text-sm">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan"><path d="M12 2v20"/><path d="m2 12 h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
        NetMaster
      </Link>
      
      {showLinks && (
        <div className="hidden md:flex items-center gap-8 font-medium text-brand-text">
          <Link href="#" className="hover:text-brand-cyan transition-colors">Curriculum</Link>
          <Link href="#" className="hover:text-brand-cyan transition-colors">Leaderboard</Link>
          <Link href="#" className="hover:text-brand-cyan transition-colors">Labs</Link>
        </div>
      )}

      {showAuth && (
        <div className="flex items-center gap-6 font-medium">
          <Link href="/login" className="hover:text-brand-cyan transition-colors">Login</Link>
          <Link href="/register" className="bg-brand-cyan hover:bg-brand-cyan-hover text-brand-bg px-5 py-2 rounded font-semibold transition-colors">
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}