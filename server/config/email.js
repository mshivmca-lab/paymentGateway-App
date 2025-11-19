// import dotenv from 'dotenv';
// import nodemailer from 'nodemailer';

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE||"gmail",
//   auth: {
//     user: process.env.EMAIL_USER||"mshivmca@gmail.com",
//     pass: process.env.EMAIL_PASS||"dhvyxcnffiygoyat",
//   },
// });

// export default transporter;


import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE||"gmail",
  host: process.env.EMAIL_HOST||"smtp.gmail.com",
  port: process.env.EMAIL_PORT||587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export default transporter;