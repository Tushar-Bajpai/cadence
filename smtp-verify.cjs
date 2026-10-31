const nodemailer = require('nodemailer')
const { config } = require('dotenv')
config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

transporter.verify()
  .then(() => { console.log('SMTP connection ok:', process.env.SMTP_HOST, '| user:', process.env.SMTP_USER); process.exit(0) })
  .catch((err) => { console.error('SMTP FAILED:', err.message); process.exit(1) })
