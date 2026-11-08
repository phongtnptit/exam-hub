import { Router } from "express";

import {
  startExam
} from "../controllers/attempt.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/:id/start",
  requireAuth,
  requireRole("STUDENT"),
  startExam
);

export default router;