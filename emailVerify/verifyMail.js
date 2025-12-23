import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const verifyMail = async (token, email) => {
    try {
        const emailTemplateSource = fs.readFileSync(
            path.join(__dirname, "template.hbs"),
            "utf-8"
        );

        const template = handlebars.compile(emailTemplateSource);
        const htmlToSend = template({ token: encodeURIComponent(token) });

        // await sgMail.send({
        //     to: email,
        //     from: process.env.EMAIL_FROM,
        //     subject: "Email Verification",
        //     html: htmlToSend,
        // });

        await sgMail.send({
            to: email,
            from: {
                email: process.env.EMAIL_FROM,
                name: "Spiritual Journey Tracker"
            },
            replyTo: process.env.EMAIL_FROM,
            subject: "Verify your email to activate your account",
            html: htmlToSend,
        });


        console.log("✅ Verification email sent successfully");
    } catch (error) {
        console.error("❌ Verification email failed:", error.response?.body || error);
        throw new Error("Failed to send verification email");
    }
};
