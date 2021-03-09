const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1- create transporter
  //need to define more options becasue were using a nonstandard for nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2 - define email options
  const mailOptions = {
    from: 'Zach Dantzer <hello@zach.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };

  //3 - acutally send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
