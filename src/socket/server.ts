import { io } from "socket.io-client";

export const socket = io("https://api.cnmacademy.in", {
    transports: ['websocket', 'polling'], // Try both transports
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});