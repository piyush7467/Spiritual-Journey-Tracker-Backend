import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpMail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for <b>10 minutes</b>.</p>
      `,
    });

    console.log("✅ OTP email sent successfully");
  } catch (error) {
    console.error("❌ OTP email failed:", error);
    throw new Error("Failed to send OTP email");
  }
};
