import { useState, useEffect } from "react";
import { logout } from "wasp/client/auth";
import { useSocket, useSocketListener } from "wasp/client/webSocket";
import {
  useQuery,
  getNotifications,
  getNotificationPreferences,
  batchUpdateNotificationStatus,
  updateNotificationPreferences,
  triggerNotificationEvent,
} from "wasp/client/operations";
import "./Main.css";

export function MainPage() {
  const { isConnected } = useSocket();
  const { data: notifications, isLoading: isNotificationsLoading } = useQuery(getNotifications);
  const { data: preferences, isLoading: isPreferencesLoading } = useQuery(getNotificationPreferences);

  // Preferences State
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [activityEnabled, setActivityEnabled] = useState(true);

  // Sync state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setSystemEnabled(preferences.systemEnabled);
      setSecurityEnabled(preferences.securityEnabled);
      setActivityEnabled(preferences.activityEnabled);
    }
  }, [preferences]);

  // Trigger Notification State
  const [triggerType, setTriggerType] = useState<"SYSTEM" | "SECURITY" | "ACTIVITY">("SYSTEM");
  const [triggerTitle, setTriggerTitle] = useState("");
  const [triggerMessage, setTriggerMessage] = useState("");

  // Real-Time Alerts State
  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([]);

  // Selected Notifications for Batch Update
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Listen for real-time notification events
  useSocketListener("notification", (newNotification: any) => {
    setRealtimeAlerts((prev) => [newNotification, ...prev]);
  });

  const handleSavePreferences = async () => {
    try {
      await updateNotificationPreferences({
        systemEnabled,
        securityEnabled,
        activityEnabled,
      });
      alert("Preferences saved!");
    } catch (err: any) {
      alert("Error saving preferences: " + err.message);
    }
  };

  const handleTriggerNotification = async () => {
    if (!triggerTitle || !triggerMessage) {
      alert("Please fill in title and message");
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
        alert("Notification was not created (preference disabled).");
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

  const handleBatchUpdate = async (isRead: boolean) => {
    if (selectedIds.length === 0) {
      alert("Please select at least one notification.");
      return;
    }
    try {
      await batchUpdateNotificationStatus({
        ids: selectedIds,
        isRead,
      });
      setSelectedIds([]);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <main className="container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Notification Center</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: isConnected ? "green" : "red" }}>
            {isConnected ? "● Connected" : "○ Disconnected"}
          </span>
          <button data-testid="logout-btn" onClick={logout} className="button button-outlined">
            Logout
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <section style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
        <h3>Notification Preferences</h3>
        {isPreferencesLoading ? (
          <p>Loading preferences...</p>
        ) : (
          <div>
            <div style={{ margin: "10px 0" }}>
              <label>
                <input
                  type="checkbox"
                  data-testid="pref-system"
                  checked={systemEnabled}
                  onChange={(e) => setSystemEnabled(e.target.checked)}
                />
                System Notifications
              </label>
            </div>
            <div style={{ margin: "10px 0" }}>
              <label>
                <input
                  type="checkbox"
                  data-testid="pref-security"
                  checked={securityEnabled}
                  onChange={(e) => setSecurityEnabled(e.target.checked)}
                />
                Security Notifications
              </label>
            </div>
            <div style={{ margin: "10px 0" }}>
              <label>
                <input
                  type="checkbox"
                  data-testid="pref-activity"
                  checked={activityEnabled}
                  onChange={(e) => setActivityEnabled(e.target.checked)}
                />
                Activity Notifications
              </label>
            </div>
            <button data-testid="save-pref-btn" onClick={handleSavePreferences} className="button button-filled">
              Save Preferences
            </button>
          </div>
        )}
      </section>

      {/* Trigger Notification Section */}
      <section style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
        <h3>Trigger Notification</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>Type:</label>
            <select
              data-testid="trigger-type"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              style={{ padding: "5px", width: "100%" }}
            >
              <option value="SYSTEM">SYSTEM</option>
              <option value="SECURITY">SECURITY</option>
              <option value="ACTIVITY">ACTIVITY</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>Title:</label>
            <input
              type="text"
              data-testid="trigger-title"
              value={triggerTitle}
              onChange={(e) => setTriggerTitle(e.target.value)}
              style={{ padding: "5px", width: "100%" }}
              placeholder="Notification Title"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>Message:</label>
            <textarea
              data-testid="trigger-message"
              value={triggerMessage}
              onChange={(e) => setTriggerMessage(e.target.value)}
              style={{ padding: "5px", width: "100%", height: "60px" }}
              placeholder="Notification Message"
            />
          </div>
          <button data-testid="trigger-btn" onClick={handleTriggerNotification} className="button button-filled">
            Trigger Notification
          </button>
        </div>
      </section>

      {/* Real-Time Alerts List */}
      <section style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px", marginBottom: "20px" }}>
        <h3>Real-Time Alerts</h3>
        <div data-testid="realtime-alerts" style={{ maxHeight: "200px", overflowY: "auto", background: "#f9f9f9", padding: "10px", borderRadius: "3px" }}>
          {realtimeAlerts.length === 0 ? (
            <p style={{ color: "#888" }}>No real-time alerts received yet.</p>
          ) : (
            realtimeAlerts.map((alert, idx) => (
              <div
                key={idx}
                data-testid="alert-item"
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  marginBottom: "5px",
                  background: "#fff",
                }}
              >
                <strong>[{alert.type}] {alert.title}</strong>: {alert.message}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Stored Notifications List */}
      <section style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px" }}>
        <h3>Stored Notifications</h3>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button data-testid="mark-read-btn" onClick={() => handleBatchUpdate(true)} className="button button-outlined">
            Mark Read
          </button>
          <button data-testid="mark-unread-btn" onClick={() => handleBatchUpdate(false)} className="button button-outlined">
            Mark Unread
          </button>
        </div>

        {isNotificationsLoading ? (
          <p>Loading notifications...</p>
        ) : (
          <div data-testid="notifications-list">
            {notifications?.length === 0 ? (
              <p style={{ color: "#888" }}>No notifications stored.</p>
            ) : (
              notifications?.map((notif) => (
                <div
                  key={notif.id}
                  data-testid="notification-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="notification-checkbox"
                    data-notification-id={notif.id}
                    checked={selectedIds.includes(notif.id)}
                    onChange={(e) => handleCheckboxChange(notif.id, e.target.checked)}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span data-testid="notification-title" style={{ fontWeight: "bold" }}>
                        {notif.title}
                      </span>
                      <span
                        data-testid="notification-type"
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          background: "#eee",
                          borderRadius: "3px",
                        }}
                      >
                        {notif.type}
                      </span>
                      <span
                        data-testid="notification-status"
                        style={{
                          fontSize: "10px",
                          color: notif.isRead ? "gray" : "blue",
                        }}
                      >
                        {notif.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <div data-testid="notification-message" style={{ color: "#555", marginTop: "4px" }}>
                      {notif.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
