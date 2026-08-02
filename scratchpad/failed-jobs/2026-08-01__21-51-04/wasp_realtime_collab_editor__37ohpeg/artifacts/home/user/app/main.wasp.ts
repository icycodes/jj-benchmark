import { app, page, route, query, action } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { DocumentPage } from "./src/DocumentPage" with { type: "ref" };
import { SignupPage } from "./src/SignupPage" with { type: "ref" };
import { LoginPage } from "./src/LoginPage" with { type: "ref" };

import { getDocuments, getDocument, getVersions, getPermissions } from "./src/queries" with { type: "ref" };
import { createDocument, shareDocument, revokePermission, saveVersion, restoreVersion } from "./src/actions" with { type: "ref" };
import { userSignupFields } from "./src/auth" with { type: "ref" };
import { webSocketFn } from "./src/webSocket" with { type: "ref" };

export default app({
  name: "app",
  title: "app",
  wasp: { version: "^0.24.0" },
  head: ["<link rel='icon' href='/favicon.ico' />"],
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {
        userSignupFields,
      },
    },
    onAuthFailedRedirectTo: "/login",
  },
  webSocket: {
    fn: webSocketFn,
    autoConnect: true,
  },
  spec: [
    route("SignupRoute", "/signup", page(SignupPage)),
    route("LoginRoute", "/login", page(LoginPage)),
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("DocumentRoute", "/document/:id", page(DocumentPage, { authRequired: true })),

    query(getDocuments, { entities: ["Document", "Permission"] }),
    query(getDocument, { entities: ["Document", "Permission"] }),
    query(getVersions, { entities: ["Document", "Version"] }),
    query(getPermissions, { entities: ["Document", "Permission"] }),

    action(createDocument, { entities: ["Document"] }),
    action(shareDocument, { entities: ["Document", "Permission", "User"] }),
    action(revokePermission, { entities: ["Document", "Permission"] }),
    action(saveVersion, { entities: ["Document", "Version"] }),
    action(restoreVersion, { entities: ["Document", "Version"] }),
  ],
});
