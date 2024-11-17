"use client";

import { act, useEffect, useState } from "react";
import socket from "../socket";
import { useRouter } from "next/navigation";
import { get } from "http";

type conversation = { userID: string; messages: Message[] };
type Message = { msgID: string; senderID: string; message: string };
type User = { username: string; id: string };

export default function Profile() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  let Messages: Message[];
  const [conversations, setConversations] = useState<conversation[]>([]);

  const [to, setTo] = useState<string>("");

  const [activeUser, setActiveUser] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const router = useRouter();

  const getConversations = async (user: User) => {
    await fetch(`http://localhost:4000/${user.id}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          console.log("Error getting messages");
          throw new Error("Fetch error");
        }
      })
      .then((msgs) => {
        if (msgs && msgs.length > 0) {
          msgs.forEach((msg: any) => {
            Messages = [];
            if (msgs && msgs.length > 0) {
              msgs.forEach((msg: any) => {
                const User = users.find((user) => user.id === msg.senderID);
                if (User)
                  Messages.push({
                    msgID: msg._id,
                    senderID: User.id,
                    message: msg.message,
                  });
              });
            } else {
              Messages = [];
            }
            console.log("Messages: ", Messages);
            setConversations((prevConversation: conversation[]) => {
              const existingIndex = prevConversation.findIndex(
                (conv) => conv.userID === user.id
              );

              if (existingIndex !== -1) {
                const updatedConversations = [...prevConversation];
                updatedConversations[existingIndex] = {
                  userID: user.id,
                  messages: Messages,
                };
                return updatedConversations;
              }

              return [
                ...prevConversation,
                { userID: user.id, messages: Messages },
              ];
            });
          });
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      });
  };

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await fetch("http://localhost:4000/users", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Error fetching users");
          router.push("/");
          return;
        }

        const { users: fetchedUsers } = await res.json();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error in getUsers:", error);
      }
    };

    getUsers();
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      for (const user of users) {
        await getConversations(user);
      }
    };

    if (users.length > 0) {
      fetchConversations();
    }

    socket.connect();
    socket.on("messsage", ({ message, from }) => {
      setMessages((prev) => {
        return [...prev, { msgID: "none", senderID: from, message }];
      });
    });
    socket.on("user", (user) => {
      console.log(user)
      setActiveUser(user);
    });

    return () => {
      socket.disconnect();
    };
  }, [users]);

  useEffect(() => {
    console.log("conversations: ", conversations);
  }, [conversations]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() != "") {
      await fetch(`http://localhost:4000/send/${to}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message }),
      })
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log("Error: ", e);
        });
      socket.emit("message", { message, to });
      setMessage("");
    }
  };

  const updateMessages = (msgID: string, senderID: string, message: string) => {
    setMessages((prevMessages) => {
      return [...prevMessages, { msgID, senderID, message }];
    });
  };

  useEffect(() => {
    const getMessages = () => {
      console.log(to);
      const msgs = conversations.find((conv) => conv.userID === to)?.messages;
      if (msgs && msgs.length > 0) {
        msgs.forEach((msg: any) => {
          console.log(msg);
          const user = users.find((user) => user.id === msg.senderID);
          console.log(user);
          if (user) updateMessages(msg._id, user.username, msg.message);
        });
      } else {
        setMessages([]);
      }
    };

    if (to != "") {
      setMessages([]);
      getMessages();
    }
  }, [to]);

  const handleUserClick = async (id: string) => {
    setTo(id);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-[1%] font-bold text-5xl">GLOBAL CHAT APP</h1>
      <div className="flex justify-center gap-4 w-full h-[70vh] basis-full mt-[3%]">
        <div className="users flex flex-col w-[15%] h-[70vh] bg-yellow-100 rounded-md items-center gap-2 overflow-y-auto">
          {users.map((user) => {
            const color = activeUsers.includes(user) ? "green-600" : "red-600";
            const bgColor = activeUsers.includes(user)
              ? "bg-green-600"
              : "bg-red-600";
            return (
              <button
                key={user.id}
                onClick={(e) => handleUserClick(user.id)}
                className="hover:bg-orange-400 flex w-[80%] py-4 mt-4 p-2 bg-orange-300 rounded-md items-center overflow-hidden"
              >
                <h3
                  className="ml-2 text-center text-xl font-medium truncate"
                  title={user.username}
                >
                  {user.username}
                </h3>
                <div
                  className={`ml-auto rounded-full border border-${color} p-1 ${bgColor} h-[5%] w-[5%]`}
                ></div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col justify-between w-[50%] h-[70vh] bg-amber-100 shadow-lg rounded-lg p-5">
          <div className="chat-container flex flex-col gap-2 overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.msgID}
                  className="bg-gray-200 p-2 rounded-md shadow-sm"
                >
                  <strong>{msg.senderID}:</strong> {msg.message}
                </div>
              ))
            ) : (
              <div
                key="System"
                className="bg-gray-200 p-2 rounded-md shadow-sm"
              >
                <strong>System: </strong>No messages with this user yet.
              </div>
            )}
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
    </div>
  );
}
