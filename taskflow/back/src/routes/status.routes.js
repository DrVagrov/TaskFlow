const express = require("express");
const {
  createStatus,
  getStatuses,
  updateStatus,
  deleteStatus,
} = require("../controllers/status.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");
const {
  validateCreateStatus,
  validateUpdateStatus,
  validateDeleteStatus,
} = require("../middlewares/validation.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Status
 *   description: Gestion des statuts
 */

/**
 * @swagger
 * /api/status:
 *   post:
 *     summary: Creer un statut
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusInput'
 *           example:
 *             label: "En attente"
 *     responses:
 *       201:
 *         description: Status cree
 *       400:
 *         description: Requete invalide
 *       409:
 *         description: Conflit de doublon
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *   get:
 *     summary: Lister les statuts
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des statuts
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.post("/", requireAuth, validateCreateStatus, createStatus);
router.get("/", requireAuth, getStatuses);

/**
 * @swagger
 * /api/status/{id}:
 *   put:
 *     summary: Mettre a jour un statut
 *     tags: [Status]
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
 *             $ref: '#/components/schemas/StatusInput'
 *           example:
 *             label: "Fini"
 *     responses:
 *       200:
 *         description: Status mis a jour
 *       400:
 *         description: Requete invalide
 *       404:
 *         description: Status introuvable
 *       409:
 *         description: Conflit de doublon
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer un statut (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Status]
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
 *         description: Status supprime
 *       400:
 *         description: id invalide
 *       404:
 *         description: Status introuvable
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", requireAuth, validateUpdateStatus, updateStatus);
router.delete("/:id", requireAuth, validateDeleteStatus, requireAdmin, deleteStatus);

module.exports = router;
