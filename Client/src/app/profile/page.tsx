"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Profile() {
  const [socket, setSocket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { username: string; message: string }[]
  >([
    { username: "System", message: "Hello! This is a test message." },
    { username: "User2", message: "XD" },
    { username: "User3", message: "This is a short message." },
    { username: "User1", message: "Another test message to check layout." },
  ]);
  useEffect(() => {
    const socket = io("http://localhost:4000", {
      transports: ["websocket"],
    });
    console.log(socket);
    setSocket(socket);

    socket.on("message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() != "") {
      socket.emit("message", message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-[1%] font-bold text-5xl">GLOBAL CHAT APP</h1>
      <div className="flex flex-col justify-between mt-[3%] w-[50%] h-[70vh] bg-amber-100 shadow-lg rounded-lg p-5">
        <div className="chat-container flex flex-col gap-2 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="bg-gray-200 p-2 rounded-md shadow-sm">
              <strong>{msg.username}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-t-2 pt-[1%] border-black flex justify-between"
        >
          <input
            className="rounded-md w-[60%] pl-2"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="border border-black bg-black text-white rounded-md p-2"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
