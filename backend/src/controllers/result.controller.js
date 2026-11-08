import prisma from "../lib/prisma.js";
import { gradeExpiredAttempts } from "../services/attempt.service.js";

export const getMyResults = async (req, res, next) => {
  try {
    await gradeExpiredAttempts(req.user.id);
    const results = await prisma.result.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        submittedAt: "desc"
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const getMyResultDetail = async (req, res, next) => {
  try {
    const resultId = Number(req.params.id);

    if (!Number.isSafeInteger(resultId) || resultId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID kết quả không hợp lệ"
      });
    }

    const result = await prisma.result.findFirst({
      where: {
        id: resultId,
        userId: req.user.id
      },
      include: {
        exam: {
          include: {
            subject: true
          }
        },
        attempt: {
            select: {
                questionSnapshot: true
            }
        }
      }
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả"
      });
    }

    const snapshot = Array.isArray(result.attempt?.questionSnapshot)
      ? result.attempt.questionSnapshot : [];

    const questions = snapshot.map((question) => ({
    id: question.id,
    content: question.content,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    selectedAnswer:
        result.answers?.[String(question.id)] ?? null,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation
    }));

    return res.json({
      success: true,
      data: {
        id: result.id,
        examId: result.examId,
        examTitle: result.exam.title,
        subject: result.exam.subject.name,
        score: result.score,
        total: result.total,
        correct: result.correct,
        startedAt: result.startedAt,
        submittedAt: result.submittedAt,
        reviewAvailable: questions.length > 0,
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};