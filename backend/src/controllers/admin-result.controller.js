
import prisma from "../lib/prisma.js";
import { gradeExpiredAttempts } from "../services/attempt.service.js";

export const getAllResults = async (req, res, next) => {
  try {
    await gradeExpiredAttempts();
    const results = await prisma.result.findMany({
      orderBy: {
        submittedAt: "desc"
      },
      select: {
        id: true,
        score: true,
        total: true,
        correct: true,
        startedAt: true,
        submittedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
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

export const getAdminResultDetail = async (req, res, next) => {
  try {
    const resultId = Number(req.params.id);

    if (!Number.isSafeInteger(resultId) || resultId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID kết quả không hợp lệ"
      });
    }

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        exam: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        },
        attempt: {
          select: {
            status: true,
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

    const questions = (
      Array.isArray(result.attempt?.questionSnapshot)
        ? result.attempt.questionSnapshot
        : []
    ).map((question) => ({
      id: question.id,
      content: question.content,
      selectedAnswer:
        result.answers?.[String(question.id)] ?? null,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    }));

    return res.json({
      success: true,
      data: {
        id: result.id,
        student: result.user,
        exam: result.exam,
        status: result.attempt?.status ?? null,
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
