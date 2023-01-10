const express = require("express");
const validate = require("../../middlewares/validate");
const auth = require("../../middlewares/auth");
const cartValidation = require("../../validations/cart.validation");
const { cartController } = require("../../controllers/");

const router = express.Router();

router.get("/", auth, cartController.getCart);

router.post(
  "/",
  validate(cartValidation.addProductToCart),
  auth,
  cartController.addProductToCart
);

router.put(
  "/",
  validate(cartValidation.addProductToCart),
  auth,
  cartController.updateProductInCart
);

router.put("/checkout", auth, cartController.checkout);

module.exports = router;
