const socketEvents = {
  SOCKET_CONNECTION: "connection",
  SOCKET_DISCONNECT: "disconnect",
  SOCKET_DISCONNECTING: "disconnecting",
  SOCKET_ERROR: "error"
};

const socketActions = {};

module.exports = (io, logger, db) => {
  io.on(socketEvents.SOCKET_CONNECTION, (socket) => {
    logger.info("A socket has been connected!");

    // Socket Event Handlers

    socket.on(socketEvents.SOCKET_DISCONNECT, (reason) => {
      logger.warn("The socket has been disconnected!");
    });

    socket.on(socketEvents.SOCKET_DISCONNECTING, (reason) => {
      logger.warn("The socket is disconnecting!");
    });

    socket.on(socketEvents.SOCKET_ERROR, (error) => {
      logger.error("There has been a socket error!");
    });

    // Socket Action Handlers
  });
};
