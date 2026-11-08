import assert from "node:assert/strict";
import test from "node:test";
import prisma from "../src/lib/prisma.js";
import { gradeAttempt, normalizeAnswers } from "../src/services/attempt.service.js";
import { createQuestionSnapshot, hideCorrectAnswers } from "../src/services/exam-snapshot.service.js";

test("snapshot giữ nguyên dữ liệu và không lộ đáp án/giải thích", () => {
  const question = { id: 1, content: "Q", optionA: "a", optionB: "b", optionC: "c", optionD: "d", correctAnswer: "B", explanation: "why" };
  const snapshot = createQuestionSnapshot([{ position: 1, question }]);
  question.correctAnswer = "D";
  assert.equal(snapshot[0].correctAnswer, "B");
  const publicQuestion = hideCorrectAnswers(snapshot)[0];
  assert.equal(publicQuestion.optionB, "b");
  assert.equal("correctAnswer" in publicQuestion, false);
  assert.equal("explanation" in publicQuestion, false);
});

test("answers không hợp lệ không được dùng làm đáp án", () => {
  for (const value of [null, [], "A", 10]) assert.deepEqual(normalizeAnswers(value), {});
});

test("chấm từ snapshot, hết giờ vẫn có Result, giải phóng activeKey và nộp lặp trả cùng Result", async () => {
  // Chỉ dùng dữ liệu giả trong bộ nhớ; không mở kết nối database.
  const originalTransaction = prisma.$transaction;
  const originalFind = prisma.result.findUnique;
  let result = null;
  let update;
  let locked = false;
  const attempt = {
    id: 7, userId: 2, examId: 3, status: "IN_PROGRESS",
    answers: { "1": "B", "2": "D", "999": "A" },
    questionSnapshot: [{ id: 1, correctAnswer: "B" }, { id: 2, correctAnswer: "A" }, { id: 3, correctAnswer: "C" }],
    startedAt: new Date("2026-01-01T00:00:00Z"), expiresAt: new Date("2026-01-01T00:01:00Z")
  };
  prisma.result.findUnique = async () => result;
  prisma.$transaction = async (callback) => callback({
    $queryRaw: async () => { locked = true; return [{ id: 7 }]; },
    examAttempt: {
      findUnique: async () => { assert.equal(locked, true); return attempt; },
      updateMany: async ({ data }) => { update = data; return { count: 1 }; }
    },
    result: {
      findUnique: async () => result,
      create: async ({ data }) => { result = { id: 11, ...data }; return result; }
    }
  });
  try {
    const first = await gradeAttempt(7, new Date("2026-01-01T00:02:00Z"));
    assert.equal(first.score, 3.3);
    assert.equal(first.correct, 1);
    assert.equal(first.total, 3);
    assert.equal(update.status, "EXPIRED");
    assert.equal(update.activeKey, null);
    assert.equal((await gradeAttempt(7)).id, first.id);
  } finally {
    prisma.$transaction = originalTransaction;
    prisma.result.findUnique = originalFind;
  }
});
