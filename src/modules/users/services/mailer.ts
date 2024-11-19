import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import { Service, Inject } from 'typedi';
import mustache from 'mustache';
import { readHTMLFile } from '@/utils/fsHandler.js';

@Service()
export default class MailerService {
  private from: string;

  constructor(
    @Inject('emailClient')
    private emailClient: nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
    @Inject('emailSender') private emailSender: string,
    @Inject('emailReceiver') private emailReceiver: string,
    @Inject('webBaseUrl') private webBaseUrl: string,
  ) {
    this.from = `WangiLoka <${this.emailSender}>`;
  }

  public async SendAccountVerificationEmail(
    email: string,
    userId: bigint,
    verificationToken: string,
  ) {
    const activationLink = `${this.webBaseUrl}/users/verification?userId=${userId}&token=${verificationToken}`;

    const activateAccountHTML = await readHTMLFile(
      './emails/activate-account.html',
    );
    const html = mustache.render(activateAccountHTML, { link: activationLink });

    const tokenVerificationMailOptions: Mail.Options = {
      from: this.from,
      to: email,
      subject: 'WangiLoka Email Verification',
      html,
    };

    try {
      this.emailClient.sendMail(tokenVerificationMailOptions);
      return { delivered: 1, status: 'ok' };
    } catch (e) {
      return { delivered: 0, status: 'error' };
    }
  }

  public async SendAccountPasswordResetEmail(
    email: string,
    userId: bigint,
    resetPasswordToken: string,
  ) {
    const resetLink = `${this.webBaseUrl}/users/reset-password?userId=${userId}&token=${resetPasswordToken}`;

    const resetPasswordHTML = await readHTMLFile(
      './emails/forgot-password.html',
    );
    const html = mustache.render(resetPasswordHTML, { link: resetLink });

    const passwordResetMailOptions: Mail.Options = {
      from: this.from,
      to: email,
      subject: 'WangiLoka Account Password Reset',
      html,
    };

    try {
      this.emailClient.sendMail(passwordResetMailOptions);
      return { delivered: 1, status: 'ok' };
    } catch (e) {
      return { delivered: 0, status: 'error' };
    }
  }

  public async SendContaUsEmail(name: string, email: string, message: string) {
    const contactUsMailOptions: Mail.Options = {
      from: this.from,
      to: this.emailReceiver,
      subject: 'WangiLoka New Contact',
      text: `${name} is contacting, \n\nemail: ${email}\nmessage:${message}`,
    };

    try {
      this.emailClient.sendMail(contactUsMailOptions);
      return { delivered: 1, status: 'ok' };
    } catch (e) {
      return { delivered: 0, status: 'error' };
    }
  }
}
