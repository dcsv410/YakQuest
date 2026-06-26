import type { LoginRequestDTO, RegisterRequestDTO } from "../dto";
import { invalid } from "./types";

export function validateLogin(payload: LoginRequestDTO) {
  const errors: string[] = [];

  if (!payload.email.trim()) {
    errors.push("Email is required.");
  }

  if (!payload.password.trim()) {
    errors.push("Password is required.");
  }

  return invalid(errors);
}

export function validateRegister(payload: RegisterRequestDTO) {
  const errors: string[] = [];

  if (!payload.email.trim()) {
    errors.push("Email is required.");
  }

  if (!payload.password.trim()) {
    errors.push("Password is required.");
  }

  if (payload.password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return invalid(errors);
}