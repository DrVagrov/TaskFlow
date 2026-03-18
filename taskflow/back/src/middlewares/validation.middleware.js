const mongoose = require("mongoose");
const { sendError } = require("../utils/httpResponse");

const isObjectId = (value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
const isDateOnly = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidDateOnly = (value) => {
  if (!isDateOnly(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

const validateIdParam = (req, res, next) => {
  if (!isObjectId(req.params.id)) {
    return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
  }
  return next();
};

const validateCategoryName = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return sendError(res, 400, "VALIDATION_ERROR", "name est requis");
  }
  return next();
};

const validateStatusLabel = (req, res, next) => {
  const { label } = req.body;
  if (!label || typeof label !== "string" || !label.trim()) {
    return sendError(res, 400, "VALIDATION_ERROR", "label est requis");
  }
  return next();
};

const validateTaskBodyCreate = (req, res, next) => {
  const { title, description, dueDate, idCategory, idStatu, idUser } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return sendError(res, 400, "VALIDATION_ERROR", "title est requis");
  }

  if (description !== undefined && typeof description !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "description invalide");
  }

  if (dueDate !== undefined && !isValidDateOnly(dueDate)) {
    return sendError(res, 400, "VALIDATION_ERROR", "dueDate invalide (format attendu YYYY-MM-DD)");
  }

  if (!isObjectId(idCategory)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idCategory invalide");
  }

  if (!isObjectId(idStatu)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idStatu invalide");
  }

  if (!isObjectId(idUser)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idUser invalide");
  }

  return next();
};

const validateTaskBodyUpdate = (req, res, next) => {
  const { title, description, dueDate, idCategory, idUser, idStatu, IdStatu } = req.body;
  const fields = ["title", "description", "dueDate", "idCategory", "idUser", "idStatu", "IdStatu"];
  const hasAtLeastOneField = fields.some((field) => req.body[field] !== undefined);

  if (!hasAtLeastOneField) {
    return sendError(res, 400, "VALIDATION_ERROR", "Aucun champ a mettre a jour");
  }

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return sendError(res, 400, "VALIDATION_ERROR", "title ne peut pas etre vide");
  }

  if (description !== undefined && typeof description !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "description invalide");
  }

  if (dueDate !== undefined && !isValidDateOnly(dueDate)) {
    return sendError(res, 400, "VALIDATION_ERROR", "dueDate invalide (format attendu YYYY-MM-DD)");
  }

  if (idCategory !== undefined && !isObjectId(idCategory)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idCategory invalide");
  }

  if (idUser !== undefined && !isObjectId(idUser)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idUser invalide");
  }

  if (idStatu !== undefined && !isObjectId(idStatu)) {
    return sendError(res, 400, "VALIDATION_ERROR", "idStatu invalide");
  }

  if (IdStatu !== undefined && !isObjectId(IdStatu)) {
    return sendError(res, 400, "VALIDATION_ERROR", "IdStatu invalide");
  }

  return next();
};

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const validateAuthRegisterBody = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" || !username.trim()) {
    return sendError(res, 400, "VALIDATION_ERROR", "username est requis");
  }

  if (!isValidEmail(email)) {
    return sendError(res, 400, "VALIDATION_ERROR", "email invalide");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return sendError(res, 400, "VALIDATION_ERROR", "password doit contenir au moins 8 caracteres");
  }

  return next();
};

const validateAuthLoginBody = (req, res, next) => {
  const { identifier, email, username, password } = req.body;
  const rawIdentifier = (identifier ?? email ?? username ?? "").toString().trim();

  if (!rawIdentifier) {
    return sendError(res, 400, "VALIDATION_ERROR", "email ou username est requis");
  }

  if (!password || typeof password !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "password est requis");
  }

  return next();
};

const validateAuthRegisterAdminBody = (req, res, next) => {
  const { userId } = req.body;

  if (!isObjectId(userId)) {
    return sendError(res, 400, "VALIDATION_ERROR", "userId invalide");
  }

  return next();
};

module.exports = {
  validateRegisterAuth: [validateAuthRegisterBody],
  validateLoginAuth: [validateAuthLoginBody],
  validateRegisterAdminAuth: [validateAuthRegisterAdminBody],
  validateRemoveAdminAuth: [validateAuthRegisterAdminBody],
  validateCreateCategory: [validateCategoryName],
  validateGetCategory: [validateIdParam],
  validateUpdateCategory: [validateIdParam, validateCategoryName],
  validateDeleteCategory: [validateIdParam],
  validateCreateStatus: [validateStatusLabel],
  validateGetStatus: [validateIdParam],
  validateUpdateStatus: [validateIdParam, validateStatusLabel],
  validateDeleteStatus: [validateIdParam],
  validateCreateTask: [validateTaskBodyCreate],
  validateGetTask: [validateIdParam],
  validateUpdateTask: [validateIdParam, validateTaskBodyUpdate],
  validateDeleteTask: [validateIdParam],
};
