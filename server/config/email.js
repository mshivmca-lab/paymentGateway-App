import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE||"gmail",
  auth: {
    user: process.env.EMAIL_USER||"mshivmca@gmail.com",
    pass: process.env.EMAIL_PASS||"dhvyxcnffiygoyat",
  },
});

export default transporter;
