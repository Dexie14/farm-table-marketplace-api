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


export default router;