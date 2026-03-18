const User = require("../models/User");
const { sendError } = require("../utils/httpResponse");

const listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("username email").sort({ username: 1 });
    return res.status(200).json(users);
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  listUsers,
};
