import prisma from "../lib/prisma.js";

export const getAdminExams = async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            examQuestions: true
          }
        }
      },
      orderBy: {
        id: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: exams
    });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const {
      subjectId,
      title,
      description,
      durationMinutes
    } = req.body ?? {};

    const parsedSubjectId = Number(subjectId);
    const parsedDuration = Number(durationMinutes);

    if (
      !Number.isSafeInteger(parsedSubjectId) ||
      parsedSubjectId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID môn học không hợp lệ"
      });
    }

    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      title.trim().length > 191
    ) {
      return res.status(400).json({
        success: false,
        message: "Tên đề thi phải có từ 3 đến 191 ký tự"
      });
    }

    if (
      !Number.isSafeInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 300
    ) {
      return res.status(400).json({
        success: false,
        message: "Thời gian làm bài phải từ 1 đến 300 phút"
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mô tả đề thi không hợp lệ"
      });
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id: parsedSubjectId
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học"
      });
    }

    const exam = await prisma.exam.create({
      data: {
        subjectId: parsedSubjectId,
        title: title.trim(),
        description:
          typeof description === "string"
            ? description.trim()
            : null,
        durationMinutes: parsedDuration,
        status: "DRAFT"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Tạo đề thi thành công",
      data: exam
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(404).json({
        success: false,
        message: "Môn học không còn tồn tại"
      });
    }

    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    // Chỉ cho phép chỉnh sửa đề thi đang ở trạng thái DRAFT
    if (exam.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Chỉ được chỉnh sửa đề thi ở trạng thái DRAFT"
      });
    }

    const {
      subjectId,
      title,
      description,
      durationMinutes
    } = req.body ?? {};

    const data = {};

    if (subjectId !== undefined) {
      const parsedSubjectId = Number(subjectId);

      if (
        !Number.isSafeInteger(parsedSubjectId) ||
        parsedSubjectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "ID môn học không hợp lệ"
        });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: parsedSubjectId }
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy môn học"
        });
      }

      // Không cho chuyển môn học khi đề đã chứa câu hỏi
      if (parsedSubjectId !== exam.subjectId) {
        const questionCount = await prisma.examQuestion.count({
          where: { examId: id }
        });

        if (questionCount > 0) {
          return res.status(409).json({
            success: false,
            message:
              "Không thể đổi môn học khi đề thi đã có câu hỏi"
          });
        }
      }

      data.subjectId = parsedSubjectId;
    }

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        title.trim().length < 3 ||
        title.trim().length > 191
      ) {
        return res.status(400).json({
          success: false,
          message: "Tên đề thi phải có từ 3 đến 191 ký tự"
        });
      }

      data.title = title.trim();
    }

    if (description !== undefined) {
      if (
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Mô tả đề thi không hợp lệ"
        });
      }

      data.description =
        typeof description === "string"
          ? description.trim()
          : null;
    }

    if (durationMinutes !== undefined) {
      const duration = Number(durationMinutes);

      if (
        !Number.isSafeInteger(duration) ||
        duration < 1 ||
        duration > 300
      ) {
        return res.status(400).json({
          success: false,
          message: "Thời gian làm bài phải từ 1 đến 300 phút"
        });
      }

      data.durationMinutes = duration;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật"
      });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật đề thi thành công",
      data: updatedExam
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Môn học không hợp lệ"
      });
    }

    next(error);
  }
};
export const deleteExam = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            results: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (exam.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Chỉ được xóa đề thi ở trạng thái DRAFT"
      });
    }

    if (exam._count.results > 0) {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa đề thi đã có kết quả làm bài"
      });
    }

    await prisma.exam.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Xóa đề thi thành công"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Không thể xóa đề thi vì có dữ liệu liên quan"
      });
    }

    next(error);
  }
};
export const addQuestionToExam = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);
    const questionId = Number(req.body?.questionId);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    if (!Number.isSafeInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID câu hỏi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (exam.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Chỉ được thêm câu hỏi vào đề thi DRAFT"
      });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu hỏi"
      });
    }

    if (question.subjectId !== exam.subjectId) {
      return res.status(400).json({
        success: false,
        message: "Câu hỏi không thuộc môn học của đề thi"
      });
    }

    const existing = await prisma.examQuestion.findUnique({
      where: {
        examId_questionId: {
          examId,
          questionId
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Câu hỏi đã tồn tại trong đề thi"
      });
    }

    const lastQuestion = await prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { position: "desc" },
      select: { position: true }
    });

    const position = (lastQuestion?.position ?? 0) + 1;

    const examQuestion = await prisma.examQuestion.create({
      data: {
        examId,
        questionId,
        position
      },
      include: {
        question: {
          select: {
            id: true,
            content: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctAnswer: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: "Thêm câu hỏi vào đề thi thành công",
      data: examQuestion
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "Câu hỏi đã tồn tại hoặc vị trí câu hỏi bị trùng"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Đề thi hoặc câu hỏi không còn tồn tại"
      });
    }

    next(error);
  }
};

