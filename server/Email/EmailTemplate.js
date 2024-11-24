const SibApiV3Sdk = require('sib-api-v3-sdk');
const emailTemplate=process.env.EMAIL_TEMPLATE

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

const sendEmail = async (recipientEmail, subject, content) => {
  console.log(recipientEmail);
  const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = { email: emailTemplate }; 
  sendSmtpEmail.to = [{ email: recipientEmail }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = content;

  try {
    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
