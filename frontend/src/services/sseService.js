class SSEManager {
  constructor() {
    this.eventSource = null;
    this.listeners = [];
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.userId = null;
  }

  connect(userId) {
    if (this.eventSource) {
      this.disconnect();
    }

    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    this.userId = userId;

    // EventSource không hỗ trợ custom headers, nên ta phải truyền token qua query string
    const url = `http://localhost:8000/api/users/notifications/sse/?token=${token}`;
    
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ping") return; // Ignore ping messages

          // Trigger notification update
          this.notifyListeners(data);
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        this.isConnected = false;
        this.eventSource?.close();
        this.eventSource = null;
        
        // Auto-reconnect after 5 seconds
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.userId);
          }, 5000);
        }
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  addListener(callback) {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in SSE listener:", error);
      }
    });
  }
}

const sseManager = new SSEManager();

export default sseManager;