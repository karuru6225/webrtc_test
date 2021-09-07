import React from "react";
import API from "@aws-amplify/api";
import { APIContext } from "./APIContext";
import { ApiConfig, RequestParams } from "./types";

interface Props {
  apiConfig: ApiConfig;
  children: React.ReactNode;
}

export const APIProvider: React.FC<Props> = (props: Props) => {
  const { apiConfig } = props;
  const { apis } = apiConfig;

  const findApi = (name: string) => {
    const apiConfig = apis.find(({ name: n }) => n === name);
    if (!apiConfig) {
      throw new Error("api not found");
    }
    return apiConfig;
  };

  const getParams = async (params?: RequestParams) => {
    let headers = { };
    if (params && params.headers) {
      headers = {
        ...params.headers,
        ...headers,
      };
    }
    console.log("getParams", { params, headers });
    return {
      ...params,
      headers,
    };
  };

  const apiMethods = {
    get: async (name: string, params?: RequestParams) => {
      const { path } = findApi(name);
      const _params = await getParams(params);
      console.log(_params);
      return API.get(name, path, _params);
    },
    post: async (name: string, params?: RequestParams) => {
      const { path } = findApi(name);
      const _params = await getParams(params);
      return API.post(name, path, _params);
    },
    put: async (name: string, params?: RequestParams) => {
      const { path } = findApi(name);
      const _params = await getParams(params);
      return API.put(name, path, _params);
    },
    del: async (name: string, params?: RequestParams) => {
      const { path } = findApi(name);
      const _params = await getParams(params);
      return API.del(name, path, _params);
    },
  };

  return (
    <APIContext.Provider value={apiMethods}>
      {props.children}
    </APIContext.Provider>
  );
};
