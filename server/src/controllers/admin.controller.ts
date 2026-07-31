/**
 * @file admin.controller.ts
 * @description Super Admin User Management Controller.
 * @systemic_role Handles CRUD operations for all users, allowing Super Admins to 
 * manage employees, assign roles/teams, and deactivate accounts.
 */
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import Database from 'better-sqlite3';
import { UserRepository, UserStatus } from '../repositories/UserRepo';
import { RoleRepository } from '../repositories/RoleRepo';
import { TeamRepository } from '../repositories/TeamRepo';

const dbPath = path.resolve(__dirname, '../../../db/ecommerce.db');
const db = new Database(dbPath, { fileMustExist: true });

const userRepo = new UserRepository(db);
const roleRepo = new RoleRepository(db);
const teamRepo = new TeamRepository(db);

const SALT_ROUNDS = 10;

/**
 * @route GET /admin/users
 * @description Retrieves a list of all users with their role and team details.
 */
export const getAllUsers = (req: Request, res: Response) => {
  try {
    const users = userRepo.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error retrieving users' });
  }
};

/**
 * @route POST /admin/users
 * @description Creates a new employee user (Team Lead or Staff).
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role_id, team_id, status } = req.body;

    if (!email || !password || !role_id) {
      return res.status(400).json({ success: false, error: 'Email, password, and role_id are required' });
    }

    const existingUser = userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const role = roleRepo.findById(role_id);
    if (!role) {
      return res.status(400).json({ success: false, error: 'Invalid role_id' });
    }

    if (team_id) {
      const team = teamRepo.findById(team_id);
      if (!team) {
        return res.status(400).json({ success: false, error: 'Invalid team_id' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = userRepo.create({
      email,
      password_hash: passwordHash,
      role_id,
      team_id: team_id || null,
      status: (status as UserStatus) || 'ACTIVE'
    });

    const userWithDetails = userRepo.findById(newUser.id);
    res.status(201).json({ success: true, data: userWithDetails });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error creating user' });
  }
};

/**
 * @route PUT /admin/users/:id
 * @description Updates an existing user's role, team, or status.
 */
export const updateUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_id, team_id, status } = req.body;

    const existingUser = userRepo.findById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role_id) {
      const role = roleRepo.findById(role_id);
      if (!role) {
        return res.status(400).json({ success: false, error: 'Invalid role_id' });
      }
      userRepo.updateRole(id, role_id);
    }

    if (team_id !== undefined) {
      if (team_id !== null) {
        const team = teamRepo.findById(team_id);
        if (!team) {
          return res.status(400).json({ success: false, error: 'Invalid team_id' });
        }
      }
      userRepo.updateTeam(id, team_id);
    }

    if (status) {
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      userRepo.updateStatus(id, status as UserStatus);
    }

    const updatedUser = userRepo.findById(id);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error updating user' });
  }
};

/**
 * @route DELETE /admin/users/:id
 * @description Soft-deletes a user by setting their status to INACTIVE.
 */
export const deleteUser = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingUser = userRepo.findById(id);
    
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Soft delete to prevent foreign key constraint issues and allow reactivation
    userRepo.updateStatus(id, 'INACTIVE');
    
    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error deactivating user' });
  }
};