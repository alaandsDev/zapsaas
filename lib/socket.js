"use client";
import { io } from "socket.io-client";
import { API_URL, getToken } from "./api";

let socket = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;
  const token = getToken();
  if (!token) return null;
  socket = io(API_URL, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1500,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
