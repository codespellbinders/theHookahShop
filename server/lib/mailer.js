const nodemailer = require("nodemailer");

let transporterPromise = null;

function buildConfiguredTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      service: process.env.SMTP_SERVICE || undefined,
      pool: process.env.SMTP_POOL === "true",
      requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
    });
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  return null;
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const existing = buildConfiguredTransporter();
      if (existing) {
        return existing;
      }

      if (process.env.NODE_ENV === "production") {
        return null;
      }

      const testAccount = await nodemailer.createTestAccount();
      process.env.ETHEREAL_USER = testAccount.user;
      process.env.ETHEREAL_PASS = testAccount.pass;

      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }

  return transporterPromise;
}

function sendWithTimeout(transporter, mailMessage, ms = 7000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        const err = new Error("sendMail timeout");
        err.code = "SENDMAIL_TIMEOUT";
        reject(err);
      }
    }, ms);

    transporter
      .sendMail(mailMessage)
      .then((info) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(info);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function sendVerificationEmail({ to, code }) {
  const transporter = await getTransporter();
  const mailMessage = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@thehookahshop.local",
    to,
    subject: "Your The Hookah Shop verification code",
    text: `Your 6-digit verification code is ${code}. It expires in 10 minutes.`,
  };

  if (!transporter) {
    return { sent: false, previewUrl: null };
  }

  const info = await sendWithTimeout(transporter, mailMessage, Number(process.env.SMTP_TIMEOUT_MS) || 7000);
  return {
    sent: true,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}

module.exports = {
  getTransporter,
  sendVerificationEmail,
};