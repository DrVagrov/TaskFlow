
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Status = require("../models/Status");
const User = require("../models/User");

const isObjectIdValid = (value) => mongoose.Types.ObjectId.isValid(value);

const CheckForTaskValidity = async ({ idCategory, idStatu, idUser }) => {
  if (idCategory !== undefined) {
    if (!isObjectIdValid(idCategory)) {
      return "idCategory invalide";
    }

    const categoryExists = await Category.exists({ _id: idCategory });
    if (!categoryExists) {
      return "Categorie introuvable";
    }
  }

  if (idStatu !== undefined) {
    if (!isObjectIdValid(idStatu)) {
      return "idStatu invalide";
    }

    const statusExists = await Status.exists({ _id: idStatu });
    if (!statusExists) {
      return "Status introuvable";
    }
  }

  if (idUser !== undefined) {
    if (!isObjectIdValid(idUser)) {
      return "idUser invalide";
    }

    const userExists = await User.exists({ _id: idUser });
    if (!userExists) {
      return "Utilisateur introuvable";
    }
  }

  return null;
};

module.exports = {
  isObjectIdValid,
  CheckForTaskValidity,
};
