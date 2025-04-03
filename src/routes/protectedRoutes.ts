import { Request, Response, Router } from "express";
import productController from "../controllers/productController";
import { authorizeRoles } from "../middlewares/authMiddleware";
import orderController from "../controllers/orderController";
import paymentController from "../controllers/paymentController";

const router = Router();

//Product Routes

router.post(
  "/product",
  authorizeRoles("FARMER"),
  productController.createProduct
);

// Get all products with filtering and pagination
router.get("/product", productController.getAllProducts);

router.get("/product/:productId", productController.getProductById);

// Update product details (only farm owner)
router.put(
  "/product/:productId",
  authorizeRoles("FARMER"),
  productController.updateProduct
);

// Delete product (only farm owner)
router.delete(
  "/product/:productId",
  authorizeRoles("FARMER"),
  productController.deleteProduct
);

// Order routes

router.post(
  "/order",

  orderController.createOrder
);

// Get user's orders
router.get(
  "/order",

  orderController.getUserOrders
);

// Get specific order details
router.get(
  "/order/:orderId",

  orderController.getOrderById
);

// Update order status (for farmers)
router.patch(
  "/order/:orderId/status",

  authorizeRoles("FARMER"),
  orderController.updateOrderStatus
);

//payment route
// Process a payment
router.post(
  "/process",
  authorizeRoles("BUYER"),
  paymentController.processPayment
);

// Get payment details for an order
router.get("/process/order/:orderId", paymentController.getPaymentDetails);

// Get all payments for a farm (for farmers)
router.get(
  "/process/farm/:farmId",
  authorizeRoles("FARMER"),
  paymentController.getFarmPayments
);

export default router;
