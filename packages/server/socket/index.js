const { promisify } = require("util");
const redis = require("redis");
const _ = require("lodash");

var redisClient = redis.createClient();

const hgetAsync = promisify(redisClient.hget).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);
const hdelAsync = promisify(redisClient.hdel).bind(redisClient);

const SOCKET_AUTH_STATUS_REDIS_KEY = "socket_connections";
const APP_SESSION_SOCKET_REDIS_KEY = "app_session_sockets";

const SOCKET_AUTH_BOOT_TIME = 1000;

const socketEvents = {
  SOCKET_CONNECTION: "connection",
  SOCKET_DISCONNECT: "disconnect"
};

const socketActions = {
  AUTHENTICATE_FOUNTAIN: "AUTHENTICATE_FOUNTAIN",
  AUTHENTICATE_APP: "AUTHENTICATE_APP",

  EMIT_TO_MOBILE: "EMIT_TO_MOBILE"
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
              fountainSocketConnection: true,
              fountainId: fountain.id,
              userId: user.id,
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
              appSocketConnection: true,
              userId: user.id,
              appSessionId
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
      const reply = await hgetAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

      const socketAuthInfo = JSON.parse(reply);

      if (
        _.has(socketAuthInfo, "info.appSocketConnection") &&
        _.has(socketAuthInfo, "info.appSessionId")
      ) {
        await hdelAsync(
          APP_SESSION_SOCKET_REDIS_KEY,
          socketAuthInfo.info.appSessionId
        );
      }

      await hdelAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

      logger.warn(
        `The socket with the identifier ${socket.id} has been disconnected!`
      );
    });

    // Socket Action Handlers

    socket.on(socketActions.EMIT_TO_MOBILE, async (mobileData) => {
      try {
        const reply = await hgetAsync(SOCKET_AUTH_STATUS_REDIS_KEY, socket.id);

        const socketInfo = JSON.parse(reply);

        if (_.has(socketInfo, "info.appSessionId")) {
          const appSocketId = await hgetAsync(
            APP_SESSION_SOCKET_REDIS_KEY,
            socketInfo.info.appSessionId
          );

          socket.to(appSocketId).send({
            type: mobileData.type,
            data: mobileData.data
          });
        }
      } catch (err) {
        logger.error("Something failed!");
      }
    });
  });
};
