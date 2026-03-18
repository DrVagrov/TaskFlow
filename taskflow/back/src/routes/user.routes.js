const express = require("express");
const { listUsers } = require("../controllers/user.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister les utilisateurs (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       500:
 *         description: Erreur serveur
 */
router.get("/", requireAuth, requireAdmin, listUsers);

module.exports = router;
