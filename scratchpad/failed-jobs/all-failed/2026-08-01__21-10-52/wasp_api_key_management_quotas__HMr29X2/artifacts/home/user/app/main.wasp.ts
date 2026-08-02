import { app, page, route, query, action, api } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { LoginPage } from "./src/LoginPage" with { type: "ref" };
import { SignupPage } from "./src/SignupPage" with { type: "ref" };
import { getApiKeys } from "./src/queries" with { type: "ref" };
import { createApiKey, deleteApiKey } from "./src/actions" with { type: "ref" };
import { apiRequestHandler } from "./src/apis" with { type: "ref" };
import { devSeedSimple } from "./src/dbSeeds" with { type: "ref" };

export default app({
  name: "app",
  title: "Developer API Key Portal",
  wasp: { version: "^0.24.0" },
  head: ["<link rel='icon' href='/favicon.ico' />"],
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {},
    },
    onAuthFailedRedirectTo: "/login",
  },
  db: {
    seeds: [devSeedSimple],
  },
  spec: [
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("LoginRoute", "/login", page(LoginPage)),
    route("SignupRoute", "/signup", page(SignupPage)),
    query(getApiKeys, { entities: ["ApiKey", "ApiLog"] }),
    action(createApiKey, { entities: ["ApiKey"] }),
    action(deleteApiKey, { entities: ["ApiKey", "ApiLog"] }),
    api("GET", "/api/request", apiRequestHandler, { entities: ["ApiKey", "ApiLog"], auth: false }),
  ],
});
