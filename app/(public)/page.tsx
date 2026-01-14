import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
            🚀 Find creators before they blow up
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
            Find Tomorrow's Top Creators
            <span className="text-[var(--color-accent)]"> Today</span>
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-8 max-w-3xl mx-auto">
            AI-powered discovery of high-growth creators (10K-500K followers) before they become 
            expensive and oversaturated. Get better engagement at a fraction of the cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-[var(--color-accent)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Start Finding Creators — Free
            </Link>
            <Link
              href="#how-it-works"
              className="border border-[var(--color-border-strong)] text-[var(--color-text-primary)] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              See How It Works
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-tertiary)]">
            No credit card required • 3 free creator unlocks
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">10K+</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">Rising Creators</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">25%</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">Avg Growth Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">5min</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">To First Match</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">1/30th</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">Cost of Enterprise</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
            The Problem with Traditional Influencer Platforms
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <div className="text-3xl mb-4">💸</div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                Enterprise Pricing
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Platforms like CreatorIQ charge $36,000+/year — designed for Fortune 500, not growing brands.
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <div className="text-3xl mb-4">♻️</div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                Same Saturated Pool
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Everyone searches the same database of 20M creators. Same influencers, creator fatigue, bidding wars.
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <div className="text-3xl mb-4">⏳</div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                Slow to Start
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                6-8 week implementations, enterprise sales calls, complex training required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6 bg-[var(--color-bg-secondary)]" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">
            A Smarter Way to Find Creators
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto">
            Rising Creators uses AI to find high-growth creators before your competitors do — 
            and matches them to your brand automatically.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border border-[var(--color-border)]">
              <div className="w-12 h-12 bg-[var(--color-accent-light)] rounded-xl flex items-center justify-center text-2xl mb-4">
                📈
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                1. We Find Rising Stars
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Our AI scans for creators with 5%+ weekly growth, high engagement, and consistent posting — 
                the signals that predict breakout success.
              </p>
            </div>
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border border-[var(--color-border)]">
              <div className="w-12 h-12 bg-[var(--color-accent-light)] rounded-xl flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                2. AI Matches to Your Brand
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                We analyze your website, socials, and industry to calculate a personalized Brand Match Score 
                for every creator — so you see your best fits first.
              </p>
            </div>
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border border-[var(--color-border)]">
              <div className="w-12 h-12 bg-[var(--color-accent-light)] rounded-xl flex items-center justify-center text-2xl mb-4">
                🤝
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                3. Connect & Collaborate
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Unlock creator profiles, get contact info, and start partnerships — 
                all within a simple, self-service platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
            Why Brands Choose Rising Creators
          </h2>
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-4 text-[var(--color-text-tertiary)] font-medium">Feature</th>
                  <th className="text-center p-4 text-[var(--color-text-tertiary)] font-medium">Enterprise Platforms</th>
                  <th className="text-center p-4 text-[var(--color-accent)] font-medium">Rising Creators</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="p-4 text-[var(--color-text-primary)]">Find rising stars first</td>
                  <td className="p-4 text-center text-[var(--color-text-tertiary)]">❌ Same pool as everyone</td>
                  <td className="p-4 text-center text-green-500">✓ AI-discovered growth</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="p-4 text-[var(--color-text-primary)]">Personalized brand matching</td>
                  <td className="p-4 text-center text-[var(--color-text-tertiary)]">❌ Manual search/filter</td>
                  <td className="p-4 text-center text-green-500">✓ AI Brand Match Score</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="p-4 text-[var(--color-text-primary)]">Price</td>
                  <td className="p-4 text-center text-[var(--color-text-tertiary)]">$36,000+/year</td>
                  <td className="p-4 text-center text-green-500 font-semibold">$99/month</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="p-4 text-[var(--color-text-primary)]">Setup time</td>
                  <td className="p-4 text-center text-[var(--color-text-tertiary)]">6-8 weeks</td>
                  <td className="p-4 text-center text-green-500">5 minutes</td>
                </tr>
                <tr>
                  <td className="p-4 text-[var(--color-text-primary)]">Best for</td>
                  <td className="p-4 text-center text-[var(--color-text-tertiary)]">Fortune 500</td>
                  <td className="p-4 text-center text-green-500">Growing brands</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
            Everything You Need to Find & Partner with Creators
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4">
              <div className="text-2xl">🔍</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Smart Discovery</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Filter by niche, follower count, engagement rate, growth rate, and more.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Brand Match Score</h3>
                <p className="text-[var(--color-text-secondary)]">
                  AI-calculated compatibility score based on your brand's DNA.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Growth Analytics</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Track weekly/monthly growth rates to spot creators on the rise.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Brand Readiness Score</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Know which creators are partnership-ready with professional content.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="text-2xl">📋</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Watchlists</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Save and organize creators you're interested in partnering with.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="text-2xl">📧</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Direct Connect</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Unlock contact info and reach out to creators directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Creators Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-sm font-medium">
                For Creators
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                Get Discovered by Brands Looking for Rising Stars
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Join Rising Creators to get in front of brands actively seeking growing creators like you. 
                No more cold outreach — let brands come to you.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Get discovered by relevant brands
                </li>
                <li className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Showcase your growth metrics
                </li>
                <li className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Connect your YouTube, TikTok, Instagram
                </li>
                <li className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> 100% free for creators
                </li>
              </ul>
              <Link
                href="/sign-up"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Join as a Creator — Free
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-[var(--color-accent-light)] rounded-2xl p-8 border border-purple-500/20">
              <div className="text-center">
                <p className="text-5xl font-bold text-[var(--color-text-primary)] mb-2">10K+</p>
                <p className="text-[var(--color-text-secondary)] mb-6">followers to qualify</p>
                <div className="h-px bg-[var(--color-border)] my-6"></div>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  We focus on creators in the sweet spot — big enough to deliver results, 
                  small enough to be authentic and affordable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-[var(--color-bg-secondary)]" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12">
            Start free, upgrade when you're ready to connect.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Free</h3>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                $0<span className="text-lg font-normal text-[var(--color-text-tertiary)]">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Browse all creators
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> See stats & Brand Match
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> 3 free unlocks
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                  <span>✗</span> Creator names hidden
                </li>
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center py-3 rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-tertiary)]"
              >
                Get Started Free
              </Link>
            </div>

            {/* Starter Tier */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border-2 border-[var(--color-accent)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--color-accent)] text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Starter</h3>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                $99<span className="text-lg font-normal text-[var(--color-text-tertiary)]">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Full creator profiles
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> 25 unlocks/month
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Save 50 creators
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Contact info access
                </li>
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)]"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl p-6 border border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Pro</h3>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                $249<span className="text-lg font-normal text-[var(--color-text-tertiary)]">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Everything in Starter
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> 100 unlocks/month
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Unlimited saves
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500">✓</span> Export lists
                </li>
              </ul>
              <Link
                href="/sign-up"
                className="block w-full text-center py-3 rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-tertiary)]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
            Ready to Find Your Next Creator Partnership?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Join hundreds of brands discovering rising creators before their competitors.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-[var(--color-accent)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Get Started Free — No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                RC
              </div>
              <span className="text-xl font-bold text-[var(--color-accent)]">
                Rising Creators
              </span>
            </div>
            <div className="flex gap-8 text-sm text-[var(--color-text-secondary)]">
              <a href="#" className="hover:text-[var(--color-text-primary)]">Privacy</a>
              <a href="#" className="hover:text-[var(--color-text-primary)]">Terms</a>
              <a href="mailto:hello@risingcreators.com" className="hover:text-[var(--color-text-primary)]">Contact</a>
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              © 2025 Rising Creators. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
