import { app, page, route, query, action, api } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { FolderPage } from "./src/FolderPage" with { type: "ref" };
import { LogsPage } from "./src/LogsPage" with { type: "ref" };
import { SharePage } from "./src/SharePage" with { type: "ref" };
import { LoginPage } from "./src/LoginPage" with { type: "ref" };
import { SignupPage } from "./src/SignupPage" with { type: "ref" };

import { getFolderContents, getAccessLogs, getShareLinkDetails } from "./src/queries" with { type: "ref" };
import { createFolder, createShareLink } from "./src/actions" with { type: "ref" };
import { uploadFile, downloadFile } from "./src/apis" with { type: "ref" };

export default app({
  name: "app",
  wasp: { version: "^0.25.0" },
  title: "Wasp Drive",
  head: ["<link rel='icon' href='/favicon.ico' />"],
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {},
    },
    onAuthFailedRedirectTo: "/login",
  },
  spec: [
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("FolderRoute", "/folder/:folderId", page(FolderPage, { authRequired: true })),
    route("LogsRoute", "/logs", page(LogsPage, { authRequired: true })),
    route("ShareRoute", "/share/:linkId", page(SharePage, { authRequired: false })),
    route("LoginRoute", "/login", page(LoginPage, { authRequired: false })),
    route("SignupRoute", "/signup", page(SignupPage, { authRequired: false })),

    query(getFolderContents, { entities: ["Folder", "File"] }),
    query(getAccessLogs, { entities: ["AccessLog", "ShareLink", "File"] }),
    query(getShareLinkDetails, { entities: ["ShareLink", "File"], auth: false }),

    action(createFolder, { entities: ["Folder"] }),
    action(createShareLink, { entities: ["ShareLink", "File"] }),

    api("POST", "/api/upload", uploadFile, { entities: ["File", "Folder"], auth: true }),
    api("GET", "/api/download/:linkId", downloadFile, { entities: ["ShareLink", "File", "AccessLog"], auth: false }),
  ],
});
