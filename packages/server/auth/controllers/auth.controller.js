const randomize = require("randomatic");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { RestApiError, NotFoundError } = require("../../errors");

const { AUTH_SECRET } = process.env;

const JWT_ISSUER = "Carbon8";

const ACCESS_TOKEN_EXPIRE_SECONDS =
  process.env.ACCESS_TOKEN_EXPIRE_SECONDS || 300;
const RESET_PASSWORD_HASH_EXPIRE_SECONDS =
  process.env.RESET_PASSWORD_HASH_EXPIRE_SECONDS || 1200;

function createAccessToken(contents) {
  return jwt.sign(contents, AUTH_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE_SECONDS,
    issuer: JWT_ISSUER
  });
}

function createAppSessionId() {
  return randomize("A0", 4);
}

function createScanCode() {
  return randomize("A0", 8);
}

function getPersistedScanCodeFromSentScanCode(scanCode) {
  return scanCode.substring(0, 8);
}

function getAppSessionIdFromSentScanCode(scanCode) {
  return scanCode.substring(8, 12);
}

function createResetPasswordHash(user) {
  return crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${user.email}${Date.now()}`)
    .digest("hex");
}

module.exports = (db) => {
  async function createUserAccount(firstName, lastName, email, password) {
    try {
      const newAppSessionId = createAppSessionId();

      const persistedScanCode = createScanCode();

      const user = await db.User.create({
        firstName,
        lastName,
        password,
        email: email.toLowerCase(),
        scanCode: persistedScanCode
      });

      const appAccessToken = createAccessToken({
        userId: user.id,
        appSessionId: newAppSessionId
      });

      const sentScanCode = `${persistedScanCode}${newAppSessionId}`;

      return Promise.resolve({
        user,
        appAccessToken,
        scanCode: sentScanCode,
        appSessionId: newAppSessionId
      });
    } catch (err) {
      return Promise.reject(
        new RestApiError("An error occured trying to create user account!")
      );
    }
  }

  async function authenticate(email, password) {
    try {
      const user = await db.User.authenticate(email.toLowerCase(), password);

      const newAppSessionId = createAppSessionId();

      const persistedScanCode = createScanCode();

      const appAccessToken = createAccessToken({
        userId: user.id,
        appSessionId: newAppSessionId
      });

      await user.update({
        scanCode: persistedScanCode
      });

      const sentScanCode = `${persistedScanCode}${newAppSessionId}`;

      return Promise.resolve({
        user,
        appAccessToken,
        scanCode: sentScanCode,
        appSessionId: newAppSessionId
      });
    } catch (err) {
      return Promise.reject(new RestApiError(err));
    }
  }

  async function sessionFromAccessToken(user) {
    try {
      const newAppSessionId = createAppSessionId();

      const persistedScanCode = createScanCode();

      const appAccessToken = createAccessToken({
        userId: user.id,
        appSessionId: newAppSessionId
      });

      await user.update({
        scanCode: persistedScanCode
      });

      const sentScanCode = `${persistedScanCode}${newAppSessionId}`;

      return Promise.resolve({
        user,
        appAccessToken,
        scanCode: sentScanCode,
        appSessionId: newAppSessionId
      });
    } catch (err) {
      return Promise.reject(new RestApiError(err));
    }
  }

  async function authenticateWithScanCode(scanCode, fountainId) {
    try {
      const persistedScanCode = getPersistedScanCodeFromSentScanCode(scanCode);

      const user = await db.User.findOne({
        where: { scanCode: persistedScanCode }
      });

      if (!user) {
        return Promise.reject(
          new NotFoundError("User not found for scan code!")
        );
      }

      const fountain = await db.Fountain.findOne({
        where: { id: fountainId }
      });

      if (!fountain) {
        return Promise.reject(
          new NotFoundError("Fountain not found with supplied identifier!")
        );
      }

      const appSessionId = getAppSessionIdFromSentScanCode(scanCode);

      const newPersistedScanCode = createScanCode();

      await user.update({
        scanCode: newPersistedScanCode
      });

      const fountainAccessToken = createAccessToken({
        fountainId,
        userId: user.id,
        appSessionId: appSessionId
      });

      return Promise.resolve({
        user,
        fountainAccessToken
      });
    } catch (err) {
      return Promise.reject(new RestApiError(err));
    }
  }

  async function getNewScanCodeForSession(user, appSessionId) {
    try {
      const persistedScanCode = createScanCode();

      await user.update({
        scanCode: persistedScanCode
      });

      const sentScanCode = `${persistedScanCode}${appSessionId}`;

      return Promise.resolve({
        scanCode: sentScanCode
      });
    } catch (err) {
      return Promise.reject(new RestApiError(err));
    }
  }

  async function resetPasswordRequest(email) {
    try {
      const user = await db.User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return Promise.reject(new NotFoundError("User not found!"));
      }

      const newResetPasswordHash = createResetPasswordHash(email);
      const newResetPasswordHashExpiryDate = new Date(
        Date.now() + 1000 * RESET_PASSWORD_HASH_EXPIRE_SECONDS
      );

      await user.update({
        resetPasswordHash: newResetPasswordHash,
        resetPasswordHashExpiryDate: newResetPasswordHashExpiryDate
      });

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(
        new RestApiError(
          "An error occured trying to create reset password request!",
          500
        )
      );
    }
  }

  async function updatePasswordRequest(password, hash) {
    try {
      const user = await db.User.findOne({
        where: {
          resetPasswordHash: hash
        }
      });

      if (!user) {
        return Promise.reject(
          new NotFoundError("User not found or hash not the same!")
        );
      }

      if (user.resetPasswordHashExpiryDate < Date.now()) {
        return Promise.reject(
          new RestApiError("The reset password hash is expired!")
        );
      }

      await user.update({
        password
      });

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(
        new RestApiError("An error occured trying to update password!", 500)
      );
    }
  }

  return {
    authenticate,
    createUserAccount,
    resetPasswordRequest,
    updatePasswordRequest,
    authenticateWithScanCode,
    getNewScanCodeForSession,
    sessionFromAccessToken
  };
};
