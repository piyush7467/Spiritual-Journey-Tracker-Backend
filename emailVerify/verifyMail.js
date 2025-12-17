import { Resend } from "resend";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export const verifyMail = async (token, email) => {
  try {
    // Read email template
    const emailTemplateSource = fs.readFileSync(
      path.join(__dirname, "template.hbs"),
      "utf-8"
    );

    const template = handlebars.compile(emailTemplateSource);
    const htmlToSend = template({
      token: encodeURIComponent(token),
    });

    // Send email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM, // e.g. no-reply@yourdomain.com
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    });

    console.log("✅ Verification email sent successfully");
  } catch (error) {
    console.error("❌ Verification email failed:", error);
    throw new Error("Failed to send verification email");
  }
};
