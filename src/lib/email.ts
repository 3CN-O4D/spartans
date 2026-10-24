import nodemailer from "nodemailer";

/**
 * Brevo SMTP email sender.
 *
 * Brevo (formerly Sendinblue) provides an SMTP relay at
 * smtp-relay.brevo.com. You need:
 *   BREVO_SMTP_USER   — your Brevo account email address
 *   BREVO_SMTP_PASS   — your Brevo SMTP key (from Brevo → SMTP & API)
 *   BREVO_FROM_EMAIL  — the "from" address (must be verified in Brevo)
 *   BREVO_FROM_NAME   — optional sender name
 *
 * All emails go to the club's inbox (spartanssocceracademy@gmail.com).
 */

const CLUB_EMAIL = process.env.CLUB_EMAIL || "spartanssocceracademy@gmail.com";

function createTransporter() {
  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT || "587");
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export type EmailResult = { ok: boolean; error?: string };

export async function sendClubEmail({
  to = CLUB_EMAIL,
  subject,
  text,
  html,
}: {
  to?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      ok: false,
      error: "Brevo SMTP is not configured. Set BREVO_SMTP_USER and BREVO_SMTP_PASS.",
    };
  }

  const from = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER;
  const fromName = process.env.BREVO_FROM_NAME || "Spartans Soccer Academy";

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error("[email] Brevo SMTP send failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

export function registrationEmailBody(record: {
  childName: string;
  ageGroup: string;
  guardian: string;
  phone: string;
  email?: string;
  notes?: string;
}) {
  const subject = `New registration: ${record.childName} (${record.ageGroup})`;
  const text = `
New player registration for Spartans Soccer Academy

Child: ${record.childName}
Age group: ${record.ageGroup}
Guardian: ${record.guardian}
Phone: ${record.phone}
Email: ${record.email || "(not provided)"}
Notes: ${record.notes || "(none)"}

Reply to: ${record.guardian} <${record.email || record.phone}>
  `.trim();
  const html = `
<h2>New player registration — Spartans Soccer Academy</h2>
<table>
  <tr><td><strong>Child:</strong></td><td>${record.childName}</td></tr>
  <tr><td><strong>Age group:</strong></td><td>${record.ageGroup}</td></tr>
  <tr><td><strong>Guardian:</strong></td><td>${record.guardian}</td></tr>
  <tr><td><strong>Phone:</strong></td><td>${record.phone}</td></tr>
  <tr><td><strong>Email:</strong></td><td>${record.email || "(not provided)"}</td></tr>
  <tr><td><strong>Notes:</strong></td><td>${record.notes || "(none)"}</td></tr>
</table>
<p><strong>Reply to:</strong> ${record.guardian} &lt;${record.email || record.phone}&gt;</p>
  `.trim();
  return { subject, text, html };
}

export function supportEmailBody(record: {
  name: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
}) {
  const subject = `Support request: ${record.type} — ${record.name}`;
  const text = `
New support message from Spartans Soccer Academy website

Name: ${record.name}
Email: ${record.email}
Phone: ${record.phone || "(not provided)"}
Type: ${record.type}

Message:
${record.message}

Reply to: ${record.name} <${record.email}>
  `.trim();
  const html = `
<h2>New support message — Spartans Soccer Academy</h2>
<table>
  <tr><td><strong>Name:</strong></td><td>${record.name}</td></tr>
  <tr><td><strong>Email:</strong></td><td>${record.email}</td></tr>
  <tr><td><strong>Phone:</strong></td><td>${record.phone || "(not provided)"}</td></tr>
  <tr><td><strong>Type:</strong></td><td>${record.type}</td></tr>
</table>
<p><strong>Message:</strong></p>
<p>${record.message.replace(/\n/g, "<br>")}</p>
<p><strong>Reply to:</strong> ${record.name} &lt;${record.email}&gt;</p>
  `.trim();
  return { subject, text, html };
}
