module.exports = (db) => {
  async function getUserById(userId) {
    try {
      const user = await db.User.findById(userId);

      return Promise.resolve({
        user
      });
    } catch (err) {
      return Promise.reject(new RestApiError());
    }
  }

  return {
    getUserById
  };
};