export const getExamQuestions = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        status: true,
        durationMinutes: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    const questions = await prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { position: "asc" },
      include: {
        question: {
          select: {
            id: true,
            subjectId: true,
            content: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctAnswer: true,
            explanation: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        exam,
        totalQuestions: questions.length,
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};
export const removeQuestionFromExam = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);
    const questionId = Number(req.params.questionId);

    if (
      !Number.isSafeInteger(examId) ||
      examId <= 0 ||
      !Number.isSafeInteger(questionId) ||
      questionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi hoặc câu hỏi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (exam.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Chỉ được xóa câu hỏi khỏi đề thi DRAFT"
      });
    }

    const examQuestion = await prisma.examQuestion.findUnique({
      where: {
        examId_questionId: {
          examId,
          questionId
        }
      }
    });

    if (!examQuestion) {
      return res.status(404).json({
        success: false,
        message: "Câu hỏi không tồn tại trong đề thi"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.examQuestion.delete({
        where: {
          examId_questionId: {
            examId,
            questionId
          }
        }
      });

      // Đánh lại vị trí liên tiếp sau khi xóa
      const remaining = await tx.examQuestion.findMany({
        where: { examId },
        orderBy: { position: "asc" }
      });

      for (let i = 0; i < remaining.length; i++) {
        const newPosition = i + 1;

        if (remaining[i].position !== newPosition) {
          await tx.examQuestion.update({
            where: { id: remaining[i].id },
            data: { position: newPosition }
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Xóa câu hỏi khỏi đề thi thành công"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Câu hỏi không còn tồn tại trong đề thi"
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Xung đột vị trí câu hỏi, vui lòng thử lại"
      });
    }

    next(error);
  }
};
export const publishExam = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            examQuestions: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    if (exam.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Chỉ có thể xuất bản đề thi DRAFT"
      });
    }

    if (exam._count.examQuestions === 0) {
      return res.status(400).json({
        success: false,
        message: "Đề thi phải có ít nhất một câu hỏi trước khi xuất bản"
      });
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        status: "PUBLISHED"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Xuất bản đề thi thành công",
      data: updatedExam
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    next(error);
  }
};

export const getPublishedExams = async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        status: "PUBLISHED"
      },
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            examQuestions: true
          }
        }
      },
      orderBy: {
        id: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: exams
    });
  } catch (error) {
    next(error);
  }
};

export const getPublishedExamDetail = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);

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
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        status: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            examQuestions: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi"
      });
    }

    return res.json({
      success: true,
      data: {
        ...exam,
        totalQuestions: exam._count.examQuestions,
        _count: undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

export const closeExam = async (req, res, next) => {
  try {
    const examId = Number(req.params.id);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID đề thi không hợp lệ"
      });
    }

    const updated = await prisma.exam.updateMany({
      where: {
        id: examId,
        status: "PUBLISHED"
      },
      data: {
        status: "CLOSED"
      }
    });

    if (updated.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Chỉ có thể đóng đề thi đang xuất bản"
      });
    }

    return res.json({
      success: true,
      message: "Đóng đề thi thành công"
    });
  } catch (error) {
    next(error);
  }
};
