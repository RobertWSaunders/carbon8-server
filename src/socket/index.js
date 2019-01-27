const { promisify } = require("util");
const redis = require("redis");
const _ = require("lodash");

var redisClient = redis.createClient();

const hgetAsync = promisify(redisClient.hget).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);
const hdelAsync = promisify(redisClient.hdel).bind(redisClient);

const SOCKET_AUTH_STATUS_REDIS_KEY = "socket_connections";
const APP_SESSION_SOCKET_REDIS_KEY = "app_session_sockets";

const SOCKET_AUTH_BOOT_TIME = 5000;

const socketEvents = {
  SOCKET_CONNECTION: "connection",
  SOCKET_DISCONNECT: "disconnect",

  TEST: "TEST"
};

const socketActions = {
  AUTHENTICATE_FOUNTAIN: "AUTHENTICATE_FOUNTAIN",
  AUTHENTICATE_APP: "AUTHENTICATE_APP",

  TEST_EMIT: "TEST_EMIT",

  TEST_EMIT_MOBILE: "TEST_EMIT_MOBILE"
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
  const {
    verifyFountainAccessToken,
    verifyAppAccessToken
  } = require("../auth")(db);

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

    socket.use(async (event, next) => {
      const eventType = event[0];

      if (
        eventType === socketActions.AUTHENTICATE_APP ||
        eventType === socketActions.AUTHENTICATE_FOUNTAIN
      ) {
        return next();
      }

      const authStatus = await getSocketAuthenticationStatus(socket);

      if (authStatus) return next();
    });

    socket.on(socketActions.AUTHENTICATE_FOUNTAIN, async (data) => {
      try {
        const {
          user,
          fountain,
          appSessionId
        } = await verifyFountainAccessToken(data.accessToken);

        await hsetAsync(
          SOCKET_AUTH_STATUS_REDIS_KEY,
          socket.id,
          JSON.stringify({
            authenticated: true,
            info: {
              userId: user.id,
              fountainId: fountain.id,
              appSessionId
            }
          })
        );
      } catch (err) {
        logger.error(
          `Could not verify the fountain access token provided for the socket with the identifier ${
            socket.id
          }!`
        );
      }
    });

    socket.on(socketActions.AUTHENTICATE_APP, async (data) => {
      try {
        const { user, appSessionId } = await verifyAppAccessToken(
          data.accessToken
        );

        await hsetAsync(
          SOCKET_AUTH_STATUS_REDIS_KEY,
          socket.id,
          JSON.stringify({
            authenticated: true,
            info: {
              userId: user.id,
              appSessonId
            }
          })
        );

        await hsetAsync(APP_SESSION_SOCKET_REDIS_KEY, appSessionId, socket.id);
      } catch (err) {
        logger.error(
          `Could not verify the app access token provided for the socket with the identifier ${
            socket.id
          }!`
        );
      }
    });

    setTimeout(async () => {
      const authStatus = await getSocketAuthenticationStatus(socket);

      if (!authStatus) {
        socket.disconnect();
      }
    }, SOCKET_AUTH_BOOT_TIME);

    socket.on(socketEvents.SOCKET_DISCONNECT, async (reason) => {
      await hdelAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

      // TODO: Need to think of ways to flush app session hash.

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

    socket.on(socketActions.TEST_EMIT_MOBILE, async () => {
      try {
        const socketInfo = await hgetAsync(
          SOCKET_AUTH_STATUS_REDIS_KEY,
          socket.id
        );

        if (_.has(socketInfo, "info.appSessionId")) {
          const appSocketId = await hgetAsync(
            APP_SESSION_SOCKET_REDIS_KEY,
            socketInfo.info.appSessionId
          );

          socket.to(appSocketId).send({
            type: "TEST",
            data: {
              test: "Bobby"
            }
          });
        }
      } catch (err) {
        logger.error("Something failed!");
      }
    });
  });
};
