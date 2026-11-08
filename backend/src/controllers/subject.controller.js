import prisma from "../lib/prisma.js";

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        id: "desc"
      }
    });

    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, description } = req.body ?? {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      (description !== undefined &&
        description !== null &&
        typeof description !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Tên môn học phải có từ 2 đến 100 ký tự"
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        description:
          typeof description === "string"
            ? description.trim()
            : null
      }
    });

    return res.status(201).json({
      success: true,
      message: "Thêm môn học thành công",
      data: subject
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Tên môn học đã tồn tại"
      });
    }

    next(error);
  }
};
export const updateSubject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body ?? {};

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID môn học không hợp lệ"
      });
    }

    if (name === undefined && description === undefined) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp thông tin để cập nhật"
      });
    }

    const data = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Tên môn học phải có từ 2 đến 100 ký tự"
        });
      }

      data.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Mô tả môn học không hợp lệ"
        });
      }

      data.description =
        typeof description === "string"
          ? description.trim()
          : null;
    }

    const subject = await prisma.subject.update({
      where: { id },
      data
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật môn học thành công",
      data: subject
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học"
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Tên môn học đã tồn tại"
      });
    }

    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID môn học không hợp lệ"
      });
    }

    await prisma.subject.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Xóa môn học thành công"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học"
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message:
          "Không thể xóa môn học vì đang có câu hỏi hoặc đề thi liên quan"
      });
    }

    next(error);
  }
};