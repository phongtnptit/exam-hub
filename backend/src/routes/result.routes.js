import { Router } from "express";

import {
  submitExam,
  saveAttemptAnswers
} from "../controllers/attempt.controller.js";

import {
  requireAuth,
  requireRole
} from "../middlewares/auth.middleware.js";

import {
  getMyResults,
  getMyResultDetail
} from "../controllers/result.controller.js";

import {
    getAttemptDetail
} from "../controllers/attempt.controller.js"

const router = Router();

router.put(
  "/:attemptId/answers",
  requireAuth,
  requireRole("STUDENT"),
  saveAttemptAnswers
);

router.post(
  "/:attemptId/submit",
  requireAuth,
  requireRole("STUDENT"),
  submitExam
);

router.get(
  "/my-results",
  requireAuth,
  requireRole("STUDENT"),
  getMyResults
);

router.get(
  "/results/:id",
  requireAuth,
  requireRole("STUDENT"),
  getMyResultDetail
);

router.get(
  "/:attemptId",
  requireAuth,
  requireRole("STUDENT"),
  getAttemptDetail
);

export default router;