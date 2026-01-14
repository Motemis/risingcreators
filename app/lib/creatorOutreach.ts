import { supabase } from "./supabase";
import { sendCreatorEmail } from "./email";
import { parseCreatorContact } from "./parseCreatorContact";

interface TriggerOutreachParams {
  discoveredCreatorId?: string;
  creatorProfileId?: string;
  brandProfileId: string;
  action: "unlock" | "message" | "campaign_match" | "contacted";
  campaignId?: string;
  campaignName?: string;
  messagePreview?: string;
}

const ACTION_TO_TEMPLATE: Record<string, "interest_alert" | "direct_message" | "campaign_match" | "active_outreach"> = {
  unlock: "interest_alert",
  message: "direct_message",
  campaign_match: "campaign_match",
  contacted: "active_outreach",
};

export async function triggerCreatorOutreach(params: TriggerOutreachParams) {
  const {
    discoveredCreatorId,
    creatorProfileId,
    brandProfileId,
    action,
    campaignId,
    campaignName,
    messagePreview,
  } = params;

  // If creator has joined (has creator_profile), no outreach needed
  if (creatorProfileId) {
    // Check if they've actually joined
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id, user_id")
      .eq("id", creatorProfileId)
      .single();

    if (creatorProfile?.user_id) {
      // Creator has joined - no email needed
      return { sent: false, reason: "creator_joined" };
    }
  }

  if (!discoveredCreatorId) {
    return { sent: false, reason: "no_discovered_creator" };
  }

  // Get discovered creator
  const { data: discoveredCreator } = await supabase
    .from("discovered_creators")
    .select("*")
    .eq("id", discoveredCreatorId)
    .single();

  if (!discoveredCreator) {
    return { sent: false, reason: "creator_not_found" };
  }

  // Check if creator identity exists, create if not
  let creatorIdentityId = discoveredCreator.creator_identity_id;

  if (!creatorIdentityId) {
    // Parse contact info
    const contactInfo = parseCreatorContact(
      discoveredCreator.description || "",
      "youtube_description"
    );

    const bestEmail = contactInfo.emails.length > 0 ? contactInfo.emails[0] : null;

    // Create identity
    const { data: newIdentity } = await supabase
      .from("creator_identities")
      .insert({
        display_name: discoveredCreator.name || discoveredCreator.channel_title,
        profile_image_url: discoveredCreator.thumbnail_url,
        bio: discoveredCreator.description,
        contact_email: bestEmail?.email || null,
        contact_email_source: bestEmail?.source || null,
        contact_email_confidence: bestEmail?.confidence || 0,
        backup_emails: contactInfo.emails.slice(1).map((e) => e.email),
        hub_url: contactInfo.hubUrl,
        total_followers: discoveredCreator.subscriber_count || 0,
        primary_platform: discoveredCreator.platform || "youtube",
        primary_niche: discoveredCreator.primary_niche,
        status: "discovered",
      })
      .select()
      .single();

    if (newIdentity) {
      creatorIdentityId = newIdentity.id;

      // Link to discovered creator
      await supabase
        .from("discovered_creators")
        .update({ creator_identity_id: newIdentity.id })
        .eq("id", discoveredCreatorId);

      // Create platform account
      await supabase.from("creator_platform_accounts").insert({
        creator_identity_id: newIdentity.id,
        platform: discoveredCreator.platform || "youtube",
        platform_id: discoveredCreator.platform_id,
        platform_username: discoveredCreator.channel_title,
        platform_url: discoveredCreator.channel_url,
        followers: discoveredCreator.subscriber_count,
        profile_image_url: discoveredCreator.thumbnail_url,
        bio: discoveredCreator.description,
        email_found: bestEmail?.email,
        discovered_creator_id: discoveredCreatorId,
        match_method: "direct_discovery",
      });
    }
  }

  // Get creator identity with contact info
  const { data: creatorIdentity } = await supabase
    .from("creator_identities")
    .select("*")
    .eq("id", creatorIdentityId)
    .single();

  if (!creatorIdentity) {
    return { sent: false, reason: "identity_creation_failed" };
  }

  // Check if creator has already joined
  if (creatorIdentity.creator_profile_id) {
    return { sent: false, reason: "creator_joined" };
  }

  // Check if we have an email
  if (!creatorIdentity.contact_email) {
    return { sent: false, reason: "no_email", needsManualOutreach: true };
  }

  // Get brand info
  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("company_name, logo_url")
    .eq("id", brandProfileId)
    .single();

  // Send email
  const templateType = ACTION_TO_TEMPLATE[action];
  const emailResult = await sendCreatorEmail({
    to: creatorIdentity.contact_email,
    creatorName: creatorIdentity.display_name || "Creator",
    templateType,
    brandName: brandProfile?.company_name || undefined,
    brandLogo: brandProfile?.logo_url || undefined,
    campaignName: campaignName || undefined,
    messagePreview: messagePreview || undefined,
  });

  // Log the outreach
  await supabase.from("creator_outreach_emails").insert({
    creator_identity_id: creatorIdentityId,
    discovered_creator_id: discoveredCreatorId,
    email_sent_to: creatorIdentity.contact_email,
    template_type: templateType,
    triggered_by_brand_id: brandProfileId,
    triggered_by_campaign_id: campaignId || null,
    triggered_by_action: action,
    resend_email_id: emailResult.success ? (emailResult.emailId as string) : null,
    status: emailResult.success ? "sent" : "failed",
  });

  return {
    sent: emailResult.success,
    emailId: emailResult.emailId,
    sentTo: creatorIdentity.contact_email,
    templateType,
  };
}
