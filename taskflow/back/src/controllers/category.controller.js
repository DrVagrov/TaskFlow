const mongoose = require("mongoose");
const Category = require("../models/Category");
const { sendError } = require("../utils/httpResponse");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "name est requis");
    }

    const category = await Category.create({ name: name.trim() });
    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "CONFLICT", "Categorie deja existante");
    }

    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const getCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({_id: 1});
    return res.status(200).json(categories);
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "name est requis");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return sendError(res, 404, "CATEGORY_NOT_FOUND", "Categorie introuvable");
    }

    return res.status(200).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "CONFLICT", "Categorie deja existante");
    }

    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return sendError(res, 404, "CATEGORY_NOT_FOUND", "Categorie introuvable");
    }

    return res.status(200).json({ message: "Categorie supprimee" });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
