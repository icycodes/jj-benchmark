import { useParams } from "react-router";
import { DriveDashboard } from "./DriveDashboard";

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const parsedFolderId = folderId ? Number(folderId) : null;

  return <DriveDashboard folderId={parsedFolderId} />;
}
