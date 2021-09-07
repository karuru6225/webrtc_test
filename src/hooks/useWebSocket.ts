import { useState, useCallback, useEffect } from "react";

type WebSocketMessageBody = string | ArrayBuffer | Blob;

interface useWebSocketProps {
  setConnection?: (arg0: WebSocket | null) => void;
  connection?: WebSocket | null;
  keepalive?: number;
}

const useWebSocket = (
  props?: useWebSocketProps
): {
  sendMessage: (arg0: WebSocketMessageBody) => void;
  state: number;
  connect: (url: string) => void;
  disconnect: () => void;
  messageCount: number;
  getLatestMessage: () => WebSocketMessageBody | null;
} => {
  const { setConnection, connection, keepalive = 10000 } = props || {};
  const now = Date.now();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [kaTimer, setKaTimer] = useState<number>(0);
  const [wsState, setWsState] = useState<number>(-1);
  const [requestQueue, setRequestQueue] = useState<WebSocketMessageBody[]>([]);
  const [recieveQueue, setRecieveQueue] = useState<WebSocketMessageBody[]>([]);
  const [messageCount, setMessageCount] = useState<number>(0);
  const _setSocket = setConnection || setSocket;
  const _socket = connection || socket;

  const connect = useCallback(
    (url: string) => {
      if (!_socket) {
        const ws = new WebSocket(url);
        setWsState(WebSocket.CONNECTING);
        ws.addEventListener("open", (...args) => {
          console.log("connected", args);
          setWsState(WebSocket.OPEN);
          const timer = window.setInterval(() => {
            ws.send("keepalive");
          }, keepalive);
          setKaTimer(timer);
        });
        ws.addEventListener("message", (e) => {
          console.log("message", e.data);
          setRecieveQueue((prev) => [...prev, e.data]);
          setMessageCount((prev) => prev + 1);
        });
        ws.addEventListener("close", () => {
          console.log("closed");
          setWsState(WebSocket.CLOSED);
          if (kaTimer) {
            window.clearInterval(kaTimer);
            setKaTimer(0);
          }
        });
        _setSocket(ws);
      }
    },
    [_setSocket]
  );

  const disconnect = useCallback(() => {
    setWsState(WebSocket.CLOSING);
    console.log("called disconnect");
    if (_socket) {
      _socket.close();
      _setSocket(null);
    }
  }, [_socket]);

  useEffect(() => {
    if (
      requestQueue.length > 0 &&
      _socket &&
      _socket.readyState === WebSocket.OPEN
    ) {
      const [targetMessage, ...leftMessages] = requestQueue;
      _socket.send(targetMessage);
      setRequestQueue(leftMessages);
    }
  }, [_socket, requestQueue]);

  const sendMessage = useCallback(
    (message: WebSocketMessageBody) => {
      setRequestQueue((prev) => [...prev, message]);
    },
    [setRequestQueue]
  );

  const getLatestMessage = useCallback(() => {
    console.log("getLatestMessage", recieveQueue);
    if (recieveQueue.length <= 0) {
      return null;
    }
    const [first, ...left] = recieveQueue;
    setRecieveQueue(left);
    return first;
  }, [recieveQueue]);

  return {
    state: wsState,
    sendMessage,
    getLatestMessage,
    messageCount,
    connect,
    disconnect,
  };
};

export default useWebSocket;
