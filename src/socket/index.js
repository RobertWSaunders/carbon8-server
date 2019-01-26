const { promisify } = require("util");
const redis = require("redis");
const _ = require("lodash");

var redisClient = redis.createClient();

const hgetAsync = promisify(redisClient.hget).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);
const hdelAsync = promisify(redisClient.hdel).bind(redisClient);

const SOCKET_AUTH_STATUS_REDIS_KEY = "socket_connections";

const SOCKET_AUTH_BOOT_TIME = 5000;

const socketEvents = {
  SOCKET_CONNECTION: "connection",
  SOCKET_DISCONNECT: "disconnect",

  TEST: "TEST"
};

const socketActions = {
  AUTHENTICATE: "AUTHENTICATE",

  TEST_EMIT: "TEST_EMIT"
};

async function getSocketAuthenticationStatus(socket) {
  try {
    const reply = await hgetAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

    const socketAuthInfo = JSON.parse(reply);

    if (_.has(socketAuthInfo, "authenticated")) {
      return socketAuthInfo.authenticated;
    }

    return false;
  } catch (err) {
    logger.error(
      `There was an error retrieving the auth status of the socket with the identifier ${
        socket.id
      }!`,
      err
    );

    return false;
  }
}

module.exports = (io, logger, db) => {
  const { verifyAccessToken } = require("../auth")(db);

  // Connection and Authentication Logic

  io.on(socketEvents.SOCKET_CONNECTION, async (socket) => {
    logger.info(
      `A new socket with the identifier ${socket.id} has been connected!`
    );

    await hsetAsync(
      SOCKET_AUTH_STATUS_REDIS_KEY,
      socket.id,
      JSON.stringify({ authenticated: false })
    );

    socket.on(socketActions.AUTHENTICATE, async (data) => {
      try {
        await verifyAccessToken(data.accessToken);

        await hsetAsync(
          SOCKET_AUTH_STATUS_REDIS_KEY,
          socket.id,
          JSON.stringify({ authenticated: true })
        );
      } catch (err) {
        logger.error(
          `Could not verify the access token provided for the socket with the identifier ${
            socket.id
          }!`
        );
      }
    });

    socket.use(async (event, next) => {
      if (event[0] === socketActions.AUTHENTICATE) return next();

      const authStatus = await getSocketAuthenticationStatus(socket);

      if (authStatus) return next();
    });

    setTimeout(async () => {
      const authStatus = await getSocketAuthenticationStatus(socket);

      if (!authStatus) {
        socket.disconnect();
      }
    }, SOCKET_AUTH_BOOT_TIME);

    socket.on(socketEvents.SOCKET_DISCONNECT, async (reason) => {
      await hdelAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

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
