const Task = require("../models/Task");
const Admin = require("../models/Admin");
const { isObjectIdValid, CheckForTaskValidity } = require("../utils/utils");
const { sendError } = require("../utils/httpResponse");

const normalizeDueDate = (value) => {
  if (!value) {
    return null;
  }
  const raw = String(value);
  const direct = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (direct) {
    return `${direct[1]}-${direct[2]}-${direct[3]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const serializeTask = (taskDoc) => {
  if (!taskDoc) {
    return taskDoc;
  }
  const task = typeof taskDoc.toObject === "function" ? taskDoc.toObject() : { ...taskDoc };
  task.dueDate = normalizeDueDate(task.dueDate);
  return task;
};

// tasks/
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, idCategory, idUser, idStatu } = req.body;
    const connectedUserId = req.user?.userId;

    if (!connectedUserId) {
      return sendError(res, 401, "AUTH_UNAUTHORIZED", "Utilisateur non authentifie");
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "title est requis");
    }

    if (!idUser || typeof idUser !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "idUser est requis");
    }

    const isAdmin = Boolean(await Admin.exists({ userId: connectedUserId }));
    const canCreateForTargetUser = isAdmin || idUser === connectedUserId;
    if (!canCreateForTargetUser) {
      return sendError(res, 403, "AUTH_FORBIDDEN", "Acces refuse");
    }

    const refError = await CheckForTaskValidity({ idCategory, idStatu, idUser });
    if (refError) {
      return sendError(res, 400, "VALIDATION_ERROR", refError);
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      dueDate,
      idCategory,
      idStatu,
      idUser,
    });

    return res.status(201).json(serializeTask(task));
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const getTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .populate("idCategory", "name")
      .populate("idStatu", "label")
      .populate("idUser", "username")
      .sort({ _id: -1 });

    return res.status(200).json(tasks.map(serializeTask));
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "AUTH_UNAUTHORIZED", "Utilisateur non authentifie");
    }

    const tasks = await Task.find({ idUser: userId })
      .populate("idCategory", "name")
      .populate("idStatu", "label")
      .populate("idUser", "username")
      .sort({ _id: -1 });

    return res.status(200).json(tasks.map(serializeTask));
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const canManageTask = async (task, userId) => {
  if (!task || !userId) {
    return false;
  }

  const isOwner = task.idUser && task.idUser.toString() === userId;
  if (isOwner) {
    return true;
  }

  return Boolean(await Admin.exists({ userId }));
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, idCategory, idUser } = req.body;
    const idStatu = req.body.idStatu ?? req.body.IdStatu;
    const connectedUserId = req.user?.userId;

    if (!connectedUserId) {
      return sendError(res, 401, "AUTH_UNAUTHORIZED", "Utilisateur non authentifie");
    }

    if (!isObjectIdValid(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    const existingTask = await Task.findById(id).select("idUser");
    if (!existingTask) {
      return sendError(res, 404, "TASK_NOT_FOUND", "Task introuvable");
    }

    const allowed = await canManageTask(existingTask, connectedUserId);
    if (!allowed) {
      return sendError(res, 403, "AUTH_FORBIDDEN", "Acces refuse");
    }

    if (title !== undefined && (!title || typeof title !== "string" || !title.trim())) {
      return sendError(res, 400, "VALIDATION_ERROR", "title ne peut pas etre vide");
    }

    const refError = await CheckForTaskValidity({ idCategory, idStatu, idUser });
    if (refError) {
      return sendError(res, 400, "VALIDATION_ERROR", refError);
    }

    const updatePayload = {
      title: title !== undefined ? title.trim() : undefined,
      description,
      dueDate,
      idCategory,
      idStatu,
      idUser,
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .populate("idCategory", "name")
      .populate("idStatu", "label")
      .populate("idUser", "username email");

    return res.status(200).json(serializeTask(updatedTask));
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const connectedUserId = req.user?.userId;

    if (!connectedUserId) {
      return sendError(res, 401, "AUTH_UNAUTHORIZED", "Utilisateur non authentifie");
    }

    if (!isObjectIdValid(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "id invalide");
    }

    const existingTask = await Task.findById(id).select("idUser");
    if (!existingTask) {
      return sendError(res, 404, "TASK_NOT_FOUND", "Task introuvable");
    }

    const allowed = await canManageTask(existingTask, connectedUserId);
    if (!allowed) {
      return sendError(res, 403, "AUTH_FORBIDDEN", "Acces refuse");
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({ message: "Task supprimee" });
  } catch (error) {
    return sendError(res, 500, "SERVER_ERROR", "Erreur serveur", error.message);
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
};
