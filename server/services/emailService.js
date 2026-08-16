import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

export async function sendPasswordResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: `VisionWise <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your VisionWise password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #0B0F14; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #475569; line-height: 1.6;">
          Someone asked to reset the password for this VisionWise account. If that was you, click below —
          this link expires in 30 minutes.
        </p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="background: #059669; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset password
          </a>
        </p>
        <p style="color: #94A3B8; font-size: 13px; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  })
}
