/**
 * Helper function to trigger notification update via SSE
 * This should be called whenever a new notification is created
 */
export const triggerNotificationUpdate = async (userId, notificationData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Send notification event to backend
    await fetch(`http://localhost:8000/api/notifications/trigger/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        notification: notificationData,
      }),
    });
  } catch (error) {
    console.error("Failed to trigger notification update:", error);
  }
};

/**
 * Add notification to localStorage and trigger SSE update
 */
export const addNotification = (notification) => {
  try {
    // Get existing notifications
    const existing = JSON.parse(localStorage.getItem("notifications") || "[]");
    
    // Add new notification
    const updated = [notification, ...existing];
    
    // Save to localStorage
    localStorage.setItem("notifications", JSON.stringify(updated));
    
    // Trigger SSE update if user is logged in
    const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    if (userProfile.id) {
      triggerNotificationUpdate(userProfile.id, notification);
    }
    
    return updated;
  } catch (error) {
    console.error("Failed to add notification:", error);
    return [];
  }
};