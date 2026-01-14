import { NextResponse } from "next/server";
import { sendCreatorEmail } from "@/lib/email";

// Simple test endpoint to verify email is working
// GET /api/test-email?to=your@email.com
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "Missing 'to' parameter. Use ?to=your@email.com" },
      { status: 400 }
    );
  }

  // Send a test email using the interest_alert template
  const result = await sendCreatorEmail({
    to,
    creatorName: "Test Creator",
    templateType: "interest_alert",
    brandName: "Test Brand Co",
    interestedBrandsCount: 3,
  });

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}!`,
      emailId: result.emailId,
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email",
        details: result.error,
      },
      { status: 500 }
    );
  }
}
