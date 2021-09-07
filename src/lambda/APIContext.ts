import React, { useContext } from "react";
import { RequestParams } from "./types";

interface APIContextValue {
  get<T>(name: string, params?: RequestParams): Promise<T>;
  post<T>(name: string, params?: RequestParams): Promise<T>;
  put<T>(name: string, params?: RequestParams): Promise<T>;
  del<T>(name: string, params?: RequestParams): Promise<T>;
}

export const APIContext = React.createContext<APIContextValue>(
  {} as APIContextValue
);
export const useAPI = (): APIContextValue =>
  useContext<APIContextValue>(APIContext);
