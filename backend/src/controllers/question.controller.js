import prisma from "../lib/prisma.js";

export const getQuestions = async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        id: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const {
      subjectId,
      content,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation
    } = req.body ?? {};

    const id = Number(subjectId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID môn học không hợp lệ"
      });
    }

    const requiredFields = {
      content,
      optionA,
      optionB,
      optionC,
      optionD
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `Trường ${field} không được để trống`
        });
      }
    }

    if (
      typeof correctAnswer !== "string" ||
      !["A", "B", "C", "D"].includes(correctAnswer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Đáp án đúng phải là A, B, C hoặc D"
      });
    }

    if (
      explanation !== undefined &&
      explanation !== null &&
      typeof explanation !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Giải thích đáp án không hợp lệ"
      });
    }

    const subject = await prisma.subject.findUnique({
      where: { id }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học"
      });
    }

    const question = await prisma.question.create({
      data: {
        subjectId: id,
        content: content.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer,
        explanation:
          typeof explanation === "string"
            ? explanation.trim()
            : null
      }
    });

    return res.status(201).json({
      success: true,
      message: "Thêm câu hỏi thành công",
      data: question
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
export const updateQuestion = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID câu hỏi không hợp lệ"
      });
    }

    const {
      subjectId,
      content,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation
    } = req.body ?? {};

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { examQuestions: { include: { exam: { select: { status: true } } } } }
    });
    if (!existing) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });
    if (existing.examQuestions.some((item) => item.exam.status !== "DRAFT")) {
      return res.status(409).json({ success: false, message: "Không được sửa câu hỏi thuộc đề PUBLISHED hoặc CLOSED" });
    }
    if (subjectId !== undefined && Number(subjectId) !== existing.subjectId && existing.examQuestions.length > 0) {
      return res.status(409).json({ success: false, message: "Không thể đổi môn của câu hỏi đang thuộc đề thi" });
    }
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

      data.subjectId = parsedSubjectId;
    }

    const textFields = [
      "content",
      "optionA",
      "optionB",
      "optionC",
      "optionD"
    ];

    const input = {
      content,
      optionA,
      optionB,
      optionC,
      optionD
    };

    for (const field of textFields) {
      if (input[field] !== undefined) {
        if (
          typeof input[field] !== "string" ||
          !input[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `Trường ${field} không được để trống`
          });
        }

        data[field] = input[field].trim();
      }
    }

    if (correctAnswer !== undefined) {
      if (
        typeof correctAnswer !== "string" ||
        !["A", "B", "C", "D"].includes(correctAnswer)
      ) {
        return res.status(400).json({
          success: false,
          message: "Đáp án đúng phải là A, B, C hoặc D"
        });
      }

      data.correctAnswer = correctAnswer;
    }

    if (explanation !== undefined) {
      if (
        explanation !== null &&
        typeof explanation !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Giải thích đáp án không hợp lệ"
        });
      }

      data.explanation =
        typeof explanation === "string"
          ? explanation.trim()
          : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có dữ liệu để cập nhật"
      });
    }

    const question = await prisma.question.update({
      where: { id },
      data
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công",
      data: question
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu hỏi"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Môn học không hợp lệ hoặc không còn tồn tại"
      });
    }

    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID câu hỏi không hợp lệ"
      });
    }

    await prisma.question.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Xóa câu hỏi thành công"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu hỏi"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message:
          "Không thể xóa câu hỏi vì đang được sử dụng trong đề thi"
      });
    }

    next(error);
  }
};