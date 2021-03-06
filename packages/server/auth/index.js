const jwt = require("jsonwebtoken");

const { AUTH_SECRET } = process.env;

function getBearer(req) {
  if (!req.headers || !req.headers.authorization) return false;
  const split = req.headers.authorization.split(" ");
  if (split.length !== 2 || split[0] !== "Bearer") return false;
  return split[1];
}

module.exports = (db) => {
  function requestAuthMiddleware() {
    return async (req, res, next) => {
      const token = getBearer(req);

      try {
        const { user, appSessionId } = await verifyAppAccessToken(token);

        req.user = user;
        req.appSessionId = appSessionId;

        next();
      } catch (err) {
        return res.status(401).json("Invalid access token!");
      }
    };
  }

  async function verifyAppAccessToken(appAccessToken) {
    if (!appAccessToken) throw new Error("No app access token provided!");

    return jwt.verify(appAccessToken, AUTH_SECRET, async (err, decoded) => {
      if (err) {
        throw new Error("Could not verify the provided app access token!");
      }

      const { userId, appSessionId } = decoded;

      const user = await db.User.findOne({ where: { id: userId } });

      if (!user) {
        throw new Error(
          "Could not find a user with the identifier given in the app access token!"
        );
      }

      return {
        user,
        appSessionId
      };
    });
  }

  async function verifyFountainAccessToken(fountainAccessToken) {
    if (!fountainAccessToken) {
      throw new Error("No fountain access token provided!");
    }

    return jwt.verify(
      fountainAccessToken,
      AUTH_SECRET,
      async (err, decoded) => {
        if (err) {
          throw new Error(
            "Could not verify the provided fountain access token!"
          );
        }

        const { userId, fountainId, appSessionId } = decoded;

        const user = await db.User.findOne({ where: { id: userId } });

        if (!user) {
          throw new Error(
            "Could not find a user with the identifier given in the fountain access token!"
          );
        }

        const fountain = await db.Fountain.findOne({
          where: { id: fountainId }
        });

        if (!fountain) {
          throw new Error(
            "Could not find a fountain with the identifier given in the fountain access token!"
          );
        }

        return {
          user,
          fountain,
          appSessionId
        };
      }
    );
  }

  return {
    verifyAppAccessToken,
    requestAuthMiddleware,
    verifyFountainAccessToken
  };
};
