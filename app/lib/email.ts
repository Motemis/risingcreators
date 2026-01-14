import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://risingcreators.vercel.app";
// Use Resend's test sender until domain is verified
// This only allows sending to YOUR verified email (the one you signed up with)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Rising Creators <onboarding@resend.dev>";

type TemplateType = "interest_alert" | "direct_message" | "campaign_match" | "active_outreach";

interface SendCreatorEmailParams {
  to: string;
  creatorName: string;
  templateType: TemplateType;
  brandName?: string;
  brandLogo?: string;
  campaignName?: string;
  messagePreview?: string;
  inviteToken?: string;
  interestedBrandsCount?: number;
}

const TEMPLATES: Record<TemplateType, {
  subject: (params: SendCreatorEmailParams) => string;
  headline: (params: SendCreatorEmailParams) => string;
  body: (params: SendCreatorEmailParams) => string;
  cta: string;
  urgency: "low" | "medium" | "high" | "critical";
}> = {
  interest_alert: {
    subject: (p) => `${p.interestedBrandsCount || 1} brand${(p.interestedBrandsCount || 1) > 1 ? "s" : ""} discovered your content`,
    headline: (p) => "Brands are already interested in you! 👀",
    body: (p) => `
      <p>Great news, ${p.creatorName.split(" ")[0]}!</p>
      <p><strong>${p.brandName || "A brand"}</strong> just discovered your content and wants to learn more about working with you.</p>
      <p>Rising Creators is a platform where brands find and partner with creators like you. And guess what? <strong>It's already working for you</strong> - brands are finding your profile right now.</p>
      <p>Join to see which brands are interested and start earning from partnerships.</p>
    `,
    cta: "See Who's Interested →",
    urgency: "low",
  },
  direct_message: {
    subject: (p) => `${p.brandName || "A brand"} sent you a message`,
    headline: (p) => "You've got a message waiting! 💬",
    body: (p) => `
      <p>Hey ${p.creatorName.split(" ")[0]}!</p>
      <p><strong>${p.brandName || "A brand"}</strong> just sent you a direct message on Rising Creators.</p>
      ${p.messagePreview ? `
        <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-style: italic; color: #374151;">"${p.messagePreview.slice(0, 150)}${p.messagePreview.length > 150 ? "..." : ""}"</p>
        </div>
      ` : ""}
      <p>They're interested in working with you and took the time to reach out personally. Don't leave them waiting!</p>
    `,
    cta: "Read Your Message →",
    urgency: "medium",
  },
  campaign_match: {
    subject: (p) => `You've been matched to "${p.campaignName || "a paid campaign"}"`,
    headline: (p) => "You're a match for a paid campaign! 🎯",
    body: (p) => `
      <p>Exciting news, ${p.creatorName.split(" ")[0]}!</p>
      <p><strong>${p.brandName || "A brand"}</strong> is running a campaign called <strong>"${p.campaignName || "a new campaign"}"</strong> and your profile is a match!</p>
      <p>This means your content style, audience, and niche align with exactly what they're looking for. Campaigns like this are how creators earn real money from their content.</p>
      <p>Join now to view the campaign details and express your interest before other creators do.</p>
    `,
    cta: "View Campaign Details →",
    urgency: "high",
  },
  active_outreach: {
    subject: (p) => `🔥 ${p.brandName || "A brand"} wants to work with you NOW`,
    headline: (p) => "A brand is ready to work with you! 🔥",
    body: (p) => `
      <p>${p.creatorName.split(" ")[0]}, this is time-sensitive!</p>
      <p><strong>${p.brandName || "A brand"}</strong> has moved you to their active outreach list${p.campaignName ? ` for "${p.campaignName}"` : ""}. This means they're ready to discuss a paid partnership with you.</p>
      <p>Brands typically reach out to multiple creators at this stage - the first to respond often gets the deal.</p>
      <p><strong>Don't miss this opportunity.</strong></p>
    `,
    cta: "Respond Now →",
    urgency: "critical",
  },
};

