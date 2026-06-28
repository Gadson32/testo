import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "Sentinel Field <noreply@sentinelfield.com>";

export async function sendInvoiceEmail(to: string, invoiceNumber: string, amount: string, pdfUrl?: string) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Invoice #${invoiceNumber} from Sentinel Field`,
    html: `
      <h2>Invoice #${invoiceNumber}</h2>
      <p>Amount due: <strong>${amount}</strong></p>
      ${pdfUrl ? `<p><a href="${pdfUrl}">View Invoice PDF</a></p>` : ""}
      <p>Thank you for your business.</p>
    `,
  });
}

export async function sendAppointmentReminder(to: string, customerName: string, date: string, time: string) {
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Appointment Reminder - Sentinel Field",
    html: `
      <h2>Appointment Reminder</h2>
      <p>Hi ${customerName},</p>
      <p>This is a reminder of your upcoming service appointment:</p>
      <p><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      <p>If you need to reschedule, please contact us.</p>
    `,
  });
}
