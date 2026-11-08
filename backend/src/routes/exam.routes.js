import { Router } from "express";

import {
  getAdminExams,
  createExam,
  updateExam,
  deleteExam,
  addQuestionToExam,
  getExamQuestions,
  removeQuestionFromExam,
  publishExam,
  getPublishedExams,
  getPublishedExamDetail,
  closeExam
} from "../controllers/exam.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  getAdminExams
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createExam
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateExam
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteExam
);

router.post(
  "/:id/questions",
  requireAuth,
  requireRole("ADMIN"),
  addQuestionToExam
);

router.get(
  "/:id/questions",
  requireAuth,
  requireRole("ADMIN"),
  getExamQuestions
);

router.delete(
  "/:id/questions/:questionId",
  requireAuth,
  requireRole("ADMIN"),
  removeQuestionFromExam
);

router.patch(
  "/:id/publish",
  requireAuth,
  requireRole("ADMIN"),
  publishExam
);

router.get(
  "/",
  requireAuth,
  getPublishedExams
);

router.get(
  "/:id",
  requireAuth,
  getPublishedExamDetail
);

router.patch(
  "/:id/close",
  requireAuth,
  requireRole("ADMIN"),
  closeExam
);


export default router;