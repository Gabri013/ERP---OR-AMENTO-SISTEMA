import { db } from "./prisma";

interface CreateNotificacaoOptions {
  usuarioId: number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

/**
 * Cria uma notificação para um usuário específico
 */
export async function createNotificacao(options: CreateNotificacaoOptions) {
  try {
    await db.notificacao.create({
      data: {
        usuarioId: options.usuarioId,
        titulo: options.titulo,
        mensagem: options.mensagem,
        tipo: options.tipo,
        link: options.link,
      },
    });
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
}

/**
 * Cria notificação para múltiplos usuários
 */
export async function createNotificacaoMultipla(
  usuariosIds: number[],
  titulo: string,
  mensagem: string,
  tipo: 'info' | 'warning' | 'success' | 'error',
  link?: string
) {
  try {
    await db.notificacao.createMany({
      data: usuariosIds.map(usuarioId => ({
        usuarioId,
        titulo,
        mensagem,
        tipo,
        link,
      })),
    });
  } catch (err) {
    console.error('Erro ao criar notificações múltiplas:', err);
  }
}

/**
 * Cria notificação para todos os usuários de um tipo específico
 */
export async function createNotificacaoPorTipo(
  tipoUsuario: string,
  titulo: string,
  mensagem: string,
  tipo: 'info' | 'warning' | 'success' | 'error',
  link?: string
) {
  try {
    const usuarios = await db.usuario.findMany({
      where: { tipo: tipoUsuario as any },
      select: { id: true },
    });

    if (usuarios.length > 0) {
      await createNotificacaoMultipla(
        usuarios.map(u => u.id),
        titulo,
        mensagem,
        tipo,
        link
      );
    }
  } catch (err) {
    console.error('Erro ao criar notificações por tipo:', err);
  }
}

/**
 * Marca notificação como lida
 */
export async function marcarNotificacaoLida(notificacaoId: number) {
  try {
    await db.notificacao.update({
      where: { id: notificacaoId },
      data: { lida: true, readAt: new Date() },
    });
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
  }
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function marcarTodasLidas(usuarioId: number) {
  try {
    await db.notificacao.updateMany({
      where: { usuarioId, lida: false },
      data: { lida: true, readAt: new Date() },
    });
  } catch (err) {
    console.error('Erro ao marcar todas as notificações como lidas:', err);
  }
}
