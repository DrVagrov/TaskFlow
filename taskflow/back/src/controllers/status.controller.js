const mongoose = require("mongoose");
const Status = require("../models/Status");
const { sendError } = require("../utils/httpResponse");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createStatus = async (req, res) => {
  try {
    const { label } = req.body;

    if (!label || typeof label !== "string" || !label.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "label est requis");
    }

    const status = await Status.create({ label: label.trim() });
    return res.status(201).json(status);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "CONFLICT", "Status deja existant");
    }

    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const getStatuses = async (_req, res) => {
  try {
    const statuses = await Status.find().sort({ _id: 1 });
    return res.status(200).json(statuses);
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const getStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    const status = await Status.findById(id);
    if (!status) {
      return sendError(res, 404, "STATUS_NOT_FOUND", "Status introuvable");
    }

    return res.status(200).json(status);
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    if (!label || typeof label !== "string" || !label.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "label est requis");
    }

    const status = await Status.findByIdAndUpdate(
      id,
      { label: label.trim() },
      { new: true, runValidators: true }
    );

    if (!status) {
      return sendError(res, 404, "STATUS_NOT_FOUND", "Status introuvable");
    }

    return res.status(200).json(status);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "CONFLICT", "Status deja existant");
    }

    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    const status = await Status.findByIdAndDelete(id);
    if (!status) {
      return sendError(res, 404, "STATUS_NOT_FOUND", "Status introuvable");
    }

    return res.status(200).json({ message: "Status supprime" });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  createStatus,
  getStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
};
