const express = require("express");
const {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const {
  validateCreateTask,
  validateUpdateTask,
  validateDeleteTask,
} = require("../middlewares/validation.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Creer une taches
 *     tags: [Taches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *           example:
 *             title: "Faire les courses"
 *             description: "Acheter du lait"
 *             dueDate: "2026-12-31"
 *             idCategory: "0"
 *             idStatu: "0"
 *             idUser: "0"
 *     responses:
 *       201:
 *         description: Task creee
 *       400:
 *         description: Requete invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       500:
 *         description: Erreur serveur
 *   get:
 *     summary: Lister toutes les taches (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Taches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des taches
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       500:
 *         description: Erreur serveur
 */
router.post("/", requireAuth, validateCreateTask, createTask);
router.get("/", requireAuth, requireAdmin, getTasks);

/**
 * @swagger
 * /api/tasks/me:
 *   get:
 *     summary: Lister les taches du user connecte
 *     tags: [Taches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des taches du user connecte
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get("/me", requireAuth, getMyTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Mettre a jour une task
 *     tags: [Taches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *           example:
 *             title: "Faire les courses et cuisine"
 *             description: "Lait et oeufs"
 *             dueDate: "2026-12-31"
 *             idCategory: "0"
 *             idStatu: "0"
 *             idUser: "0"
 *     responses:
 *       200:
 *         description: Task mise a jour
 *       400:
 *         description: Requete invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       404:
 *         description: Task introuvable
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer une task
 *     tags: [Taches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task supprimee
 *       400:
 *         description: id invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       404:
 *         description: Task introuvable
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", requireAuth, validateUpdateTask, updateTask);
router.delete("/:id", requireAuth, validateDeleteTask, deleteTask);

module.exports = router;
