const nodemailer = require("nodemailer");

const SMTP_HOST        = process.env.SMTP_HOST         || "mail.avirtrekkers.com";
const SMTP_PORT        = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER        = process.env.SMTP_USER         || "no-reply@avirtrekkers.com";
const SMTP_PASS        = process.env.SMTP_PASS         || "";
const CONTACT_USER     = process.env.CONTACT_SMTP_USER || "contact@avirtrekkers.com";
const CONTACT_PASS     = process.env.CONTACT_SMTP_PASS || "";
const FROM_NAME        = process.env.SMTP_FROM_NAME    || "Avir Trekkers";

let transporter        = null;
let contactTransporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!SMTP_PASS) {
        console.warn("SMTP_PASS not set; emails will not be sent.");
        return null;
    }
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    return transporter;
}

function getContactTransporter() {
    if (contactTransporter) return contactTransporter;
    if (!CONTACT_PASS) {
        console.warn("CONTACT_SMTP_PASS not set; contact emails will not be sent.");
        return null;
    }
    contactTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: { user: CONTACT_USER, pass: CONTACT_PASS }
    });
    return contactTransporter;
}

async function sendEmail(to, subject, html) {
    const transport = getTransporter();
    if (!transport) return { success: false, error: "Email not configured" };
    try {
        await transport.sendMail({
            from: `"${FROM_NAME}" <${SMTP_USER}>`,
            to,
            subject,
            html
        });
        return { success: true };
    } catch (err) {
        console.error("Send email error:", err);
        return { success: false, error: err.message || "Failed to send email" };
    }
}

async function sendFromContact(to, subject, html) {
    const transport = getContactTransporter();
    if (!transport) return { success: false, error: "Contact email not configured" };
    try {
        await transport.sendMail({
            from: `"${FROM_NAME}" <${CONTACT_USER}>`,
            to,
            subject,
            html
        });
        return { success: true };
    } catch (err) {
        console.error("Send contact email error:", err);
        return { success: false, error: err.message || "Failed to send email" };
    }
}

/* ─── Shared layout wrapper ─────────────────────────────────────────────── */
function wrap(content) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0B2545 0%,#1D3557 100%);padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#f59e0b;font-size:22px;font-weight:800;letter-spacing:1px;">AVIR TREKKERS</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:2px;text-transform:uppercase;">Trek with Purpose</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Avir Trekkers | Mumbai, Maharashtra, India</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">
              <a href="mailto:contact@avirtrekkers.com" style="color:#94a3b8;">contact@avirtrekkers.com</a> &nbsp;|&nbsp;
              <a href="https://avirtrekkers.com" style="color:#94a3b8;">avirtrekkers.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text, href) {
    return `<a href="${href}" style="display:inline-block;background:#e07020;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;margin-top:20px;">${text}</a>`;
}

function trekCard(trek) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
    return `
      <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0f172a;">${trek.title || "Trek"}</p>
            ${trek.location ? `<p style="margin:0 0 8px;color:#64748b;font-size:13px;">📍 ${trek.location}</p>` : ""}
            <table cellpadding="0" cellspacing="0">
              ${trek.startDate ? `<tr><td style="color:#64748b;font-size:13px;padding:2px 0;">📅 <strong>Date:</strong> &nbsp;${fmt(trek.startDate)}${trek.endDate ? ` → ${fmt(trek.endDate)}` : ""}</td></tr>` : ""}
              ${trek.duration  ? `<tr><td style="color:#64748b;font-size:13px;padding:2px 0;">⏱ <strong>Duration:</strong> &nbsp;${trek.duration}</td></tr>` : ""}
              ${trek.difficulty? `<tr><td style="color:#64748b;font-size:13px;padding:2px 0;">⚡ <strong>Difficulty:</strong> &nbsp;${trek.difficulty}</td></tr>` : ""}
            </table>
          </td>
        </tr>
      </table>`;
}

