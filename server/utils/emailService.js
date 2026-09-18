// server/utils/emailService.js
// Nodemailer SMTP integration with graceful fallback logger for local & preview environments

import nodemailer from 'nodemailer';

let transporter = null;
const sentEmailLogs = [];

/**
 * Lazy initialization of Nodemailer SMTP transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      console.log(`[Email] Nodemailer SMTP initialized with host: ${host}:${port}`);
    } catch (err) {
      console.warn('[Email] Failed to initialize SMTP transporter, falling back to simulated logger:', err.message);
      transporter = null;
    }
  } else {
    // Graceful fallback for environments without live SMTP credentials
    transporter = null;
  }

  return transporter;
}

/**
 * Send an email using configured SMTP or fallback simulated logger
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || '"RoadDrive Academy" <notifications@roaddrive.com>';

  const mailOptions = {
    from,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''),
    html,
  };

  const logEntry = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    subject,
    from,
    timestamp: new Date().toISOString(),
    previewText: text || subject,
  };

  sentEmailLogs.unshift(logEntry);
  if (sentEmailLogs.length > 50) sentEmailLogs.pop();

  if (mailer) {
    try {
      const info = await mailer.sendMail(mailOptions);
      console.log(`[Email] Successfully sent email to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, mode: 'smtp' };
    } catch (err) {
      console.error(`[Email] Error sending email via SMTP to ${to}:`, err.message);
      console.log(`[Email Fallback Simulated] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true, error: err.message, mode: 'fallback' };
    }
  } else {
    // Development / Preview mode output
    console.log(`--------------------------------------------------`);
    console.log(`[EMAIL DISPATCH] To: ${to}`);
    console.log(`[EMAIL DISPATCH] Subject: ${subject}`);
    console.log(`[EMAIL DISPATCH] Timestamp: ${logEntry.timestamp}`);
    console.log(`--------------------------------------------------`);
    return { success: true, simulated: true, mode: 'simulated' };
  }
}

/**
 * 1. Send Course Enrollment Email
 */
