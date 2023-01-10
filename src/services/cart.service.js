const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const { http } = require("winston");
const { use } = require("passport");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email }).exec();
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  // find cart in database
  let cart;
  try {
    cart = await getCartByUser(user);
  } catch (err) {
    if (err.statusCode === httpStatus.NOT_FOUND) {
      const cartObj = {
        email: user.email,
        cartItems: [],
      };
      cart = await Cart.create(cartObj);
    }
  }

  if (!cart) {
    console.log({ cart });
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_SERVER_ERROR"
    );
  }

  // find product in database
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  // find product in cartItems
  let isAlreadyInCart = false;
  if (!cart.cartItems) {
    cart.cartItems = [];
  }
  for (let item of cart.cartItems) {
    if (item.product.id === product.id) {
      isAlreadyInCart = true;
      break;
    }
  }
  if (isAlreadyInCart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  }

  // add item is everthing is fine
  cart.cartItems.push({
    product,
    quantity,
  });

  await cart.markModified("cartItems");
  await cart.save();

  return cart;
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  let cart;
  try {
    cart = await getCartByUser(user);
  } catch (err) {
    if (err.statusCode === httpStatus.NOT_FOUND) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User does not have a cart. Use POST to create cart and add a product"
      );
    }
  }
  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  const cartItem = cart.cartItems.filter(
    (item) => item.product.id === product.id
  )[0];
  if (!cartItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  cartItem.quantity = quantity;
  await cart.save();

  return cart;
};

// TODO :: Implement this method
/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  let cart;
  try {
    cart = await getCartByUser(user);
  } catch (err) {
    throw new ApiError(httpStatus.NOT_FOUND, "User has no cart");
  }

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User has no cart");
  }

  if (!cart.cartItems.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User cart is empty");
  }

  if (!user.hasSetNonDefaultAddress()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User address is not set");
  }

  let totalCost = 0;
  for (let item of cart.cartItems) {
    totalCost += item.product.cost * item.quantity;
  }

  if (user.walletMoney < totalCost) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User has insufficient balance");
  }

  user.walletMoney -= totalCost;

  cart.cartItems.length = 0;

  await cart.markModified("cartItems");
  await cart.save();
  try {
    await user.save();
  } catch (err) {}
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