function divider() {
    return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

/* ─── 1. OTP Email ───────────────────────────────────────────────────────── */
async function sendOtpEmail(to, otp) {
    const html = wrap(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">Verify Your Email</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Use this OTP to complete your trek enrollment. It expires in 10 minutes.</p>
      <div style="text-align:center;background:#f0f9ff;border:2px dashed #3b82f6;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#1d4ed8;">${otp}</p>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Never share this OTP with anyone. Avir Trekkers will never ask for it.</p>
    `);
    return sendEmail(to, "Your OTP for Trek Enrollment – Avir Trekkers", html);
}

/* ─── 2. Enrollment Confirmation → User ─────────────────────────────────── */
async function sendEnrollmentConfirmation({ primaryContact, trek, bookingId, participants, paymentAmount }) {
    const count = participants?.length || 1;
    const html = wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#ecfdf5;border-radius:50%;padding:16px;margin-bottom:12px;">
          <span style="font-size:32px;">✅</span>
        </div>
        <h2 style="margin:0 0 6px;color:#0f172a;font-size:22px;font-weight:800;">Booking Confirmed!</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Hi ${primaryContact.fullName}, your trek is booked. Get your gear ready!</p>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Booking ID</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#15803d;font-family:monospace;">${bookingId}</p>
      </div>

      ${trekCard(trek)}

      <table width="100%" style="margin:0 0 8px;">
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;">👥 Participants</td>
          <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;">${count}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;">💰 Amount Due</td>
          <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;">₹${Number(paymentAmount || 0).toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;">💳 Payment Status</td>
          <td style="text-align:right;font-weight:700;color:#d97706;font-size:13px;">Pending</td>
        </tr>
      </table>

      ${divider()}
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;"><strong style="color:#0f172a;">What's next?</strong></p>
      <ul style="margin:0;padding-left:20px;color:#64748b;font-size:13px;line-height:1.8;">
        <li>Our team will contact you on <strong>${primaryContact.mobile}</strong> within 24 hours.</li>
        <li>Payment details will be shared over WhatsApp/call.</li>
        <li>Please save your Booking ID for future reference.</li>
        <li>Cancellation is allowed up to 7 days before the trek date.</li>
      </ul>

      ${divider()}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Questions? Reply to this email or WhatsApp us at <strong>+91 97663 69007</strong></p>
    `);
    return sendEmail(primaryContact.email, `Booking Confirmed – ${trek.title || "Trek"} | Avir Trekkers`, html);
}

/* ─── 3. New Enrollment Alert → Admin ───────────────────────────────────── */
async function sendAdminEnrollmentAlert({ adminEmails, primaryContact, trek, bookingId, participants, paymentAmount }) {
    if (!adminEmails?.length) return { success: true };
    const count = participants?.length || 1;
    const participantRows = (participants || []).map((p, i) =>
        `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
           <td style="padding:6px 10px;font-size:12px;color:#334155;">${i + 1}</td>
           <td style="padding:6px 10px;font-size:12px;color:#334155;">${p.fullName || "—"}</td>
           <td style="padding:6px 10px;font-size:12px;color:#334155;">${p.age || "—"}</td>
           <td style="padding:6px 10px;font-size:12px;color:#334155;">${p.gender || "—"}</td>
           <td style="padding:6px 10px;font-size:12px;color:#334155;">${p.mobile || "—"}</td>
         </tr>`
    ).join("");

    const html = wrap(`
      <h2 style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:800;">🔔 New Enrollment Received</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">A new trek enrollment has been submitted.</p>

      <table width="100%" style="margin-bottom:16px;">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Booking ID</strong></td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;font-family:monospace;">${bookingId}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Contact</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${primaryContact.fullName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Email</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${primaryContact.email}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Mobile</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${primaryContact.mobile}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Participants</strong></td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;">${count}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Amount</strong></td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px;">₹${Number(paymentAmount || 0).toLocaleString("en-IN")}</td></tr>
      </table>

      ${trekCard(trek)}

      ${participants?.length > 0 ? `
        <p style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 8px;">Participants</p>
        <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <tr style="background:#0B2545;">
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#fff;font-weight:600;">#</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Name</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Age</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Gender</th>
            <th style="padding:8px 10px;text-align:left;font-size:12px;color:#fff;font-weight:600;">Mobile</th>
          </tr>
          ${participantRows}
        </table>
      ` : ""}
    `);
    return sendEmail(adminEmails.join(","), `New Enrollment – ${trek.title || "Trek"} (${count} pax) | Avir Trekkers`, html);
}

/* ─── 4. Payment Confirmation → User ────────────────────────────────────── */
async function sendPaymentConfirmation({ primaryContact, trek, bookingId, paymentAmount, paymentMethod, transactionId, paymentDate }) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const html = wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;">🎉</span>
        <h2 style="margin:8px 0 6px;color:#0f172a;font-size:22px;font-weight:800;">Payment Received!</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Hi ${primaryContact.fullName}, your payment has been confirmed. See you on the trail!</p>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Booking ID</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#15803d;font-family:monospace;">${bookingId}</p>
      </div>

      ${trekCard(trek)}

      <table width="100%" style="margin:0 0 8px;">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">💰 Amount Paid</td><td style="text-align:right;font-weight:800;color:#15803d;font-size:15px;">₹${Number(paymentAmount || 0).toLocaleString("en-IN")}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">📅 Payment Date</td><td style="text-align:right;font-size:13px;color:#0f172a;">${fmt(paymentDate)}</td></tr>
        ${paymentMethod ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">💳 Method</td><td style="text-align:right;font-size:13px;color:#0f172a;">${paymentMethod}</td></tr>` : ""}
        ${transactionId ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">🔖 Transaction ID</td><td style="text-align:right;font-size:13px;color:#0f172a;font-family:monospace;">${transactionId}</td></tr>` : ""}
      </table>

      ${divider()}
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;"><strong style="color:#0f172a;">What to bring:</strong></p>
      <ul style="margin:0;padding-left:20px;color:#64748b;font-size:13px;line-height:1.9;">
        <li>Comfortable trekking shoes</li>
        <li>Water bottle (min. 2 litres)</li>
        <li>Rain jacket / poncho</li>
        <li>ID proof (original)</li>
        <li>Snacks and energy bars</li>
      </ul>
      ${divider()}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">For queries, WhatsApp us at <strong>+91 97663 69007</strong></p>
    `);
    return sendEmail(primaryContact.email, `Payment Confirmed – ${trek.title || "Trek"} | Avir Trekkers`, html);
}

/* ─── 5. Admin Payment Alert ─────────────────────────────────────────────── */
async function sendAdminPaymentAlert({ adminEmails, primaryContact, trek, bookingId, paymentAmount, paymentMethod, transactionId }) {
    if (!adminEmails?.length) return { success: true };
    const html = wrap(`
      <h2 style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:800;">💰 Payment Received</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">A payment has been marked as received for the following booking.</p>
      <table width="100%" style="margin-bottom:16px;">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Booking ID</strong></td><td style="text-align:right;font-weight:700;color:#0f172a;font-family:monospace;font-size:13px;">${bookingId}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Name</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${primaryContact.fullName}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Amount</strong></td><td style="text-align:right;font-weight:800;color:#15803d;font-size:15px;">₹${Number(paymentAmount || 0).toLocaleString("en-IN")}</td></tr>
        ${paymentMethod ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Method</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${paymentMethod}</td></tr>` : ""}
        ${transactionId ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Transaction ID</strong></td><td style="text-align:right;font-family:monospace;font-size:13px;color:#0f172a;">${transactionId}</td></tr>` : ""}
      </table>
      ${trekCard(trek)}
    `);
    return sendEmail(adminEmails.join(","), `Payment Received – ${trek.title || "Trek"} | ₹${Number(paymentAmount || 0).toLocaleString("en-IN")}`, html);
}

/* ─── 6. Cancellation Confirmation → User ───────────────────────────────── */
async function sendCancellationConfirmation({ primaryContact, trek, bookingId }) {
    const html = wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;">❌</span>
        <h2 style="margin:8px 0 6px;color:#0f172a;font-size:22px;font-weight:800;">Booking Cancelled</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Hi ${primaryContact.fullName}, your booking has been cancelled as requested.</p>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Cancelled Booking ID</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#dc2626;font-family:monospace;">${bookingId}</p>
      </div>

      ${trekCard(trek)}
      ${divider()}
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;"><strong style="color:#0f172a;">Refund Information</strong></p>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px;">If you made a payment, our team will process the refund within 5–7 working days. For queries, contact us directly.</p>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">WhatsApp: <strong>+91 97663 69007</strong> &nbsp;|&nbsp; <a href="mailto:contact@avirtrekkers.com" style="color:#94a3b8;">contact@avirtrekkers.com</a></p>
    `);
    return sendEmail(primaryContact.email, `Booking Cancelled – ${trek.title || "Trek"} | Avir Trekkers`, html);
}

/* ─── 7. Contact Form → Admin + Auto-reply → User ───────────────────────── */
async function sendContactInquiryToAdmin({ adminEmails, name, email, phone, subject, message }) {
    if (!adminEmails?.length) return { success: true };
    const html = wrap(`
      <h2 style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:800;">📬 New Contact Inquiry</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Someone submitted the contact form on avirtrekkers.com.</p>
      <table width="100%" style="margin-bottom:16px;">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Name</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${name}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Email</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${email}</td></tr>
        ${phone ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Phone</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${phone}</td></tr>` : ""}
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Subject</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${subject}</td></tr>
      </table>
      ${divider()}
      <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 8px;">Message</p>
      <div style="background:#f8fafc;border-left:4px solid #e07020;padding:14px 16px;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#334155;font-size:13px;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
      </div>
    `);
    return sendEmail(adminEmails.join(","), `Contact Inquiry: ${subject} – from ${name}`, html);
}

async function sendContactAutoReply({ name, email, subject }) {
    const html = wrap(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">We Got Your Message! 🙌</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Hi ${name}, thank you for reaching out to Avir Trekkers. We've received your inquiry and our team will get back to you within <strong>24 hours</strong>.</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Your inquiry subject</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${subject}</p>
      </div>

      ${divider()}
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;"><strong style="color:#0f172a;">Need a faster response?</strong></p>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px;">WhatsApp us directly for urgent queries — we typically respond within a few hours.</p>
      <p style="text-align:center;">
        <a href="https://wa.me/919766369007" style="display:inline-block;background:#25D366;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Chat on WhatsApp</a>
      </p>
      ${divider()}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Avir Trekkers | Trek with Purpose</p>
    `);
    return sendEmail(email, `We received your message – Avir Trekkers`, html);
}

