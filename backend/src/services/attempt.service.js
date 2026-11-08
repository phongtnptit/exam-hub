
import prisma from "../lib/prisma.js";

export const normalizeAnswers = (answers) => {
  if (
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  ) {
    return {};
  }

  return answers;
};

const gradeOnce = async (
  attemptId,
  submittedAt = new Date()
) => {
  if (
    !Number.isSafeInteger(attemptId) ||
    attemptId <= 0
  ) {
    throw new Error("INVALID_ATTEMPT_ID");
  }

  // Thử lấy kết quả đã tồn tại trước khi chấm.
  const existingResult = await prisma.result.findUnique({
    where: { attemptId }
  });

  if (existingResult) {
    return existingResult;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM exam_attempts WHERE id = ${attemptId} FOR UPDATE`;
      const attempt = await tx.examAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          userId: true,
          examId: true,
          status: true,
          answers: true,
          questionSnapshot: true,
          startedAt: true,
          expiresAt: true
        }
      });

      if (!attempt) {
        throw new Error("ATTEMPT_NOT_FOUND");
      }

      // Kiểm tra xem lượt làm đã có kết quả chưa.
      const result = await tx.result.findUnique({
        where: { attemptId }
      });

      if (result) {
        return result;
      }

      if (attempt.status !== "IN_PROGRESS") {
        throw new Error("ATTEMPT_ALREADY_FINISHED");
      }

      const questions = attempt.questionSnapshot;

      if (
        !Array.isArray(questions) ||
        questions.length === 0
      ) {
        throw new Error("INVALID_QUESTION_SNAPSHOT");
      }

      const answers = normalizeAnswers(attempt.answers);

      const total = questions.length;
      let correct = 0;

      for (const question of questions) {
        const selectedAnswer = answers[String(question.id)];

        if (
          selectedAnswer === question.correctAnswer
        ) {
          correct++;
        }
      }

      // Thang điểm 10, làm tròn 1 chữ số thập phân.
      const score =
        Math.round((correct / total) * 100) / 10;

      // Chỉ một request được chuyển trạng thái.
      const updated = await tx.examAttempt.updateMany({
        where: {
          id: attemptId,
          status: "IN_PROGRESS"
        },
        data: {
          status:
            submittedAt >= attempt.expiresAt
              ? "EXPIRED"
              : "SUBMITTED",
          activeKey: null,
          submittedAt
        }
      });

      if (updated.count !== 1) {
        throw new Error("ATTEMPT_ALREADY_FINISHED");
      }

      // Result.attemptId có unique constraint.
      return tx.result.create({
        data: {
          userId: attempt.userId,
          examId: attempt.examId,
          attemptId: attempt.id,
          answers,
          score,
          total,
          correct,
          startedAt: attempt.startedAt,
          submittedAt
        }
      });
    });
  } catch (error) {
    // Request khác có thể vừa chấm xong.
    // Đọc lại kết quả đã được commit.
    if (
      error.message === "ATTEMPT_ALREADY_FINISHED" ||
      error.code === "P2002" ||
      error.code === "P2034"
    ) {
      const result = await prisma.result.findUnique({
        where: { attemptId }
      });

      if (result) {
        return result;
      }
    }

    throw error;
  }
};

// Thử lại khi MySQL hủy transaction do tranh chấp khóa.
export const gradeAttempt = async (attemptId, submittedAt = new Date()) => {
  for (let retry = 0; ; retry++) {
    try {
      return await gradeOnce(attemptId, submittedAt);
    } catch (error) {
      if (error.code !== "P2034" || retry >= 2) throw error;
    }
  }
};

// Chấm bù bài hết giờ khi quay lại lịch sử, kể cả đã đóng tab.
export const gradeExpiredAttempts = async (userId) => {
  const attempts = await prisma.examAttempt.findMany({
    where: {
      ...(userId === undefined ? {} : { userId }),
      status: "IN_PROGRESS",
      expiresAt: { lte: new Date() }
    },
    select: { id: true, questionSnapshot: true }
  });
  for (const attempt of attempts) {
    // Dữ liệu cũ không có snapshot không đủ căn cứ để chấm lại.
    if (Array.isArray(attempt.questionSnapshot) && attempt.questionSnapshot.length > 0) {
      await gradeAttempt(attempt.id);
    }
  }
};
