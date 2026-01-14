import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const user = await currentUser();

  // If user is already logged in, redirect appropriately
  if (user) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (dbUser?.user_type === "creator") {
      redirect("/dashboard/creator");
    } else if (dbUser?.user_type === "brand") {
      redirect("/dashboard/brand");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Brands are actively looking for creators like you
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Turn Your Content Into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Paid Partnerships
            </span>
          </h1>
          
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Rising Creators connects you with brands looking for authentic voices. 
            Get discovered, set your rates, and land deals — all for free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/sign-up${ref ? `?ref=${ref}` : ""}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Join as a Creator
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href={`/sign-in${ref ? `?ref=${ref}` : ""}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-white/70 text-sm">Active Brands</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-white">$2M+</p>
            <p className="text-white/70 text-sm">Campaign Budgets</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-white">10K+</p>
            <p className="text-white/70 text-sm">Creators</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-white">100%</p>
            <p className="text-white/70 text-sm">Free for Creators</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Profile</h3>
              <p className="text-gray-600">
                Connect your social accounts, set your rates, and showcase your best work.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Discovered</h3>
              <p className="text-gray-600">
                Brands search for creators like you. Get matched to campaigns that fit your niche.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Land Deals</h3>
              <p className="text-gray-600">
                Connect directly with brands, negotiate your rates, and get paid for your content.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">No Cold Outreach</h3>
                <p className="text-white/70 text-sm">Brands come to you. We match you with campaigns that fit your content style.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Set Your Own Rates</h3>
                <p className="text-white/70 text-sm">You decide what you're worth. No middleman taking a cut.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">See Who's Watching</h3>
                <p className="text-white/70 text-sm">Know which brands are interested in you before they reach out.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Free Forever</h3>
                <p className="text-white/70 text-sm">We only charge brands. Creators use Rising Creators 100% free.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Link
            href={`/sign-up${ref ? `?ref=${ref}` : ""}`}
            className="inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started — It's Free
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-white/60 text-sm mt-4">
            Join 10,000+ creators already on the platform
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Rising Creators. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
