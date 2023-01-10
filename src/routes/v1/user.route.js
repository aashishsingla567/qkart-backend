const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const userValidation = require("../../validations/user.validation");
const userController = require("../../controllers/user.controller");

const router = express.Router();

router
  .route("/:userId")
  .get(validate(userValidation.getUser), auth, userController.getUser)
  .put(auth, validate(userValidation.setAddress), userController.setAddress);

module.exports = router;
