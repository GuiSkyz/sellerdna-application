import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../../infrastructure/database/supabase';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }

  // Attach user to the request
  (request as any).user = user;
}
