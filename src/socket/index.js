const redis = require("redis");
const _ = require("lodash");

var redisClient = redis.createClient();

// promisify this shit

const SOCKET_AUTH_STATUS_REDIS_KEY = "socket_connections";

const socketEvents = {
  SOCKET_CONNECTION: "connection",
  SOCKET_DISCONNECT: "disconnect",

  TEST: "TEST"
};

const socketActions = {
  TEST_EMIT: "TEST_EMIT",

  AUTHENTICATE: "AUTHENTICATE"
};

function getSocketAuthenticationStatus(socket) {
  return redisClient.hget(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id, function(
    err,
    reply
  ) {
    const socketAuthInfo = JSON.parse(reply);

    if (_.has(socketAuthInfo, "authenticated")) {
      return socketAuthInfo.authenticated;
    }

    return false;
  });
}

module.exports = (io, logger, db) => {
  const { verifyAccessToken } = require("../auth")(db);

  io.on(socketEvents.SOCKET_CONNECTION, (socket) => {
    logger.info(
      `A new socket with the identifier ${socket.id} has been connected!`
    );

    redisClient.hset(
      SOCKET_AUTH_STATUS_REDIS_KEY,
      socket.id,
      JSON.stringify({ authenticated: false })
    );

    // Authentication Logic

    socket.on(socketActions.AUTHENTICATE, async (data) => {
      try {
        await verifyAccessToken(data.accessToken);

        redisClient.hset(
          SOCKET_AUTH_STATUS_REDIS_KEY,
          socket.id,
          JSON.stringify({ authenticated: true })
        );
      } catch (err) {
        logger.error(err.message);
      }
    });

    socket.use((event, next) => {
      if (
        event[0] === socketActions.AUTHENTICATE ||
        getSocketAuthenticationStatus(socket)
      ) {
        return next();
      }
    });

    setTimeout(function() {
      if (!getSocketAuthenticationStatus(socket)) {
        socket.disconnect();
      }
    }, 5000);

    // Socket Event Handlers

    socket.on(socketEvents.SOCKET_DISCONNECT, (reason) => {
      redisClient.hdel("socket_connections", socket.id);

      logger.warn(
        `The socket with the identifier ${socket.id} has been disconnected!`
      );
    });

    // Socket Action Handlers

    socket.on(socketActions.TEST_EMIT, () => {
      socket.send({
        type: socketEvents.TEST,
        data: {
          test: "Honey"
        }
      });
    });
  });
};
