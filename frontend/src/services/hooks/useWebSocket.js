// useWebSocket.js
import { useEffect, useRef } from "react";

export default function useWebSocket(url, onMessage) {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => console.log("WebSocket closed:", url);

    return () => {
      ws.current.close();
    };
  }, [url, onMessage]);

  return ws.current;
}
