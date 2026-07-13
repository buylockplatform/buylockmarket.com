import dotenv from "dotenv";
import path from "path";
import nodemailer from "nodemailer";

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Using SMTP settings:");
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Port: ${process.env.SMTP_PORT}`);
console.log(`Secure: ${process.env.SMTP_SECURE}`);
console.log(`User: ${process.env.SMTP_USER}`);
console.log(`Password length: ${process.env.SMTP_PASS?.length || 0}`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.titan.email',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || 'hello@buylockmarket.com',
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  const recipient = "joemaina180@gmail.com";
  console.log(`Attempting to send test email to ${recipient}...`);
  
  try {
    // Test connection
    await transporter.verify();
    console.log("✅ SMTP Connection verified successfully!");

    // Send email
    const info = await transporter.sendMail({
      from: `"BuyLock Marketplace" <${process.env.SMTP_USER || 'hello@buylockmarket.com'}>`,
      to: recipient,
      subject: "🔑 BuyLock Forgot Password - SMTP Test Connection",
      text: "Hello! This is a test email from BuyLock to confirm that the new Titan Mail SMTP connection is working perfectly for your password resets. Cheers!",
      html: `
        <h2>BuyLock SMTP Connection Test</h2>
        <p>Hello!</p>
        <p>This is a test email from BuyLock to confirm that the new Titan Mail SMTP connection is working perfectly for your password resets.</p>
        <br/>
        <p>Cheers,</p>
        <p>BuyLock Engineering</p>
      `
    });

    console.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error("❌ Email transmission failed:");
    console.error(error);
  }
}

main().catch(console.error);
