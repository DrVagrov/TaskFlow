const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { sendError } = require("../utils/httpResponse");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "AUTH_TOKEN_MISSING", "Token manquant");
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return sendError(res, 401, "AUTH_TOKEN_INVALID", "Token invalide");
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 401, "AUTH_UNAUTHORIZED", "Utilisateur non authentifie");
    }

    const isAdmin = Boolean(await Admin.exists({ userId }));
    if (!isAdmin) {
      return sendError(res, 403, "AUTH_FORBIDDEN", "Acces refuse");
    }

    return next();
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};
