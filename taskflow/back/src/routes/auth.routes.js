const express = require("express");
const {
  register,
  login,
  registerAdmin,
  removeAdmin,
  listUsers,
} = require("../controllers/auth.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");
const {
  validateRegisterAuth,
  validateLoginAuth,
  validateRegisterAdminAuth,
  validateRemoveAdminAuth,
} = require("../middlewares/validation.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification utilisateur
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Creer un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           example:
 *             username: "sylvain"
 *             email: "sylvain@example.com"
 *             password: "motdepasse123"
 *     responses:
 *       201:
 *         description: Utilisateur cree
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Requete invalide
 *       409:
 *         description: username ou email deja utilise
 *       500:
 *         description: Erreur serveur
 */
router.post("/register", validateRegisterAuth, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           example:
 *             identifier: "sylvain@example.com"
 *             password: "motdepasse123"
 *     responses:
 *       200:
 *         description: Connexion reussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Requete invalide
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/api/login", validateLoginAuth, login);

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Enregistrer un utilisateur comme admin (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRegisterInput'
 *           example:
 *             userId: "67f0b6c4e5c4f8d2a1b12345"
 *     responses:
 *       201:
 *         description: Admin enregistre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRegisterResponse'
 *       400:
 *         description: userId invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       404:
 *         description: Utilisateur introuvable
 *       409:
 *         description: Utilisateur deja admin
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/api/register-admin",
  requireAuth,
  requireAdmin,
  validateRegisterAdminAuth,
  registerAdmin
);

/**
 * @swagger
 * /api/auth/remove-admin:
 *   delete:
 *     summary: Retirer un utilisateur de la table Admin (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin. Elle est interdite si le total des admins est inferieur ou egal a 3.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRegisterInput'
 *           example:
 *             userId: "67f0b6c4e5c4f8d2a1b12345"
 *     responses:
 *       200:
 *         description: Admin retire
 *       400:
 *         description: userId invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse ou minimum admins non respecte
 *       404:
 *         description: Admin introuvable
 *       500:
 *         description: Erreur serveur
 */
router.delete(
  "/api/remove-admin",
  requireAuth,
  requireAdmin,
  validateRemoveAdminAuth,
  removeAdmin
);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Lister les utilisateurs (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Auth]
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
router.get("/api/users", requireAuth, requireAdmin, listUsers);

module.exports = router;
