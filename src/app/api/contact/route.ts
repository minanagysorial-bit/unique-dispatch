import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, companyName, mcDotNumber, truckType, phone, email, message } = body;

    // Basic validation
    if (!fullName || !phone || !email || !mcDotNumber) {
      return NextResponse.json(
        { error: "Please fill in all required fields (Name, Phone, Email, MC#)." },
        { status: 400 }
      );
    }

    const recipients = ["uniquedispatchh@gmail.com", "marvengerges2008@gmail.com"];

    // Check if SMTP or Gmail App Password credentials exist
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background-color: #0f172a; color: #ffffff; padding: 20px 24px; border-bottom: 3px solid #ea580c;">
              <h2 style="margin: 0; font-size: 20px;">🚨 New Carrier Dispatch Application</h2>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Unique Dispatch Lead Desk</p>
            </div>
            
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b; width: 35%;">Full Name:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Company Name:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${companyName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">MC / DOT Number:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #ea580c;">${mcDotNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Equipment Type:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${truckType}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Phone Number:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;"><a href="tel:${phone}" style="color: #0284c7; text-decoration: none;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Email Address:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; color: #64748b; vertical-align: top;">Message / Target Lanes:</td>
                  <td style="padding: 10px; color: #334155; line-height: 1.5;">${message || "No additional message provided."}</td>
                </tr>
              </table>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
                <a href="tel:${phone.replace(/[^0-9+]/g, "")}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 14px;">Call Driver Now (${phone})</a>
              </div>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Unique Dispatch Leads" <${smtpUser}>`,
        to: recipients.join(", "),
        replyTo: email,
        subject: `🚚 New Carrier Dispatch Request: ${fullName} (${mcDotNumber}) - ${truckType}`,
        text: `New Carrier Application\n\nName: ${fullName}\nCompany: ${companyName}\nMC/DOT: ${mcDotNumber}\nEquipment: ${truckType}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`,
        html: htmlContent,
      });

      console.log("Email successfully dispatched to:", recipients.join(", "));
    } else {
      // If SMTP credentials are not yet set in environment, log lead details to server console
      console.log("⚠️ SMTP_USER / SMTP_PASS not set in environment. Form submission logged successfully:");
      console.log({ fullName, companyName, mcDotNumber, truckType, phone, email, message, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      message: "Your application has been received. Our dispatch desk will contact you within 15 minutes.",
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please call us directly." },
      { status: 500 }
    );
  }
}
