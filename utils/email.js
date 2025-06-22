import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import pug from 'pug';
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';

export class Email {
  constructor(user, url) {
    // this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    // this.from = `Govardhan <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        auth: {
          user: process.env.BREVO_LOGIN,
          pass: process.env.BREVO_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: 'sakethkethu2030@gmail.com',
      to: 'james@mailsac.com',
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(
      'welcome',
      'Welcome to Natours! Hope u have great adventures!! 😁'
    );
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Here is your link to reset your password 🔗 (valid only for 10 minutes)'
    );
  }
}