export async function sendCourseEnrollmentEmail({ to, studentName, courseName, price, paymentId, isPaid = false }) {
  const subject = `🎓 Enrollment Confirmed: ${courseName} - RoadDrive Academy`;
  const paymentText = isPaid
    ? `Paid Tuition: ₹${price} (Razorpay ID: ${paymentId || 'N/A'})`
    : `Free Tuition: ₹0 (Complimentary Orientation)`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #132a4a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
          .body { padding: 32px 24px; }
          .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .label { color: #64748b; font-weight: 500; }
          .val { color: #0f172a; font-weight: 600; }
          .cta-btn { display: inline-block; background: #132a4a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin-top: 20px; }
          .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RoadDrive Academy</h1>
          </div>
          <div class="body">
            <span class="badge">Official Enrollment Confirmation</span>
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Welcome aboard, ${studentName || 'Student'}!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
              You have successfully enrolled in <strong>${courseName}</strong>. Your curriculum modules and progress checklist are now accessible from your student dashboard.
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Course Title:</span>
                <span class="val">${courseName}</span>
              </div>
              <div class="row">
                <span class="label">Payment Type:</span>
                <span class="val">${isPaid ? 'Razorpay Verified' : 'Direct Free Enrollment'}</span>
              </div>
              <div class="row">
                <span class="label">Tuition Paid:</span>
                <span class="val">₹${price}</span>
              </div>
              ${paymentId ? `
              <div class="row">
                <span class="label">Razorpay Reference:</span>
                <span class="val" style="font-family: monospace;">${paymentId}</span>
              </div>` : ''}
              <div class="row" style="margin-bottom: 0;">
                <span class="label">Enrollment Date:</span>
                <span class="val">${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.5;">
              Next step: Log into your student portal to review the theory modules and book practical 1-on-1 sessions with an instructor.
            </p>

            <div style="text-align: center;">
              <a href="/student-dashboard" class="cta-btn">Access Student Dashboard &rarr;</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} RoadDrive Driving Academy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html, text: `Hello ${studentName}, you are enrolled in ${courseName}. ${paymentText}. Access your student portal to begin.` });
}

/**
 * 2. Send Booking Confirmation Email (to Student & Instructor)
 */
export async function sendBookingConfirmationEmail({ to, studentName, instructorName, instructorEmail, date, time, notes }) {
  const subject = `🚗 Driving Session Booked: ${date} at ${time} with ${instructorName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #132a4a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
          .body { padding: 32px 24px; }
          .badge { display: inline-block; padding: 4px 10px; background: #dcfce7; color: #15803d; border-radius: 4px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .label { color: #64748b; font-weight: 500; }
          .val { color: #0f172a; font-weight: 600; }
          .tips { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-top: 20px; font-size: 13px; color: #1e40af; }
          .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RoadDrive Academy</h1>
          </div>
          <div class="body">
            <span class="badge">Session Confirmed</span>
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Your driving lesson is booked!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
              Hi ${studentName || 'Student'}, your 1-on-1 practical driving lesson with <strong>${instructorName}</strong> has been registered.
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Date:</span>
                <span class="val">${date}</span>
              </div>
              <div class="row">
                <span class="label">Time:</span>
                <span class="val">${time}</span>
              </div>
              <div class="row">
                <span class="label">Certified Instructor:</span>
                <span class="val">${instructorName}</span>
              </div>
              ${notes ? `
              <div class="row" style="margin-bottom: 0;">
                <span class="label">Focus Notes:</span>
                <span class="val">${notes}</span>
              </div>` : ''}
            </div>

            <div class="tips">
              <strong>Checklist for your session:</strong>
              <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                <li>Please have your valid provisional driver permit ready.</li>
                <li>Wear comfortable flat-soled shoes with firm grip.</li>
                <li>Bring corrective prescription eyeglasses/lenses if required.</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} RoadDrive Driving Academy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to student
  const studentResult = await sendEmail({
    to,
    subject,
    html,
    text: `Your driving lesson with ${instructorName} is booked for ${date} at ${time}. Notes: ${notes || 'None'}.`,
  });

  // Also notify instructor if email available
  if (instructorEmail && instructorEmail !== to) {
    const instSubject = `📅 New Driving Lesson Booking: ${studentName} on ${date} at ${time}`;
    const instHtml = `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #132a4a; margin-top: 0;">New Lesson Request Received</h2>
        <p>A student has booked a behind-the-wheel lesson with you on RoadDrive Academy:</p>
        <ul>
          <li><strong>Student:</strong> ${studentName} (${to})</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Student Notes:</strong> ${notes || 'Standard practical lesson'}</li>
        </ul>
        <p>Please log in to your Instructor Dashboard to confirm or manage this appointment.</p>
      </div>
    `;
    await sendEmail({
      to: instructorEmail,
      subject: instSubject,
      html: instHtml,
      text: `New lesson booking from ${studentName} for ${date} at ${time}. Notes: ${notes || 'None'}.`,
    });
  }

  return studentResult;
}

/**
 * 3. Send Password Reset Email
 */
export async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 60 }) {
  const subject = `🔒 Reset Your Password - RoadDrive Academy`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #132a4a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
          .body { padding: 32px 24px; }
          .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #b45309; border-radius: 4px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
          .cta-btn { display: inline-block; background: #132a4a; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 20px 0; }
          .note { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 16px; }
          .link-box { word-break: break-all; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; font-size: 12px; color: #0284c7; }
          .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RoadDrive Academy</h1>
          </div>
          <div class="body">
            <span class="badge">Password Reset Request</span>
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Hello ${name || 'User'},</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
              We received a request to reset the password for your RoadDrive Academy account. Click the button below to establish a new password:
            </p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-btn">Reset Account Password</a>
            </div>

            <p class="note">
              <strong>Security Note:</strong> This password reset link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, you can safely disregard this message; your password will remain unchanged.
            </p>

            <p class="note">If the button above does not work, copy and paste this link into your browser:</p>
            <div class="link-box">${resetUrl}</div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} RoadDrive Driving Academy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name}, reset your RoadDrive Academy password here: ${resetUrl}. This link expires in ${expiresInMinutes} minutes. If you did not request this, ignore this email.`,
  });
}

/**
 * Get in-memory sent email logs (useful for preview/debug verification)
 */
export function getSentEmailLogs() {
  return sentEmailLogs;
}
