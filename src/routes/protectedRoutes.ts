import { Request, Response, Router } from "express"
import productController from "../controllers/productController";
import { authorizeRoles } from "../middlewares/authMiddleware";
import orderController from "../controllers/orderController";




const router = Router();

//Product Routes

router.post('/product', 
  authorizeRoles('FARMER'), 
  productController.createProduct
);

// Get all products with filtering and pagination
router.get('/product', productController.getAllProducts);

router.get('/product/:productId', productController.getProductById);

// Update product details (only farm owner)
router.put('/product/:productId',
  authorizeRoles('FARMER'), 
  productController.updateProduct
);

// Delete product (only farm owner)
router.delete('/product/:productId', 
  authorizeRoles('FARMER'), 
  productController.deleteProduct
);



// Order routes

router.post('/order', 
   
  orderController.createOrder
);

// Get user's orders
router.get('/order', 
   
  orderController.getUserOrders
);

// Get specific order details
router.get('/order/:orderId', 
   
  orderController.getOrderById
);

// Update order status (for farmers)
router.patch('/order/:orderId/status', 
   
  authorizeRoles('FARMER'), 
  orderController.updateOrderStatus
);



export default router;