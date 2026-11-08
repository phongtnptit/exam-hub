import prisma from "../lib/prisma.js";
import { gradeAttempt } from "../services/attempt.service.js";
import {
  createQuestionSnapshot,
  hideCorrectAnswers
} from "../services/exam-snapshot.service.js";

export const startExam = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        status: "PUBLISHED"
      },
      include: {
        examQuestions: {
          orderBy: { position: "asc" },
          include: { question: true }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi đang mở"
      });
    }

    if (exam.examQuestions.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Đề thi chưa có câu hỏi"
      });
    }

    const activeKey = `${userId}:${examId}`;
    const existing = await prisma.examAttempt.findUnique({
      where: { activeKey }
    });

    if (existing) {
      if (existing.expiresAt <= new Date()) {
        const result = await gradeAttempt(existing.id);
        return res.json({ success: true, data: { attemptId: existing.id, resultId: result.id } });
      } else {
        return res.json({
          success: true,
          message: "Tiếp tục bài thi",
          data: {
            attemptId: existing.id,
            examId,
            startedAt: existing.startedAt,
            expiresAt: existing.expiresAt,
            answers: existing.answers ?? {},
            questions: hideCorrectAnswers(
              existing.questionSnapshot ?? []
            )
          }
        });
      }
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + exam.durationMinutes * 60000
    );

    const snapshot = createQuestionSnapshot(
      exam.examQuestions
    );

    const attempt = await prisma.examAttempt.create({
      data: {
        userId,
        examId,
        activeKey,
        startedAt,
        expiresAt,
        answers: {},
        questionSnapshot: snapshot
      }
    });

    return res.status(201).json({
      success: true,
      message: "Bắt đầu làm bài thành công",
      data: {
        attemptId: attempt.id,
        examId,
        startedAt,
        expiresAt,
        answers: {},
        questions: hideCorrectAnswers(snapshot)
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      try {
        const attempt = await prisma.examAttempt.findUnique({
          where: { activeKey: req.user.id + ":" + Number(req.params.id) }
        });
        if (attempt) return res.json({ success: true, data: { attemptId: attempt.id } });
        return res.status(409).json({ success: false, message: "Lượt thi vừa thay đổi, vui lòng thử lại." });
      } catch (lookupError) { return next(lookupError); }
    }
    next(error);
  }
};

export const submitExam = async (req, res, next) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const userId = req.user.id;

    if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID lượt làm bài không hợp lệ"
      });
    }

    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lượt làm bài"
      });
    }

    const result = await gradeAttempt(attemptId);

    return res.json({
      success: true,
      message: "Nộp bài thành công",
      data: {
        resultId: result.id,
        score: result.score,
        total: result.total,
        correct: result.correct,
        incorrect: result.total - result.correct
      }
    });
  } catch (error) {
    if (error.message === "ATTEMPT_ALREADY_FINISHED") {
      return res.status(409).json({
        success: false,
        message: "Lượt làm bài đã kết thúc"
      });
    }

    next(error);
  }
};


export const saveAttemptAnswers = async (req, res, next) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const userId = req.user.id;
    const answers = req.body?.answers;

    // 1. Kiểm tra ID lượt làm bài
    if (
      !Number.isSafeInteger(attemptId) ||
      attemptId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID lượt làm bài không hợp lệ"
      });
    }

    // 2. Kiểm tra dữ liệu đáp án
    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu câu trả lời không hợp lệ"
      });
    }

    // 3. Lấy lượt làm bài thuộc sinh viên
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId
      },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        questionSnapshot: true
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lượt làm bài"
      });
    }

    // 4. Kiểm tra trạng thái
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(409).json({
        success: false,
        message: "Lượt làm bài đã kết thúc"
      });
    }

    // 5. Kiểm tra hết thời gian
    if (new Date() >= attempt.expiresAt) {
      const result = await gradeAttempt(attempt.id);

      return res.status(409).json({
        success: false,
        code: "EXAM_EXPIRED",
        message: "Bài thi đã hết giờ và được chấm điểm",
        data: {
          resultId: result.id
        }
      });
    }

    // 6. Lấy danh sách câu hỏi từ snapshot
    const snapshot = attempt.questionSnapshot;

    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Dữ liệu câu hỏi của lượt thi không hợp lệ"
      });
    }

    const validIds = new Set(
      snapshot.map((question) => String(question.id))
    );

    // 7. Kiểm tra từng câu trả lời
    for (const [questionId, answer] of Object.entries(answers)) {
      if (
        !validIds.has(questionId) ||
        !["A", "B", "C", "D"].includes(answer)
      ) {
        return res.status(400).json({
          success: false,
          message: `Câu trả lời không hợp lệ: ${questionId}`
        });
      }
    }

    // 8. Lưu đáp án nếu lượt thi còn hiệu lực
    const updated = await prisma.examAttempt.updateMany({
      where: {
        id: attemptId,
        userId,
        status: "IN_PROGRESS",
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        answers
      }
    });

    // 9. Xử lý khi không cập nhật được
    if (updated.count !== 1) {
      const latestAttempt = await prisma.examAttempt.findFirst({
        where: {
          id: attemptId,
          userId
        },
        select: {
          id: true,
          status: true,
          expiresAt: true
        }
      });

      if (
        latestAttempt?.status === "IN_PROGRESS" &&
        new Date() >= latestAttempt.expiresAt
      ) {
        const result = await gradeAttempt(attemptId);

        return res.status(409).json({
          success: false,
          code: "EXAM_EXPIRED",
          message: "Bài thi đã hết giờ và được chấm điểm",
          data: {
            resultId: result.id
          }
        });
      }

      return res.status(409).json({
        success: false,
        message: "Lượt làm bài đã kết thúc hoặc không thể lưu đáp án"
      });
    }

    // 10. Lưu thành công
    return res.status(200).json({
      success: true,
      message: "Lưu câu trả lời thành công"
    });
  } catch (error) {
    next(error);
  }
};


export const getAttemptDetail = async (req, res, next) => {
  try {
    const attemptId = Number(req.params.attemptId);

    if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID lượt làm bài không hợp lệ"
      });
    }

    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId: req.user.id
      },
      select: {
        id: true,
        examId: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        answers: true,
        questionSnapshot: true,
        exam: {
          select: {
            title: true,
            durationMinutes: true
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lượt làm bài"
      });
    }

    if (
      attempt.status === "IN_PROGRESS" &&
      attempt.expiresAt <= new Date()
    ) {
      const result = await gradeAttempt(attempt.id);

      return res.json({
        success: true,
        data: {
          attemptId: attempt.id,
          examId: attempt.examId,
          status: "EXPIRED",
          resultId: result.id
        }
      });
    }

    if (attempt.status !== "IN_PROGRESS") {
      const result = await prisma.result.findUnique({
        where: { attemptId: attempt.id },
        select: { id: true }
      });

      return res.json({
        success: true,
        data: {
          attemptId: attempt.id,
          examId: attempt.examId,
          status: attempt.status,
          resultId: result?.id ?? null
        }
      });
    }

    return res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        examId: attempt.examId,
        title: attempt.exam.title,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        serverTime: new Date(),
        answers: attempt.answers ?? {},
        questions: hideCorrectAnswers(
          attempt.questionSnapshot ?? []
        )
      }
    });
  } catch (error) {
    next(error);
  }
};