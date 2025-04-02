import { Request, Response, Router } from "express"
import productController from "../controllers/productController";
import { authorizeRoles } from "../middlewares/authMiddleware";



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



export default router;