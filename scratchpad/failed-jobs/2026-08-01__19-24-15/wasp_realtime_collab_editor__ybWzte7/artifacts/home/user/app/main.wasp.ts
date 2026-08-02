import { app, page, route, query, action } from "@wasp.sh/spec";
import { userSignupFields } from "./src/auth/signup" with { type: "ref" };
import { SignupPage } from "./src/auth/SignupPage" with { type: "ref" };
import { LoginPage } from "./src/auth/LoginPage" with { type: "ref" };
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { DocumentPage } from "./src/DocumentPage" with { type: "ref" };
import { webSocketFn } from "./src/websocketSetup" with { type: "ref" };

import {
  getDocuments,
  getDocument,
  getDocumentPermissions,
} from "./src/queries" with { type: "ref" };

import {
  createDocument,
  updateDocumentContent,
  saveVersion,
  restoreVersion,
  shareDocument,
  revokePermission,
} from "./src/actions" with { type: "ref" };

export default app({
  name: "app",
  title: "Real-time Collaborative Document Editor",
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

    query(getDocuments, { entities: ["User", "Document", "Permission"] }),
    query(getDocument, { entities: ["User", "Document", "Version", "Permission"] }),
    query(getDocumentPermissions, { entities: ["User", "Document", "Permission"] }),

    action(createDocument, { entities: ["User", "Document"] }),
    action(updateDocumentContent, { entities: ["User", "Document"] }),
    action(saveVersion, { entities: ["User", "Document", "Version"] }),
    action(restoreVersion, { entities: ["User", "Document", "Version"] }),
    action(shareDocument, { entities: ["User", "Document", "Permission"] }),
    action(revokePermission, { entities: ["User", "Document", "Permission"] }),
  ],
});
