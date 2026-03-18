const express = require("express");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateDeleteCategory,
} = require("../middlewares/validation.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestion des categories
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Creer une categorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *           example:
 *             name: "Design"
 *     responses:
 *       201:
 *         description: Categorie creee
 *       400:
 *         description: Requete invalide
 *       409:
 *         description: Conflit de doublon
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *   get:
 *     summary: Lister les categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des categories
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.post("/", requireAuth, validateCreateCategory, createCategory);
router.get("/", requireAuth, getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Mettre a jour une categorie
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/CategoryInput'
 *           example:
 *             name: "Data"
 *     responses:
 *       200:
 *         description: Categorie mise a jour
 *       400:
 *         description: Requete invalide
 *       404:
 *         description: Categorie introuvable
 *       409:
 *         description: Conflit de doublon
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer une categorie (Admin uniquement)
 *     description: Cette operation est reservee aux utilisateurs presents dans la table Admin.
 *     tags: [Categories]
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
 *         description: Categorie supprimee
 *       400:
 *         description: id invalide
 *       404:
 *         description: Categorie introuvable
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Acces refuse
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", requireAuth, validateUpdateCategory, updateCategory);
router.delete("/:id", requireAuth, validateDeleteCategory, requireAdmin, deleteCategory);

module.exports = router;
