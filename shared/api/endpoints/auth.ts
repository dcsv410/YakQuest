import type { ApiClient } from "../../network";
import type {
  AuthResponseDTO,
  AuthUserDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
} from "../../dto";

export const authApi = {
  login(
    client: ApiClient,
    payload: LoginRequestDTO
  ): Promise<AuthResponseDTO> {
    return client.post<AuthResponseDTO, LoginRequestDTO>(
      "/auth/login",
      payload
    );
  },

  register(
    client: ApiClient,
    payload: RegisterRequestDTO
  ): Promise<AuthResponseDTO> {
    return client.post<AuthResponseDTO, RegisterRequestDTO>(
      "/auth/register",
      payload
    );
  },

  me(client: ApiClient): Promise<AuthUserDTO> {
    return client.get<AuthUserDTO>("/auth/me");
  },
};