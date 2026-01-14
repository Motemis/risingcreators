import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { sendCreatorInviteEmail } from "@/lib/email";
import { parseCreatorContact, fetchHubPageLinks } from "@/lib/parseCreatorContact";

// POST - Create invite and send email
export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Only brands can send invites" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    discovered_creator_id,
    message,
    conversation_title,
    campaign_id,
  } = body;

  if (!discovered_creator_id) {
    return NextResponse.json({ error: "discovered_creator_id required" }, { status: 400 });
  }

  // Get the discovered creator
  const { data: discoveredCreator } = await supabase
    .from("discovered_creators")
    .select("*")
    .eq("id", discovered_creator_id)
    .single();

  if (!discoveredCreator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Check if creator identity already exists
  let { data: creatorIdentity } = await supabase
    .from("creator_identities")
    .select("*")
    .eq("id", discoveredCreator.creator_identity_id)
    .single();

  // If no identity exists, create one and try to find contact info
  if (!creatorIdentity) {
    // Parse contact info from available data
    const descriptionContact = parseCreatorContact(
      discoveredCreator.description || '',
      'youtube_description'
    );

    // Try to find more info if we have a hub URL
    let hubContact = { emails: [], socialLinks: {} };
    if (descriptionContact.hubUrl) {
      hubContact = await fetchHubPageLinks(descriptionContact.hubUrl);
    }

    // Merge contact info (prefer description for emails)
    const allEmails = [...descriptionContact.emails, ...hubContact.emails];
    const bestEmail = allEmails.length > 0 ? allEmails[0] : null;

    // Create identity
    const { data: newIdentity, error: identityError } = await supabase
      .from("creator_identities")
      .insert({
        display_name: discoveredCreator.name || discoveredCreator.channel_title,
        profile_image_url: discoveredCreator.thumbnail_url,
        bio: discoveredCreator.description,
        contact_email: bestEmail?.email || null,
        contact_email_source: bestEmail?.source || null,
        contact_email_confidence: bestEmail?.confidence || 0,
        backup_emails: allEmails.slice(1).map(e => e.email),
        hub_url: descriptionContact.hubUrl || hubContact.hubUrl,
        total_followers: discoveredCreator.subscriber_count || 0,
        primary_platform: discoveredCreator.platform || 'youtube',
        primary_niche: discoveredCreator.primary_niche,
        status: 'discovered',
      })
      .select()
      .single();

    if (identityError) {
      console.error("Error creating identity:", identityError);
      return NextResponse.json({ error: "Failed to create identity" }, { status: 500 });
    }

    creatorIdentity = newIdentity;

    // Link discovered creator to identity
    await supabase
      .from("discovered_creators")
      .update({ creator_identity_id: newIdentity.id })
      .eq("id", discovered_creator_id);

    // Create platform account record
    await supabase
      .from("creator_platform_accounts")
      .insert({
        creator_identity_id: newIdentity.id,
        platform: discoveredCreator.platform || 'youtube',
        platform_id: discoveredCreator.platform_id,
        platform_username: discoveredCreator.channel_title,
        platform_url: discoveredCreator.channel_url,
        followers: discoveredCreator.subscriber_count,
        profile_image_url: discoveredCreator.thumbnail_url,
        bio: discoveredCreator.description,
        email_found: bestEmail?.email,
        discovered_creator_id: discovered_creator_id,
        match_method: 'direct_discovery',
      });
  }

  // Check if creator has already joined
  if (creatorIdentity.creator_profile_id) {
    return NextResponse.json({
      error: "Creator has already joined. Use normal messaging instead.",
      creator_profile_id: creatorIdentity.creator_profile_id,
    }, { status: 400 });
  }

  // Check for existing invite from this brand
  const { data: existingInvite } = await supabase
    .from("creator_invites")
    .select("*")
    .eq("brand_profile_id", brandProfile.id)
    .eq("creator_identity_id", creatorIdentity.id)
    .single();

  if (existingInvite) {
    return NextResponse.json({
      error: "You've already sent an invite to this creator",
      invite: existingInvite,
    }, { status: 400 });
  }

  // Create the invite
  const { data: invite, error: inviteError } = await supabase
    .from("creator_invites")
    .insert({
      brand_profile_id: brandProfile.id,
      creator_identity_id: creatorIdentity.id,
      queued_message: message || null,
      queued_conversation_title: conversation_title || 'Partnership Opportunity',
      queued_campaign_id: campaign_id || null,
      status: 'pending',
    })
    .select()
    .single();

  if (inviteError) {
    console.error("Error creating invite:", inviteError);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  // Track invite creation
  await supabase.from("invite_events").insert({
    invite_id: invite.id,
    event_type: 'created',
    event_data: {
      brand_name: brandProfile.company_name,
      creator_name: creatorIdentity.display_name,
      has_message: !!message,
      has_campaign: !!campaign_id,
    },
  });

  // Try to send email if we have contact info
  let emailSent = false;
  let emailError = null;

  if (creatorIdentity.contact_email && creatorIdentity.contact_email_confidence >= 0.5) {
    try {
      // Get campaign name if applicable
      let campaignName = null;
      if (campaign_id) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("name")
          .eq("id", campaign_id)
          .single();
        campaignName = campaign?.name;
      }

      const emailResult = await sendCreatorInviteEmail({
        to: creatorIdentity.contact_email,
        creatorName: creatorIdentity.display_name || 'Creator',
        brandName: brandProfile.company_name || 'A brand',
        inviteToken: invite.invite_token,
        hasQueuedMessage: !!message,
        campaignName,
      });

      // Update invite with email info
      await supabase
        .from("creator_invites")
        .update({
          status: 'email_sent',
          invite_email_sent_to: creatorIdentity.contact_email,
          invite_email_sent_at: new Date().toISOString(),
          invite_email_id: emailResult?.id,
        })
        .eq("id", invite.id);

      // Track email sent
      await supabase.from("invite_events").insert({
        invite_id: invite.id,
        event_type: 'email_sent',
        event_data: {
          email: creatorIdentity.contact_email,
          email_id: emailResult?.id,
        },
      });

      emailSent = true;

      // Update identity status
      await supabase
        .from("creator_identities")
        .update({ status: 'invited' })
        .eq("id", creatorIdentity.id);

    } catch (error) {
      console.error("Error sending invite email:", error);
      emailError = error;

      // Update invite status
      await supabase
        .from("creator_invites")
        .update({ status: 'email_failed' })
        .eq("id", invite.id);

      // Track failure
      await supabase.from("invite_events").insert({
        invite_id: invite.id,
        event_type: 'email_failed',
        event_data: { error: String(error) },
      });
    }
  }

  // Add to watchlist
  await supabase.from("watchlist_items").upsert({
    brand_profile_id: brandProfile.id,
    discovered_creator_id: discovered_creator_id,
    source: 'direct_outreach',
    status: 'reached_out',
    is_unlocked: true,
  }, {
    onConflict: 'brand_profile_id,discovered_creator_id',
  });

  return NextResponse.json({
    invite,
    email_sent: emailSent,
    email_error: emailError ? String(emailError) : null,
    contact_email: creatorIdentity.contact_email,
    contact_confidence: creatorIdentity.contact_email_confidence,
    message: emailSent
      ? `Invite sent to ${creatorIdentity.contact_email}`
      : creatorIdentity.contact_email
        ? `Email failed to send. Creator has been added to your watchlist.`
        : `No contact email found. Creator has been added to your watchlist for manual follow-up.`,
  });
}

// GET - List invites for brand
export async function GET(request: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Only brands can view invites" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const { data: invites } = await supabase
    .from("creator_invites")
    .select(`
      *,
      creator_identity:creator_identities(
        id,
        display_name,
        profile_image_url,
        contact_email,
        total_followers,
        primary_platform,
        status
      ),
      campaign:campaigns(
        id,
        name
      )
    `)
    .eq("brand_profile_id", brandProfile.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ invites });
}
