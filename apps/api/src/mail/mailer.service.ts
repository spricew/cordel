import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { createTransport, type Transporter } from 'nodemailer';

/* Envío de emails. Dos modos:
 * - SMTP configurado (SMTP_HOST en el .env): envío real con nodemailer.
 * - Sin SMTP (desarrollo local): "email de papel" — el mensaje se
 *   escribe como .txt en storage/emails. Así se puede verificar el
 *   flujo completo sin levantar un servidor de correo. */
@Injectable()
export class MailerService {
  public constructor(private readonly config: ConfigService) {}

  private transport(): Transporter {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host === undefined) {
      throw new Error('SMTP_HOST no configurado: no hay transporte real');
    }
    const port = this.config.get<number>('SMTP_PORT', 587);
    return createTransport({
      host,
      port,
      secure: port === 465,
      auth: user !== undefined && pass !== undefined ? { user, pass } : undefined,
    });
  }

  private async devFile(to: string, subject: string, text: string): Promise<void> {
    const dir = path.resolve(process.cwd(), 'storage', 'emails');
    await mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}-${to.replace(/[^a-z0-9.@_-]/gi, '_')}.txt`;
    const content = `To: ${to}\nSubject: ${subject}\n\n${text}\n`;
    await writeFile(path.join(dir, fileName), content);
  }

  public async send(to: string, subject: string, text: string): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    if (host === undefined) {
      await this.devFile(to, subject, text);
      return;
    }
    const from = this.config.get<string>('SMTP_FROM') ?? 'Cordel <no-reply@cordel.test>';
    const transport = this.transport();
    try {
      await transport.sendMail({ from, to, subject, text });
    } finally {
      transport.close();
    }
  }
}
