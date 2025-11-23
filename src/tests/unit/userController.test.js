// WHITE BOX TESTS - Unit tests for userController
// Testing internal implementation and code paths

import { describe, test, expect, jest, beforeEach, beforeAll, afterAll } from "@jest/globals";
import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword
} from "../../controllers/userController.js";
import User from "../../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock dependencies - Note: For ES modules, mocks may need manual setup
// In a real scenario, you might use jest.mock with proper ES module handling

describe("userController - White Box Tests", () => {
  let req, res;
  let originalFindOne, originalCreate, originalHash, originalCompare, originalSign;

  beforeAll(() => {
    // Store original implementations
    originalFindOne = User.findOne;
    originalCreate = User.create;
    originalHash = bcrypt.hash;
    originalCompare = bcrypt.compare;
    originalSign = jwt.sign;
  });

  afterAll(() => {
    // Restore original implementations
    User.findOne = originalFindOne;
    User.create = originalCreate;
    bcrypt.hash = originalHash;
    bcrypt.compare = originalCompare;
    jwt.sign = originalSign;
  });

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    test("should hash password and create user with correct data structure", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890"
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");
      User.create = jest.fn().mockResolvedValue({
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        password_hash: "hashed_password",
        role: "standard",
        toObject: () => ({
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          role: "standard"
        })
      });

      await registerUser(req, res);

      // Verify bcrypt was called with correct parameters
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      
      // Verify User.create was called with correct structure
      expect(User.create).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        password_hash: "hashed_password",
        role: "standard"
      });

      // Verify password_hash is excluded from response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const responseCall = res.json.mock.calls[0][0];
      expect(responseCall.user).not.toHaveProperty("password_hash");
    });

    test("should check for duplicate email before creating", async () => {
      req.body = {
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
        phone: "1234567890"
      };

      User.findOne = jest.fn()
        .mockResolvedValueOnce({ email: "existing@example.com" }); // Email exists

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "existing@example.com" });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });

    test("should check for duplicate phone before creating", async () => {
      req.body = {
        name: "Test User",
        email: "new@example.com",
        password: "password123",
        phone: "1234567890"
      };

      User.findOne = jest.fn()
        .mockResolvedValueOnce(null) // Email doesn't exist
        .mockResolvedValueOnce({ phone: "1234567890" }); // Phone exists

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    test("should find user by email and compare password correctly", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123"
      };

      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password_hash: "hashed_password",
        role: "standard",
        toObject: () => ({
          _id: "user123",
          email: "test@example.com",
          role: "standard"
        })
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue("mock_token");

      await loginUser(req, res);

      // Verify user lookup by email
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      
      // Verify password comparison
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
      
      // Verify JWT token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "user123", role: "standard" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login exitoso",
          token: "mock_token"
        })
      );
    });

    test("should find user by phone when email is not provided", async () => {
      req.body = {
        phone: "1234567890",
        password: "password123"
      };

      const mockUser = {
        _id: "user123",
        phone: "1234567890",
        password_hash: "hashed_password",
        role: "standard",
        toObject: () => ({
          _id: "user123",
          phone: "1234567890",
          role: "standard"
        })
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue("mock_token");

      await loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ phone: "1234567890" });
    });

    test("should reject login when password doesn't match", async () => {
      req.body = {
        email: "test@example.com",
        password: "wrongpassword"
      };

      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password_hash: "hashed_password"
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await loginUser(req, res);

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Credenciales inválidas" })
      );
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    test("should generate OTP and save to user with expiration", async () => {
      req.body = { email: "test@example.com" };

      const mockUser = {
        password_reset_code: null,
        password_reset_expires: null,
        password_reset_attempts: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await forgotPassword(req, res);

      // Verify OTP was generated (6 digits)
      expect(mockUser.password_reset_code).toMatch(/^\d{6}$/);
      expect(mockUser.password_reset_expires).toBeInstanceOf(Date);
      
      // Verify expiration is 10 minutes from now
      const expectedExpiry = new Date(Date.now() + 10 * 60 * 1000);
      const timeDiff = Math.abs(mockUser.password_reset_expires - expectedExpiry);
      expect(timeDiff).toBeLessThan(1000); // Within 1 second

      expect(mockUser.save).toHaveBeenCalled();
    });

    test("should return same message for non-existent user (security)", async () => {
      req.body = { email: "nonexistent@example.com" };

      User.findOne = jest.fn().mockResolvedValue(null);

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "If the email exists, a verification code will be sent."
        })
      );
    });
  });

  describe("verifyResetCode", () => {
    test("should verify correct code and reset attempts counter", async () => {
      req.body = {
        email: "test@example.com",
        code: "123456"
      };

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const mockUser = {
        password_reset_code: "123456",
        password_reset_expires: futureDate,
        password_reset_attempts: 2,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await verifyResetCode(req, res);

      expect(mockUser.password_reset_attempts).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Code verified" })
      );
    });

    test("should increment attempts on wrong code", async () => {
      req.body = {
        email: "test@example.com",
        code: "wrongcode"
      };

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const mockUser = {
        password_reset_code: "123456",
        password_reset_expires: futureDate,
        password_reset_attempts: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await verifyResetCode(req, res);

      expect(mockUser.password_reset_attempts).toBe(2);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid code" })
      );
    });

    test("should reject after 5 failed attempts", async () => {
      req.body = {
        email: "test@example.com",
        code: "wrongcode"
      };

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const mockUser = {
        password_reset_code: "123456",
        password_reset_expires: futureDate,
        password_reset_attempts: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await verifyResetCode(req, res);

      expect(mockUser.password_reset_code).toBeNull();
      expect(mockUser.password_reset_expires).toBeNull();
      expect(mockUser.password_reset_attempts).toBe(0);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Too many attempts" })
      );
    });

    test("should reject expired code", async () => {
      req.body = {
        email: "test@example.com",
        code: "123456"
      };

      const pastDate = new Date(Date.now() - 1000); // Expired
      const mockUser = {
        password_reset_code: "123456",
        password_reset_expires: pastDate,
        password_reset_attempts: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await verifyResetCode(req, res);

      expect(mockUser.password_reset_code).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Code expired" })
      );
    });
  });

  describe("resetPassword", () => {
    test("should hash new password and clear reset fields", async () => {
      req.body = {
        email: "test@example.com",
        newPassword: "newpassword123"
      };

      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const mockUser = {
        password_hash: "old_hash",
        password_reset_code: "123456",
        password_reset_expires: futureDate,
        password_reset_attempts: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue("new_hashed_password");

      await resetPassword(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
      expect(mockUser.password_hash).toBe("new_hashed_password");
      expect(mockUser.password_reset_code).toBeNull();
      expect(mockUser.password_reset_expires).toBeNull();
      expect(mockUser.password_reset_attempts).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
