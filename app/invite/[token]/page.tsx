import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Get invite
  const { data: invite } = await supabase
    .from("creator_invites")
    .select(`
      *,
      brand_profile:brand_profiles(
        id,
        company_name,
        logo_url,
        industry
      ),
      creator_identity:creator_identities(
        id,
        display_name,
        profile_image_url
      ),
      campaign:campaigns(
        id,
        name,
        brief
      )
    `)
    .eq("invite_token", token)
    .single();

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invite Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            This invite may have expired or been used already.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invite Expired
          </h1>
          <p className="text-gray-600 mb-6">
            This invite has expired. Contact {invite.brand_profile?.company_name || 'the brand'} for a new one.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Track click
  await supabase
    .from("creator_invites")
    .update({
      status: invite.status === 'email_sent' ? 'clicked' : invite.status,
      invite_link_clicked_at: invite.invite_link_clicked_at || new Date().toISOString(),
    })
    .eq("id", invite.id);

  await supabase.from("invite_events").insert({
    invite_id: invite.id,
    event_type: 'link_clicked',
  });

  const brandName = invite.brand_profile?.company_name || 'A brand';
  const creatorName = invite.creator_identity?.display_name || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Brand Logo */}
        <div className="text-center mb-6">
          {invite.brand_profile?.logo_url ? (
            <img
              src={invite.brand_profile.logo_url}
              alt={brandName}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏢</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {brandName} wants to partner with you!
          </h1>
        </div>

        {/* Campaign Info */}
        {invite.campaign && (
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-indigo-600 font-medium mb-1">Campaign</p>
            <p className="text-lg font-semibold text-gray-900">{invite.campaign.name}</p>
            {invite.campaign.brief && (
              <p className="text-sm text-gray-600 mt-2">{invite.campaign.brief}</p>
            )}
          </div>
        )}

        {/* Message Preview */}
        {invite.queued_message && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Message from {brandName}:</p>
            <p className="text-gray-700 italic">"{invite.queued_message.slice(0, 150)}..."</p>
            <p className="text-sm text-indigo-600 mt-2">Join to read the full message →</p>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Join Rising Creators to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Connect with {brandName} and other brands
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Set your rates and showcase your work
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Get discovered by more brands
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Manage all partnerships in one place
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={`/sign-up?invite=${token}`}
            className="block w-full text-center bg-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Join & Connect with {brandName}
          </Link>
          <Link
            href={`/sign-in?invite=${token}`}
            className="block w-full text-center text-indigo-600 hover:underline text-sm"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          By joining, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
