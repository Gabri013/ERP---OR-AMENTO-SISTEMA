import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email service disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    console.warn('Email service not available');
    return false;
  }

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendOrcamentoEmail(
  orcamentoId: number,
  clienteEmail: string,
  orcamentoNumero: string
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Orçamento #${orcamentoNumero}</h2>
        <p>Prezado cliente,</p>
        <p>Seu orçamento foi gerado com sucesso.</p>
        <p>Você pode acessar o sistema para visualizar os detalhes.</p>
        <br>
        <p>Atenciosamente,<br>Equipe ERP Cozinca</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: clienteEmail,
    subject: `Orçamento #${orcamentoNumero} - ERP Cozinca`,
    html,
    text: `Orçamento #${orcamentoNumero} gerado com sucesso.`,
  });
}

export async function sendOSEmail(
  osId: number,
  clienteEmail: string,
  osNumero: string
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Ordem de Serviço #${osNumero}</h2>
        <p>Prezado cliente,</p>
        <p>Sua ordem de serviço foi criada/iniciada.</p>
        <p>Você pode acompanhar o progresso pelo sistema.</p>
        <br>
        <p>Atenciosamente,<br>Equipe ERP Cozinca</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: clienteEmail,
    subject: `Ordem de Serviço #${osNumero} - ERP Cozinca`,
    html,
    text: `Ordem de Serviço #${osNumero} criada com sucesso.`,
  });
}

export async function sendVendaEmail(
  vendaId: number,
  clienteEmail: string,
  vendaNumero: string
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Venda #${vendaNumero}</h2>
        <p>Prezado cliente,</p>
        <p>Sua venda foi confirmada com sucesso.</p>
        <p>Agradecemos pela preferência!</p>
        <br>
        <p>Atenciosamente,<br>Equipe ERP Cozinca</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: clienteEmail,
    subject: `Venda #${vendaNumero} Confirmada - ERP Cozinca`,
    html,
    text: `Venda #${vendaNumero} confirmada com sucesso.`,
  });
}
