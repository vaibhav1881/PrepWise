import nodemailer from "nodemailer"

interface SendEmailParams {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS

const transporter = emailUser && emailPass
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null

export async function sendEmail({ to, subject, text, html }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!transporter) {
    const errorMsg = "Mailer not configured: EMAIL_USER and EMAIL_PASS environment variables are required"
    console.error(`[mailer] ${errorMsg}`)
    console.log(`[DEV MAIL] To: ${to}\nSubject: ${subject}\nText: ${text || ""}\nHTML: ${html || ""}`)
    return { success: false, error: errorMsg }
  }

  try {
    const from = `Notifications <${emailUser}>`
    console.log(`[mailer] Sending email to ${to} with subject: ${subject}`)
    
    const info = await transporter.sendMail({ from, to, subject, text, html })
    console.log(`[mailer] Email sent successfully. MessageId: ${info.messageId}`)
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[mailer] Failed to send email:`, { to, subject, error: errorMsg })
    return { success: false, error: errorMsg }
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code will expire in 10 minutes.</p>
      <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: "Verify Your Email",
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html,
  })
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested to reset your password. Use the code below to proceed:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code will expire in 10 minutes.</p>
      <p style="color: #666;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: "Password Reset Code",
    text: `Your password reset code is: ${code}. This code will expire in 10 minutes.`,
    html,
  })
}
