import devConfigs from "./stack.dev.json";
import prdConfigs from "./stack.prod.json";

const { ServiceEndpoint } = (() => {
  switch (process.env.NODE_ENV) {
    case "production":
      return prdConfigs;
    case "development":
    default:
      return devConfigs;
  }
})();

const api_config = {
  entryPoint: ServiceEndpoint || "",
  apis: [
    {
      name: "getWithoutAuth",
      path: "/withoutAuth",
    },
    {
      name: "getWithAuth",
      path: "/withAuth",
    },
    {
      name: "getWsUrl",
      path: "/wsUrl",
    },
    {
      name: "getIceUrl",
      path: "/iceUrl",
    },
  ],
};

export default api_config;
