import React from "react";
import { useParams } from "react-router";
import { FolderView } from "./FolderView";

export const FolderPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const parsedFolderId = folderId ? parseInt(folderId, 10) : null;

  return <FolderView folderId={parsedFolderId} />;
};
