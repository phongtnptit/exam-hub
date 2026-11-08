import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const createToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role
});

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body ?? {};

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đăng ký không hợp lệ"
      });
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100 ||
      normalizedEmail.length > 191 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Họ tên phải có 2-100 ký tự, email hợp lệ và mật khẩu có ít nhất 8 ký tự (tối đa 72 byte)"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Không nhận role từ client: đăng ký công khai chỉ tạo STUDENT.
    const user = await prisma.user.create({
      data: {
        fullName: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT"
      }
    });

    const token = createToken(user.id);

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: publicUser(user),
        token
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng"
      });
    }

    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không hợp lệ"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    const isValidPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác"
      });
    }

    const token = createToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: publicUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};