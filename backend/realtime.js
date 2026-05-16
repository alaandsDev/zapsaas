// Real-time layer (Socket.IO). Authenticates each socket against the
// sessions table and puts it in a per-user room so events only reach
// their owner. Designed to never throw into the HTTP request path.

let io = null;

function init(server, supabase) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('no token'));
      const { data: session } = await supabase
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();
      if (!session || new Date(session.expires_at) < new Date()) {
        return next(new Error('invalid session'));
      }
      socket.userId = session.user_id;
      next();
    } catch (e) {
      next(new Error('auth error'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  console.log('⚡ Socket.IO inicializado');
  return io;
}

// Fire-and-forget. Swallows all errors so a realtime hiccup never
// breaks the API response that triggered it.
function emitToUser(userId, event, payload) {
  try {
    if (io && userId) io.to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    console.warn('[realtime] emit falhou:', e.message);
  }
}

// Convenience: push a feed item with a server timestamp.
function feed(userId, item) {
  emitToUser(userId, 'feed', { ...item, at: new Date().toISOString() });
}

module.exports = { init, emitToUser, feed };
