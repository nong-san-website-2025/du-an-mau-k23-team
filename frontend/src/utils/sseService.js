class SSEManager {
  constructor() {
    this.eventSource = null;
    this.listeners = [];
    this.connectionStatus = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED
    this.reconnectTimeout = null;
    this.userId = null;
    this.retryCount = 0; // Đếm số lần thử lại để tính thời gian chờ
  }

  connect(userId) {
    // Nếu đang kết nối đúng user này rồi thì thôi, không connect lại
    if (this.connectionStatus === 'CONNECTED' && this.userId === userId) {
        return;
    }

    this.disconnect(); // Reset sạch sẽ trước khi tạo mới

    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    this.userId = userId;
    this.connectionStatus = 'CONNECTING';

    const url = `${process.env.REACT_APP_API_URL}/sse/?token=${token}`;

    console.log(`[SSE] Attempting connection... (Retry: ${this.retryCount})`);

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log("[SSE] Connection established.");
        this.connectionStatus = 'CONNECTED';
        this.retryCount = 0; // Reset số lần retry khi thành công
        
        // Clear timeout cũ nếu có
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          // Heartbeat check (nếu server gửi message rỗng để giữ kết nối)
          if (!event.data || event.data === 'ping') return;

          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error("[SSE] Parse error:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.warn("[SSE] Connection lost/error.", error);
        this.eventSource.close(); // Đóng ngay để tránh browser tự retry loạn xạ
        this.connectionStatus = 'DISCONNECTED';
        this.handleReconnect();
      };

    } catch (error) {
      console.error("[SSE] Setup failed:", error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    // Exponential Backoff: Chờ 2s, 4s, 8s, 16s... tối đa 30s
    // Để tránh spam server khi server chết hẳn
    const delay = Math.min(1000 * (2 ** this.retryCount), 30000); 
    
    console.log(`[SSE] Reconnecting in ${delay/1000}s...`);
    
    this.reconnectTimeout = setTimeout(() => {
        this.retryCount++;
        this.connect(this.userId);
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.connectionStatus = 'DISCONNECTED';
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
        console.error("[SSE] Error in listener:", error);
      }
    });
  }
}

const sseManager = new SSEManager();

export default sseManager;