/* ─── 8. New Inquiry Notification → contact@ ────────────────────────────── */
async function sendNewInquiryNotification({ name, email, phone, subject, message }) {
    const html = wrap(`
      <h2 style="margin:0 0 6px;color:#0f172a;font-size:20px;font-weight:800;">📬 New Contact Form Submission</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Someone submitted the contact form on avirtrekkers.com.</p>
      <table width="100%" style="margin-bottom:16px;">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Name</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${name}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Email</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${email}</td></tr>
        ${phone ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Phone</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${phone}</td></tr>` : ""}
        <tr><td style="color:#64748b;font-size:13px;padding:4px 0;"><strong>Subject</strong></td><td style="text-align:right;font-size:13px;color:#0f172a;">${subject}</td></tr>
      </table>
      ${divider()}
      <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 8px;">Message</p>
      <div style="background:#f8fafc;border-left:4px solid #e07020;padding:14px 16px;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#334155;font-size:13px;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
      </div>
      ${divider()}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Reply to this inquiry from the <strong>Admin Portal → Inquiries</strong> tab.</p>
    `);
    return sendFromContact(CONTACT_USER, `[New Inquiry] ${subject} – from ${name}`, html);
}

/* ─── 9. Inquiry Reply → User (FROM contact@) ───────────────────────────── */
async function sendInquiryReply({ to, toName, subject, replyBody, originalMessage }) {
    const html = wrap(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">Reply from Avir Trekkers</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi ${toName}, here's a response to your inquiry.</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Our Reply</p>
        <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.8;white-space:pre-wrap;">${replyBody.replace(/\n/g, "<br>")}</p>
      </div>

      ${originalMessage ? `
      <details style="margin-bottom:20px;">
        <summary style="color:#94a3b8;font-size:12px;cursor:pointer;padding:8px 0;">Show original message</summary>
        <div style="background:#f1f5f9;border-left:3px solid #cbd5e1;padding:12px 16px;margin-top:8px;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">${originalMessage.replace(/\n/g, "<br>")}</p>
        </div>
      </details>
      ` : ""}

      ${divider()}
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        You can reply directly to this email or reach us on WhatsApp: <strong>+91 97663 69007</strong>
      </p>
    `);
    return sendFromContact(to, `Re: ${subject} – Avir Trekkers`, html);
}

module.exports = {
    sendEmail,
    sendFromContact,
    getTransporter,
    getContactTransporter,
    sendOtpEmail,
    sendEnrollmentConfirmation,
    sendAdminEnrollmentAlert,
    sendPaymentConfirmation,
    sendAdminPaymentAlert,
    sendCancellationConfirmation,
    sendContactInquiryToAdmin,
    sendContactAutoReply,
    sendNewInquiryNotification,
    sendInquiryReply,
};
