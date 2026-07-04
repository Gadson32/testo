import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

export async function sendAppointmentReminderSMS(to: string, customerName: string, date: string) {
  const client = getTwilioClient();
  return client.messages.create({
    body: `Hi ${customerName}, reminder: your Sentinel Field service is scheduled for ${date}. Reply STOP to opt out.`,
    from: TWILIO_PHONE,
    to,
  });
}

export async function sendInvoiceReminderSMS(to: string, invoiceNumber: string, amount: string) {
  const client = getTwilioClient();
  return client.messages.create({
    body: `Sentinel Field: Invoice #${invoiceNumber} for ${amount} is due. View details in your account.`,
    from: TWILIO_PHONE,
    to,
  });
}
