const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Admin = require("../models/Admin");
const { sendError } = require("../utils/httpResponse");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== "string" || !username.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "username est requis");
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "email est requis");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return sendError(res, 400, "VALIDATION_ERROR", "password doit contenir au moins 8 caracteres");
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { username: username.trim() }],
    });

    if (existingUser) {
      return sendError(res, 409, "CONFLICT", "username ou email deja utilise");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Utilisateur cree",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const login = async (req, res) => {
  try {
    const { identifier, email, username, password } = req.body;
    const rawIdentifier = (identifier ?? email ?? username ?? "").toString().trim();

    if (!rawIdentifier) {
      return sendError(res, 400, "VALIDATION_ERROR", "email ou username est requis");
    }

    if (!password || typeof password !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "password est requis");
    }

    const query = rawIdentifier.includes("@")
      ? { email: rawIdentifier.toLowerCase() }
      : { username: rawIdentifier };

    const user = await User.findOne(query).select("+password");

    if (!user) {
      return sendError(res, 401, "AUTH_INVALID_CREDENTIALS", "Identifiants invalides");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 401, "AUTH_INVALID_CREDENTIALS", "Identifiants invalides");
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Connexion reussie",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
      return sendError(res, 400, "VALIDATION_ERROR", "userId invalide");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, "USER_NOT_FOUND", "Utilisateur introuvable");
    }

    const existingAdmin = await Admin.findOne({ userId });
    if (existingAdmin) {
      return sendError(res, 409, "CONFLICT", "Cet utilisateur est deja admin");
    }

    const admin = await Admin.create({ userId });
    await admin.populate("userId", "username email");

    return res.status(201).json({
      message: "Admin enregistre",
      admin: {
        id: admin._id,
        user: admin.userId,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    const existingAdmin = await Admin.findOne({ userId });
    if (!existingAdmin) {
      return sendError(res, 404, "ADMIN_NOT_FOUND", "Admin introuvable");
    }

    const adminCount = await Admin.countDocuments();
    if (adminCount <= 3) {
      return sendError(res, 403, "AUTH_FORBIDDEN", "Suppression interdite: minimum 3 admins requis");
    }

    await Admin.deleteOne({ userId });

    return res.status(200).json({ message: "Admin retire" });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const listUsers = async (_req, res) => {
  try {
    const users = await User.find().select("username email").sort({ username: 1 });
    return res.status(200).json(users);
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  register,
  login,
  registerAdmin,
  removeAdmin,
  listUsers,
};
