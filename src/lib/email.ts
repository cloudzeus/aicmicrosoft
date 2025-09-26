export interface SendEmailParams {
  to: string[]
  subject: string
  html: string
}

// Placeholder send email function - integrate your provider here
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // TODO: integrate with your email provider (e.g., Microsoft Graph / SMTP / SendGrid)
  console.log('sendEmail called', { to, subject, htmlLength: html.length })
}
