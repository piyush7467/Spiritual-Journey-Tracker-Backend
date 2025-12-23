import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOtpMail = async (email, otp) => {
    try {
        // await sgMail.send({
        //     to: email,
        //     from: process.env.EMAIL_FROM,
        //     subject: "Password Reset OTP",
        //     html: `
        //         <p>Your OTP for password reset is:</p>
        //         <h2>${otp}</h2>
        //         <p>This OTP is valid for <b>10 minutes</b>.</p>
        //     `,
        // });


        await sgMail.send({
            to: email,
            from: {
                email: process.env.EMAIL_FROM,
                name: "Spiritual Journey Tracker"
            },
            replyTo: process.env.EMAIL_FROM,
            subject: "Your password reset code (valid for 10 minutes)",
            html: `
        <p>🙏Sat Saheb 🙏 ,</p>
        <p>You requested a password reset.</p>
        <p>Your one-time code is:</p>
        <h2>${otp}</h2>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>— Spiritual Journey Tracker Team</p>
    `,
        });


        console.log("✅ OTP email sent successfully");
    } catch (error) {
        console.error("❌ OTP email failed:", error.response?.body || error);
        throw new Error("Failed to send OTP email");
    }
};
