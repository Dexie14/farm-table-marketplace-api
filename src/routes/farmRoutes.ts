import express from 'express';
import { getAllFarms, getFarmById, createFarm, deleteFarm } from '../controllers/farmController';
import { authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes – accessible to all users
router.get('/', getAllFarms);
router.get('/:id', getFarmById);

// Protected routes – only authorized farmers
router.post('/', authorizeRoles('FARMER'), createFarm);
router.delete('/:id', authorizeRoles('FARMER'), deleteFarm);

export default router;
