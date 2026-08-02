import React, { useState, useEffect } from "react";
import {
  useQuery,
  getNotifications,
  getNotificationPreferences,
  batchUpdateNotificationStatus,
  updateNotificationPreferences,
  triggerNotificationEvent,
} from "wasp/client/operations";
import { useSocketListener } from "wasp/client/webSocket";
import { logout } from "wasp/client/auth";
import "./Main.css";

export function MainPage() {
  const { data: preferences } = useQuery(getNotificationPreferences);
  const { data: notifications } = useQuery(getNotifications);

  const [systemEnabled, setSystemEnabled] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [activityEnabled, setActivityEnabled] = useState(true);

  const [triggerType, setTriggerType] = useState<"SYSTEM" | "SECURITY" | "ACTIVITY">("SYSTEM");
  const [triggerTitle, setTriggerTitle] = useState("");
  const [triggerMessage, setTriggerMessage] = useState("");

  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (preferences) {
      setSystemEnabled(preferences.systemEnabled);
      setSecurityEnabled(preferences.securityEnabled);
      setActivityEnabled(preferences.activityEnabled);
    }
  }, [preferences]);

  useSocketListener("notification", (notification: any) => {
    setRealtimeAlerts((prev) => [notification, ...prev]);
  });

  const handleSavePreferences = async () => {
    try {
      await updateNotificationPreferences({
        systemEnabled,
        securityEnabled,
        activityEnabled,
      });
      alert("Preferences saved successfully!");
    } catch (err: any) {
      alert("Error saving preferences: " + err.message);
    }
  };

  const handleTriggerNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerTitle || !triggerMessage) {
      alert("Please fill in title and message.");
      return;
    }
    try {
      const res = await triggerNotificationEvent({
        type: triggerType,
        title: triggerTitle,
        message: triggerMessage,
      });
      if (res.created) {
        setTriggerTitle("");
        setTriggerMessage("");
      } else {
        alert("Notification not created because the preference for this type is disabled.");
      }
    } catch (err: any) {
      alert("Error triggering notification: " + err.message);
    }
  };

  const handleCheckboxChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleMarkRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchUpdateNotificationStatus({ ids: selectedIds, isRead: true });
      setSelectedIds([]);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleMarkUnread = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchUpdateNotificationStatus({ ids: selectedIds, isRead: false });
      setSelectedIds([]);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Real-Time Notification Center</h1>
        <button data-testid="logout-btn" onClick={logout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {/* Preferences Section */}
      <section style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h2>Notification Preferences</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              data-testid="pref-system"
              checked={systemEnabled}
              onChange={(e) => setSystemEnabled(e.target.checked)}
            />
            System Notifications
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              data-testid="pref-security"
              checked={securityEnabled}
              onChange={(e) => setSecurityEnabled(e.target.checked)}
            />
            Security Notifications
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              data-testid="pref-activity"
              checked={activityEnabled}
              onChange={(e) => setActivityEnabled(e.target.checked)}
            />
            Activity Notifications
          </label>
        </div>
        <button
          data-testid="save-pref-btn"
          onClick={handleSavePreferences}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Save Preferences
        </button>
      </section>

      {/* Trigger Notification Form */}
      <section style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h2>Trigger Notification Event</h2>
        <form onSubmit={handleTriggerNotification} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label>Type</label>
            <select
              data-testid="trigger-type"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              style={{ padding: "0.5rem" }}
            >
              <option value="SYSTEM">SYSTEM</option>
              <option value="SECURITY">SECURITY</option>
              <option value="ACTIVITY">ACTIVITY</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label>Title</label>
            <input
              type="text"
              data-testid="trigger-title"
              value={triggerTitle}
              onChange={(e) => setTriggerTitle(e.target.value)}
              placeholder="Notification Title"
              style={{ padding: "0.5rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label>Message</label>
            <input
              type="text"
              data-testid="trigger-message"
              value={triggerMessage}
              onChange={(e) => setTriggerMessage(e.target.value)}
              placeholder="Notification Message"
              style={{ padding: "0.5rem" }}
            />
          </div>
          <button type="submit" data-testid="trigger-btn" style={{ padding: "0.5rem 1rem", cursor: "pointer", width: "fit-content" }}>
            Trigger Notification
          </button>
        </form>
      </section>

      {/* Real-Time Alerts List */}
      <section style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h2>Real-Time Alerts (Instant)</h2>
        <div data-testid="realtime-alerts" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
          {realtimeAlerts.length === 0 ? (
            <p style={{ color: "#666" }}>No real-time alerts received yet.</p>
          ) : (
            realtimeAlerts.map((alert, idx) => (
              <div
                key={idx}
                data-testid="alert-item"
                style={{
                  border: "1px solid #eee",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  background: "#f9f9f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: "bold" }}>{alert.title}</span>
                  <span style={{ fontSize: "0.8rem", color: "#888" }}>{alert.type}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>{alert.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Stored Notifications List */}
      <section style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "8px" }}>
        <h2>Stored Notifications (Historical)</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button data-testid="mark-read-btn" onClick={handleMarkRead} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Mark Selected as Read
          </button>
          <button data-testid="mark-unread-btn" onClick={handleMarkUnread} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Mark Selected as Unread
          </button>
        </div>

        <div data-testid="notifications-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {!notifications || notifications.length === 0 ? (
            <p style={{ color: "#666" }}>No historical notifications found.</p>
          ) : (
            notifications.map((notif: any) => (
              <div
                key={notif.id}
                data-testid="notification-item"
                style={{
                  border: "1px solid #eee",
                  padding: "1rem",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  background: notif.isRead ? "#fff" : "#f0f7ff",
                }}
              >
                <input
                  type="checkbox"
                  data-testid="notification-checkbox"
                  data-notification-id={notif.id}
                  checked={selectedIds.includes(notif.id)}
                  onChange={(e) => handleCheckboxChange(notif.id, e.target.checked)}
                  style={{ marginTop: "0.25rem", cursor: "pointer" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 data-testid="notification-title" style={{ margin: 0, fontSize: "1.1rem" }}>{notif.title}</h3>
                    <span data-testid="notification-type" style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#e2e8f0" }}>
                      {notif.type}
                    </span>
                  </div>
                  <p data-testid="notification-message" style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>{notif.message}</p>
                  <span
                    data-testid="notification-status"
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: notif.isRead ? "#718096" : "#3182ce",
                    }}
                  >
                    {notif.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
