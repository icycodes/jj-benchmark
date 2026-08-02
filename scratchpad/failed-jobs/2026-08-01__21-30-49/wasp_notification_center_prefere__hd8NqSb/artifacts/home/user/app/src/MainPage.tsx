import { useState, useEffect } from "react";
import { useAuth, logout } from "wasp/client/auth";
import {
  useQuery,
  getNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  triggerNotificationEvent,
  batchUpdateNotificationStatus,
} from "wasp/client/operations";
import { useSocket, useSocketListener } from "wasp/client/webSocket";

export function MainPage() {
  const { data: user } = useAuth();
  const { data: notifications, refetch: refetchNotifications } = useQuery(getNotifications);
  const { data: preferences, refetch: refetchPreferences } = useQuery(getNotificationPreferences);
  const { socket, isConnected } = useSocket();

  // Local state for preferences checkboxes
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [activityEnabled, setActivityEnabled] = useState(true);

  // Local state for trigger form
  const [triggerType, setTriggerType] = useState<"SYSTEM" | "SECURITY" | "ACTIVITY">("SYSTEM");
  const [triggerTitle, setTriggerTitle] = useState("");
  const [triggerMessage, setTriggerMessage] = useState("");

  // Local state for real-time alerts received via Socket.IO
  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([]);

  // Local state for selected notification IDs (stored list)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Sync preferences checkboxes with server data when loaded
  useEffect(() => {
    if (preferences) {
      setSystemEnabled(preferences.systemEnabled);
      setSecurityEnabled(preferences.securityEnabled);
      setActivityEnabled(preferences.activityEnabled);
    }
  }, [preferences]);

  // Listen for real-time notifications via Socket.IO
  useSocketListener("notification", (newNotification: any) => {
    setRealtimeAlerts((prev) => [newNotification, ...prev]);
    refetchNotifications(); // Automatically refresh historical list too
  });

  const handleSavePreferences = async () => {
    try {
      await updateNotificationPreferences({
        systemEnabled,
        securityEnabled,
        activityEnabled,
      });
      await refetchPreferences();
      alert("Preferences saved!");
    } catch (err) {
      console.error("Error saving preferences:", err);
    }
  };

  const handleTriggerNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerTitle || !triggerMessage) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      await triggerNotificationEvent({
        type: triggerType,
        title: triggerTitle,
        message: triggerMessage,
      });
      setTriggerTitle("");
      setTriggerMessage("");
    } catch (err) {
      console.error("Error triggering notification:", err);
    }
  };

  const handleCheckboxToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchStatusUpdate = async (isRead: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      alert("Please select at least one notification.");
      return;
    }
    try {
      await batchUpdateNotificationStatus({ ids, isRead });
      setSelectedIds(new Set());
      await refetchNotifications();
    } catch (err) {
      console.error("Error updating notifications status:", err);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "20px" }}>
        <h1>Real-Time Notification Center</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span>Status: <strong style={{ color: isConnected ? "green" : "red" }}>{isConnected ? "Connected" : "Disconnected"}</strong></span>
          <button data-testid="logout-btn" onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* Preferences Section */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #eaeaea" }}>
        <h2>Notification Preferences</h2>
        <div style={{ display: "flex", gap: "20px", margin: "15px 0" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              type="checkbox"
              data-testid="pref-system"
              checked={systemEnabled}
              onChange={(e) => setSystemEnabled(e.target.checked)}
            />
            System Notifications
          </label>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              type="checkbox"
              data-testid="pref-security"
              checked={securityEnabled}
              onChange={(e) => setSecurityEnabled(e.target.checked)}
            />
            Security Notifications
          </label>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              type="checkbox"
              data-testid="pref-activity"
              checked={activityEnabled}
              onChange={(e) => setActivityEnabled(e.target.checked)}
            />
            Activity Notifications
          </label>
        </div>
        <button data-testid="save-pref-btn" onClick={handleSavePreferences} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px" }}>
          Save Preferences
        </button>
      </section>

      {/* Trigger Notification Form */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #eaeaea" }}>
        <h2>Trigger Test Notification</h2>
        <form onSubmit={handleTriggerNotification} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Type</label>
              <select
                data-testid="trigger-type"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="SYSTEM">SYSTEM</option>
                <option value="SECURITY">SECURITY</option>
                <option value="ACTIVITY">ACTIVITY</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Title</label>
              <input
                type="text"
                data-testid="trigger-title"
                value={triggerTitle}
                onChange={(e) => setTriggerTitle(e.target.value)}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                placeholder="Notification Title"
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>Message</label>
            <textarea
              data-testid="trigger-message"
              value={triggerMessage}
              onChange={(e) => setTriggerMessage(e.target.value)}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "60px" }}
              placeholder="Notification Message"
            />
          </div>
          <button type="submit" data-testid="trigger-btn" style={{ alignSelf: "flex-start", padding: "8px 16px", cursor: "pointer", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "4px" }}>
            Trigger Notification
          </button>
        </form>
      </section>

      {/* Real-Time Alerts List */}
      <section style={{ backgroundColor: "#fffbeb", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fef3c7" }}>
        <h2>Real-Time Alerts (Instant Socket.IO)</h2>
        <div data-testid="realtime-alerts" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
          {realtimeAlerts.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>No real-time alerts received yet in this session.</p>
          ) : (
            realtimeAlerts.map((alert, index) => (
              <div
                key={index}
                data-testid="alert-item"
                style={{ padding: "12px", border: "1px solid #f59e0b", borderRadius: "6px", backgroundColor: "#fff" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <strong style={{ color: "#d97706" }}>{alert.title}</strong>
                  <span style={{ fontSize: "0.8em", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>{alert.type}</span>
                </div>
                <p style={{ margin: 0, color: "#4b5563" }}>{alert.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Stored Notifications List */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2>Historical Notifications</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              data-testid="mark-read-btn"
              onClick={() => handleBatchStatusUpdate(true)}
              disabled={selectedIds.size === 0}
              style={{ padding: "6px 12px", cursor: "pointer", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", opacity: selectedIds.size === 0 ? 0.5 : 1 }}
            >
              Mark Read
            </button>
            <button
              data-testid="mark-unread-btn"
              onClick={() => handleBatchStatusUpdate(false)}
              disabled={selectedIds.size === 0}
              style={{ padding: "6px 12px", cursor: "pointer", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "4px", opacity: selectedIds.size === 0 ? 0.5 : 1 }}
            >
              Mark Unread
            </button>
          </div>
        </div>

        <div data-testid="notifications-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {!notifications || notifications.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>No notifications stored in database.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                data-testid="notification-item"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "15px",
                  padding: "12px",
                  border: "1px solid #eaeaea",
                  borderRadius: "6px",
                  backgroundColor: notification.isRead ? "#f3f4f6" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  data-testid="notification-checkbox"
                  data-notification-id={notification.id}
                  checked={selectedIds.has(notification.id)}
                  onChange={() => handleCheckboxToggle(notification.id)}
                  style={{ marginTop: "4px", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <h4 data-testid="notification-title" style={{ margin: 0, fontSize: "1.1em" }}>{notification.title}</h4>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span data-testid="notification-type" style={{ fontSize: "0.8em", backgroundColor: "#e5e7eb", padding: "2px 6px", borderRadius: "4px" }}>
                        {notification.type}
                      </span>
                      <span data-testid="notification-status" style={{ fontSize: "0.8em", fontWeight: "bold", color: notification.isRead ? "#6b7280" : "#ef4444" }}>
                        {notification.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                  </div>
                  <p data-testid="notification-message" style={{ margin: 0, color: "#4b5563" }}>{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
