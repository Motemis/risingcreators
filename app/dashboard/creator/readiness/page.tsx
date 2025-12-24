import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReadinessPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Mock data
  const score = {
    total: 74,
    growth: 18,
    engagement: 16,
    consistency: 10,
    profile: 14,
    niche: 16,
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Brand Readiness</h1>
          <p className="text-gray-400 mt-1">
            See how ready you are for brand partnerships
          </p>
        </div>

        {/* Score */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">YOUR BRAND READINESS SCORE</h2>
          <div className="flex items-center gap-6">
            <div className="text-6xl font-bold text-white">{score.total}</div>
            <div>
              <div className="text-xl text-gray-300">/100</div>
              <div className="text-green-400 text-sm mt-1">Ready for brand deals</div>
            </div>
          </div>
          <div className="mt-4 bg-gray-700 rounded-full h-4">
            <div 
              className="bg-blue-500 h-4 rounded-full" 
              style={{ width: `${score.total}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Creators who hit 80+ get 2x more brand outreach
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">SCORE BREAKDOWN</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Growth Rate</span>
                <span className="text-white">{score.growth}/20</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(score.growth/20)*100}%` }} />
              </div>
              <p className="text-gray-500 text-sm mt-1">You're growing fast. Keep it up.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Engagement</span>
                <span className="text-white">{score.engagement}/20</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(score.engagement/20)*100}%` }} />
              </div>
              <p className="text-gray-500 text-sm mt-1">Above average for your size.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Consistency</span>
                <span className="text-white">{score.consistency}/20</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(score.consistency/20)*100}%` }} />
              </div>
              <p className="text-gray-500 text-sm mt-1">You've missed weeks recently. Brands want reliable.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Profile Completeness</span>
                <span className="text-white">{score.profile}/20</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(score.profile/20)*100}%` }} />
              </div>
              <p className="text-gray-500 text-sm mt-1">Add a rate card to complete your profile.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Niche Clarity</span>
                <span className="text-white">{score.niche}/20</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(score.niche/20)*100}%` }} />
              </div>
              <p className="text-gray-500 text-sm mt-1">Your content is clearly focused.</p>
            </div>
          </div>
        </div>

        {/* Top Opportunities */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">YOUR TOP OPPORTUNITIES</h2>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-medium">Add Your Rate Card</h3>
                <span className="text-green-400 text-sm">+4 points</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Brands filter for creators with rates. You're invisible to 60% of searches without one.
              </p>
              <Link 
                href="/dashboard/creator/profile"
                className="text-blue-400 text-sm mt-2 inline-block hover:text-blue-300"
              >
                Add rate card →
              </Link>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-medium">Post More Consistently</h3>
                <span className="text-green-400 text-sm">+6 points</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                You averaged 2.1 posts/week last month. Hit 3+/week to improve this score.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}