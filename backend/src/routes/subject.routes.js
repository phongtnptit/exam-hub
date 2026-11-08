import { Router } from "express";

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from "../controllers/subject.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getSubjects);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createSubject
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateSubject
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteSubject
);

export default router;