// Specific invite email for discovered creators
interface SendCreatorInviteEmailParams {
  to: string;
  creatorName: string;
  brandName: string;
  inviteToken: string;
  hasQueuedMessage?: boolean;
  campaignName?: string;
}

export async function sendCreatorInviteEmail(params: SendCreatorInviteEmailParams) {
  const inviteUrl = `${APP_URL}/invite/${params.inviteToken}`;
  
  const subject = params.campaignName 
    ? `${params.brandName} wants you for "${params.campaignName}"`
    : `${params.brandName} wants to work with you!`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      ${params.brandName} wants to partner with you! 🎉
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; font-size: 16px; color: #374151; line-height: 1.6;">
                    <p>Hey ${params.creatorName.split(" ")[0]}!</p>
                    
                    <p><strong>${params.brandName}</strong> discovered your content and wants to connect with you on Rising Creators.</p>
                    
                    ${params.campaignName ? `
                      <div style="background-color: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; font-weight: 600; color: #111827;">Campaign: ${params.campaignName}</p>
                      </div>
                    ` : ''}
                    
                    ${params.hasQueuedMessage ? `
                      <p>They've already written you a message that's waiting for you inside. 💬</p>
                    ` : ''}
                    
                    <p>Rising Creators is a platform where brands discover and partner with content creators like you. Join now to:</p>
                    
                    <ul style="padding-left: 20px;">
                      <li>Connect with ${params.brandName} and other interested brands</li>
                      <li>Set your rates and get paid what you're worth</li>
                      <li>Manage all your brand partnerships in one place</li>
                    </ul>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 18px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                        View Invitation →
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">This invitation was sent by ${params.brandName} through Rising Creators. It's 100% free for creators.</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
                      You're receiving this because ${params.brandName} found your content and wants to work with you.<br>
                      <a href="${APP_URL}/unsubscribe" style="color: #6366f1;">Unsubscribe</a> from future emails.
                    </p>
                    <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                      © ${new Date().getFullYear()} Rising Creators. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.to],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending invite email:", error);
      throw error;
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send invite email:", error);
    throw error;
  }
}

export async function sendCreatorEmail(params: SendCreatorEmailParams) {
  const template = TEMPLATES[params.templateType];
  const inviteUrl = `${APP_URL}/join${params.inviteToken ? `?ref=${params.inviteToken}` : ""}`;

  const urgencyColors = {
    low: { bg: "#6366f1", accent: "#818cf8" },
    medium: { bg: "#6366f1", accent: "#818cf8" },
    high: { bg: "#f59e0b", accent: "#fbbf24" },
    critical: { bg: "#ef4444", accent: "#f87171" },
  };

  const colors = urgencyColors[template.urgency];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject(params)}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%); padding: 40px 40px 30px; text-align: center;">
                    ${params.brandLogo ? `
                      <img src="${params.brandLogo}" alt="${params.brandName}" style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 16px; border: 3px solid rgba(255,255,255,0.3);">
                    ` : ""}
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      ${template.headline(params)}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px; font-size: 16px; color: #374151; line-height: 1.6;">
                    ${template.body(params)}
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 18px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                        ${template.cta}
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Benefits -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px;">
                      <p style="margin: 0 0 16px; font-weight: 600; color: #111827;">Why join Rising Creators?</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
                            <span style="color: #10b981; margin-right: 8px;">✓</span>
                            Get discovered by brands actively looking for creators
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
                            <span style="color: #10b981; margin-right: 8px;">✓</span>
                            Set your rates and get paid what you're worth
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
                            <span style="color: #10b981; margin-right: 8px;">✓</span>
                            Manage all your brand deals in one place
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
                            <span style="color: #10b981; margin-right: 8px;">✓</span>
                            100% free for creators - always
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6;">
                      You're receiving this because brands discovered your content on Rising Creators.<br>
                      <a href="${APP_URL}/unsubscribe" style="color: #6366f1;">Unsubscribe</a> from future emails.
                    </p>
                    <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                      © ${new Date().getFullYear()} Rising Creators. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.to],
      subject: template.subject(params),
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
