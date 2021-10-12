import devConfigs from "./stack.dev.json";
import prdConfigs from "./stack.prod.json";

const { UserPoolClientId, UserPoolId } = (() => {
  switch (process.env.NODE_ENV) {
    case "production":
      return prdConfigs;
    case "development":
    default:
      return devConfigs;
  }
})();

const aws_config = {
  Auth: {
    userPoolId: UserPoolId,
    userPoolWebClientId: UserPoolClientId,
    region: "ap-northeast-1",
    authenticationFlowType: "USER_PASSWORD_AUTH",
  },
};

export default aws_config;
