import { SignInButton, SignUpButton } from "@clerk/nextjs";
import HomeRedirect from "@/components/HomeRedirect";

export default function Home() {
  return (
    <>
      <HomeRedirect />
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--color-border)]">
        <div className="max-w-[1128px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-accent)] rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="text-[var(--color-accent)] font-semibold text-xl tracking-tight">
              Rising Creators
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-4 py-2.5 rounded-full transition-all">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-5 py-2.5 rounded-full transition-all">
                Get Started
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-[1128px] mx-auto px-6 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          {/* Left - Content */}
          <div className="lg:max-w-[500px]">
            <h1 className="text-[var(--color-headline)] text-4xl lg:text-[56px] leading-tight lg:leading-[1.15] font-light mb-6">
              Welcome to your
              <br />
              creator community
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] mb-10">
              Where rising creators connect with brands that believe in their potential.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <SignUpButton mode="modal">
                <button className="bg-[var(--color-accent)] text-white font-semibold py-3.5 px-8 rounded-full hover:bg-[var(--color-accent-hover)] transition-colors text-base">
                  Get Started
                </button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <button className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-semibold py-3.5 px-8 rounded-full border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-tertiary)] transition-all text-base">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
          
          {/* Right - Illustration */}
          <div className="hidden lg:block">
            <div className="relative w-[450px] h-[380px]">
              {/* Background shape */}
              <div className="absolute right-0 bottom-0 w-[350px] h-[350px] rounded-full bg-[var(--color-bg-secondary)]" />
              
              {/* Abstract people illustration */}
              <svg 
                viewBox="0 0 400 350" 
                className="relative z-10 w-full h-full"
                fill="none"
              >
                {/* Person 1 - left */}
                <g transform="translate(80, 120)">
                  <circle cx="35" cy="25" r="22" fill="#9dc3a7" />
                  <path d="M12 65 Q35 45 58 65 L58 130 L12 130 Z" fill="#9dc3a7" />
                </g>
                
                {/* Person 2 - center (larger) */}
                <g transform="translate(150, 80)">
                  <circle cx="45" cy="32" r="28" fill="#0a66c2" />
                  <path d="M15 85 Q45 60 75 85 L75 170 L15 170 Z" fill="#0a66c2" />
                </g>
                
                {/* Person 3 - right */}
                <g transform="translate(245, 130)">
                  <circle cx="32" cy="22" r="20" fill="#f0c98d" />
                  <path d="M10 58 Q32 40 54 58 L54 120 L10 120 Z" fill="#f0c98d" />
                </g>
                
                {/* Connection dots/lines */}
                <circle cx="130" cy="150" r="4" fill="#0a66c2" opacity="0.4" />
                <circle cx="240" cy="140" r="4" fill="#0a66c2" opacity="0.4" />
                <circle cx="185" cy="200" r="3" fill="#0a66c2" opacity="0.3" />
                
                <path 
                  d="M130 150 Q185 130 240 140" 
                  stroke="#0a66c2"
                  opacity="0.3"
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)]">
        <div className="max-w-[1128px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[var(--color-bg-primary)] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Get discovered
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
                Showcase your work to brands actively seeking fresh talent and authentic voices.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[var(--color-bg-primary)] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Track your growth
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
                Monitor your metrics across platforms. See your progress in one place.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[var(--color-bg-primary)] rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Earn what you're worth
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
                Set your rates. Connect directly with brands. No middlemen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-[1128px] mx-auto px-6 py-16">
        <p className="text-center text-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-medium mb-8">
          Trusted by creators on
        </p>
        <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
          <span className="text-xl font-semibold text-[var(--color-text-tertiary)]">TikTok</span>
          <span className="text-xl font-semibold text-[var(--color-text-tertiary)]">YouTube</span>
          <span className="text-xl font-semibold text-[var(--color-text-tertiary)]">Instagram</span>
          <span className="text-xl font-semibold text-[var(--color-text-tertiary)]">Twitter</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-[1128px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--color-accent)] rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">RC</span>
              </div>
              <span className="text-[var(--color-text-tertiary)] text-sm">© 2025</span>
            </div>
            <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
              <a href="#" className="hover:text-[var(--color-accent)] hover:underline transition-colors">About</a>
              <a href="#" className="hover:text-[var(--color-accent)] hover:underline transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[var(--color-accent)] hover:underline transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
