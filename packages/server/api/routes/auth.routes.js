const Router = require("express").Router;

const {
  validateName,
  validateEmail,
  validatePassword
} = require("../../utils/custom-validator");

const { ValidationError, sendError } = require("../../errors");

// Request Validation Methods

function validateSessionRequest(email, password) {
  if (!email || !password) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to supply a email and a password!"
      )
    );
  }

  return Promise.all([validateEmail(email), validatePassword(password)])
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject(new ValidationError(err));
    });
}

function validateSessionFromScanCodeRequest(scanCode, fountainId) {
  if (!scanCode || !fountainId) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to supply a scanCode and a fountainId in the request body."
      )
    );
  }

  return Promise.resolve();
}

function validateSignupRequest(firstName, lastName, email, password) {
  if (!firstName || !lastName || !email || !password) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to supply a firstName, lastName, email, and a password in the request body."
      )
    );
  }

  return Promise.all([
    validateEmail(email),
    validatePassword(password),
    validateName(firstName, lastName)
  ])
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject(new ValidationError(err));
    });
}

function validateResetHashRequest(email) {
  if (!email) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to supply a email in the request body!"
      )
    );
  }

  return validateEmail(email)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject(new ValidationError(err));
    });
}

function validateUpdatePasswordRequest(password, resetHash) {
  if (!password || !resetHash) {
    return Promise.reject(
      new ValidationError(
        "The request does not have all the required fields! Please make sure to pass a password and resetHash!"
      )
    );
  }

  return validatePassword(password)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// Route Implementation

module.exports = (db) => {
  const authApi = Router();

  const authCtr = require("../controllers/auth.controller")(db);

  const { requestAuthMiddleware } = require("../../auth")(db);

  authApi.post("/session", async (req, res) => {
    try {
      const { email, password } = req.body;

      await validateSessionRequest(email, password);

      const {
        user,
        appAccessToken,
        scanCode,
        appSessionId
      } = await authCtr.authenticate(email, password);

      return res.status(200).json({
        user,
        scanCode,
        appSessionId,
        appAccessToken
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  authApi.post("/sessionFromScanCode", async (req, res) => {
    try {
      const { scanCode, fountainId } = req.body;

      await validateSessionFromScanCodeRequest(scanCode, fountainId);

      const {
        user,
        fountainAccessToken
      } = await authCtr.authenticateWithScanCode(scanCode, fountainId);

      return res.status(200).json({
        user,
        fountainAccessToken
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  authApi.get(
    "/sessionFromAccessToken",
    requestAuthMiddleware(),
    async (req, res) => {
      try {
        const { user } = req;

        const {
          appAccessToken,
          scanCode,
          appSessionId
        } = await authCtr.sessionFromAccessToken(user);

        return res.status(200).json({
          user,
          scanCode,
          appSessionId,
          appAccessToken
        });
      } catch (err) {
        return sendError(res, err);
      }
    }
  );

  authApi.post(
    "/getNewScanCodeForSession",
    requestAuthMiddleware(),
    async (req, res) => {
      try {
        const { user, appSessionId } = req;

        const { scanCode } = await authCtr.getNewScanCodeForSession(
          user,
          appSessionId
        );

        return res.status(200).json({
          scanCode
        });
      } catch (err) {
        return sendError(res, err);
      }
    }
  );

  authApi.post("/signup", async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      await validateSignupRequest(firstName, lastName, email, password);

      const {
        user,
        appAccessToken,
        scanCode,
        appSessionId
      } = await authCtr.createUserAccount(firstName, lastName, email, password);

      return res.status(200).json({
        user,
        scanCode,
        appSessionId,
        appAccessToken
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  authApi.post(`/createResetHash`, async (req, res) => {
    try {
      const { email } = req.body;

      await validateResetHashRequest(email);

      await authCtr.resetPasswordRequest(email);

      return res.sendStatus(200);
    } catch (err) {
      return sendError(res, err);
    }
  });

  authApi.post(`/updatePasswordForReset`, async (req, res) => {
    try {
      const { password, resetHash } = req.body;

      await validateUpdatePasswordRequest(password, resetHash);

      await authCtr.updatePasswordRequest(password, resetHash);

      return res.sendStatus(200);
    } catch (err) {
      return sendError(res, err);
    }
  });

  return authApi;
};
