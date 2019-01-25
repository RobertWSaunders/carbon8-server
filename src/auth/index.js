const Router = require("express").Router;
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/auth.routes");

const { AUTH_SECRET } = process.env;

module.exports = (db) => {
  async function verifyAccessToken(token) {
    if (!token) throw new Error("No access token provided!");

    return jwt.verify(token, AUTH_SECRET, async (err, decoded) => {
      if (err) throw new Error("Could not verify the provided access token!");

      const { userId } = decoded;

      const user = await db.User.findOne({ where: { id: userId } });

      if (!user) {
        throw new Error(
          "Could not find a user with the identifier given in the access token!"
        );
      }

      return {
        user
      };
    });
  }

  function authApi() {
    const authApi = Router();

    authApi.use("/", authRoutes(db));

    return authApi;
  }

  return {
    authApi,
    verifyAccessToken
  };
};
