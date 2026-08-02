import { useParams } from "react-router";
import { Dashboard } from "./Dashboard";
import "./Main.css";

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  return <Dashboard folderId={folderId || null} />;
}
