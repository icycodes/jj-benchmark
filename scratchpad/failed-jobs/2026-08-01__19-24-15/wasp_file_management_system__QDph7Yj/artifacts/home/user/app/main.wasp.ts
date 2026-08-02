import { app, page, route, query, action, api, apiNamespace } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { FolderPage } from "./src/FolderPage" with { type: "ref" };
import { LogsPage } from "./src/LogsPage" with { type: "ref" };
import { SharePage } from "./src/SharePage" with { type: "ref" };
import { LoginPage } from "./src/LoginPage" with { type: "ref" };
import { SignupPage } from "./src/SignupPage" with { type: "ref" };

import { getFolderContent, getAccessLogs, getShareLink } from "./src/queries" with { type: "ref" };
import { createFolder, createShareLink, uploadFileMetadata } from "./src/actions" with { type: "ref" };
import { configureFileUploadMiddleware, uploadFile, downloadFile } from "./src/apis" with { type: "ref" };

export default app({
  name: "app",
  wasp: { version: "^0.25.0" },
  title: "Wasp File Manager",
  head: ["<link rel='icon' href='/favicon.ico' />"],
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {},
    },
    onAuthFailedRedirectTo: "/login",
  },
  spec: [
    route("SignupRoute", "/signup", page(SignupPage)),
    route("LoginRoute", "/login", page(LoginPage)),
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("FolderRoute", "/folder/:folderId", page(FolderPage, { authRequired: true })),
    route("LogsRoute", "/logs", page(LogsPage, { authRequired: true })),
    route("ShareRoute", "/share/:linkId", page(SharePage)),

    query(getFolderContent, { entities: ["Folder", "File"] }),
    query(getAccessLogs, { entities: ["AccessLog", "ShareLink", "File"] }),
    query(getShareLink, { entities: ["ShareLink", "File"] }),

    action(createFolder, { entities: ["Folder"] }),
    action(createShareLink, { entities: ["ShareLink", "File"] }),
    action(uploadFileMetadata, { entities: ["File"] }),

    apiNamespace("/api/upload", { middlewareConfigFn: configureFileUploadMiddleware }),
    api("POST", "/api/upload", uploadFile, { entities: ["File"], auth: true }),
    api("GET", "/api/download/:linkId", downloadFile, { entities: ["ShareLink", "AccessLog", "File"], auth: false }),
  ],
});
