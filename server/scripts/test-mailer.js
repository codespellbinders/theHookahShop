const { getTransporter, sendVerificationEmail } = require('../lib/mailer');

async function main() {
  const transporter = await getTransporter();
  console.log(JSON.stringify({
    hasTransporter: !!transporter,
    host: transporter && transporter.options && transporter.options.host ? transporter.options.host : null,
  }, null, 2));

  if (!transporter) {
    console.log('No transporter configured.');
    return;
  }

  const result = await sendVerificationEmail({
    to: 'test@example.com',
    code: '123456',
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
