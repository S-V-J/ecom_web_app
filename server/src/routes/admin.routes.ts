/**
 * @file admin.routes.ts
 * @description Express router for Super Admin User Management endpoints.
 */
import { Router } from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication AND SUPER_ADMIN role
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;