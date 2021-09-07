import React, { useContext } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";

interface AuthContextValue {
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<CognitoUser | undefined | void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string>;
  isAuthenticated: boolean;
  isNewPasswordRequired: boolean;
  isLoading: boolean;
  error?: Error | null;
  user?: CognitoUser | null;
}

export const AuthContext = React.createContext<AuthContextValue>(
  {} as AuthContextValue
);

export const useAuth = (): AuthContextValue =>
  useContext<AuthContextValue>(AuthContext);
