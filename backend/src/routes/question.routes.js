import { Router } from "express";

import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from "../controllers/question.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getQuestions
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createQuestion
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateQuestion
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteQuestion
);

export default router;