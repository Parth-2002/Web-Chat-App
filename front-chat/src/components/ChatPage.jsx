import React, { useEffect, useRef, useState } from "react";
import "@fontsource/playfair-display";
import { MdAttachFile, MdSend } from "react-icons/md";
import useChatContext from "../context/ChatContext";
import { useNavigate, useLocation } from "react-router-dom";
import { baseURL } from "../config/AxiosHelper";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import toast from "react-hot-toast";
import { getMessages } from "../services/RoomService";
import timeAgo from "../config/helper";

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    
    setRoomId,
    setCurrentUser,
    setConnected,
  } = useChatContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const stompClientRef = useRef(null); // keep client in ref so all handlers use same instance

  const WS_ENDPOINT = `${baseURL}/chat`;

  // protect route
  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected, navigate]);

  // 1) Load historical messages once (when connected and roomId available)
  useEffect(() => {
    let mounted = true;
    if (!connected || !roomId) return;

    (async () => {
      try {
        const msgs = await getMessages(roomId);
        if (mounted && Array.isArray(msgs)) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        toast.error("Error loading messages: " + (err?.message || err));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [connected, roomId]);

  // 2) Single websocket connect effect (no duplicates)
  useEffect(() => {
    if (!connected || !roomId || !currentUser) return;

    // Destroy old client if any
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (e) {
        console.warn("Error deactivating previous client", e);
      }
      stompClientRef.current = null;
    }

    const client = new Client({
      // use SockJS factory so backend with SockJS works fine
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      connectHeaders: {
        username: currentUser,
        roomId: roomId,
      },
      debug: function (str) {
        // comment this line later if too verbose
        console.debug("[STOMP]", str);
      },
      onConnect: () => {
        console.info("STOMP connected");

        toast.success("Connected to websocket");

        // subscribe to messages (chat)
        client.subscribe(`/topic/room/${roomId}`, (msg) => {
          try {
            const parsed = JSON.parse(msg.body);
            console.debug("Received chat message payload:", parsed);
            setMessages((prev) => [...prev, parsed]);
          } catch (e) {
            console.error("Failed to parse chat message:", e, msg.body);
          }
        });

        // subscribe to members updates
        client.subscribe(`/topic/room/${roomId}/members`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            console.debug("Received members payload:", payload);

            // handle several possible shapes:
            // 1) { members: [ { username, sessionId }, ... ] }
            // 2) [ { username, sessionId }, ... ]
            // 3) {roomId: "...", members: [...]}
            if (Array.isArray(payload)) {
              setMembers(payload);
            } else if (payload && Array.isArray(payload.members)) {
              setMembers(payload.members);
            } else if (payload && Array.isArray(payload.memberList)) {
              // fallback name
              setMembers(payload.memberList);
            } else {
              // if server sends single member object
              setMembers((prev) => {
                if (payload && payload.username) {
                  // merge if not present
                  const exists = prev.some(
                    (m) => m.username === payload.username
                  );
                  return exists ? prev : [...prev, payload];
                }
                return prev;
              });
            }
          } catch (e) {
            console.error("Failed to parse members payload:", e, msg.body);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        toast.error("STOMP error: " + frame.headers["message"]);
      },
      onWebSocketClose: (evt) => {
        console.warn("WebSocket closed:", evt);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // cleanup
    return () => {
      try {
        client.deactivate();
        stompClientRef.current = null;
      } catch (e) {
        console.warn("Error deactivating client during cleanup", e);
      }
    };
    // intentionally depend on roomId/currentUser/connected
  }, [connected, roomId, currentUser, WS_ENDPOINT]);

  // 3) Scroll to bottom when messages change
  useEffect(() => {
    if (!chatBoxRef.current) return;
    // small timeout ensures DOM updated
    const t = setTimeout(() => {
      const el = chatBoxRef.current;
      el.scrollTop = el.scrollHeight;
    }, 50);
    return () => clearTimeout(t);
  }, [messages]);

  // send message
  const sendMessage = async () => {
    const client = stompClientRef.current;
    if (!client || !client.active) {
      toast.error("Not connected to WebSocket");
      return;
    }
    if (!input.trim()) return;

    const payload = {
      sender: currentUser,
      content: input.trim(),
      roomId: roomId,
      timeStamp: new Date().toISOString(),
    };

    try {
      client.publish({
        destination: `/app/sendMessage/${roomId}`,
        body: JSON.stringify(payload),
      });
      setInput("");
    } catch (err) {
      console.error("sendMessage error:", err);
      toast.error("Failed to send message");
    }
  };

  // logout -> disconnect properly
  function handleLogout() {
    const client = stompClientRef.current;
    try {
      if (client) client.deactivate();
    } catch (e) {
      console.warn("error disconnecting client", e);
    }
    setConnected(false);
    setCurrentUser("");
    setRoomId("");
    navigate("/");
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <header className="bg-b flex items-center justify-between text-white p-4 w-full h-17">
        <h1 className="font-playfair text-2xl min-h-fit tracking-widest px-4 font-bold">
          Welcome to Chat Room
        </h1>
        <button
          onClick={handleLogout}
          className="text-xl rounded-full px-6 py-2 bg-gray-700 hover:bg-[#FF4F5B]"
        >
          Leave
        </button>
      </header>
      <hr className="w-[95%] mx-auto border border-gray-500" />
      <div className="flex flex-row h-[87vh] w-full overflow-hidden">
        {/* Sidebar (Members) */}
        {/* <div className="hidden lg:flex w-[25%] bg-black items-center justify-center border-gray-600">
          <div className="w-[90%] h-[95%] bg-neutral-900 border-2 border-gray-400 rounded-3xl">
            <h1 className="w-full border-b border-white rounded-t-3xl font-playfair font-extrabold px-4 py-3 text-2xl text-white tracking-wider overflow-hidden">
              Members
            </h1>
            <div className="text-white px-4 py-5 overflow-auto h-[85%]">
              {Array.isArray(members) && members.length > 0 ? (
                members.map((member, index) => (
                  <div key={index} className="flex items-center gap-3 mb-4">
                    <img
                      src={`https://avatar.iran.liara.run/public/${
                        30 + (index % 10)
                      }`}
                      className="w-10 h-10 rounded-full object-cover"
                      alt="avatar"
                    />
                    <span className="text-lg font-semibold">
                      {member.username || member}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic">No members yet</div>
              )}
            </div>
          </div>
        </div> */}

        {/* Chat Area */}
        <div className="flex-1 bg-black mx-8 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full h-[95%] bg-neutral-900 border-2 border-gray-400 rounded-3xl flex flex-col">
            <header className="w-full h-14 rounded-t-3xl border-b border-white bg-slate-900 flex items-center justify-end pr-4">
              <p className="text-white text-lg mr-2">{currentUser}</p>
              <img
                src="https://avatar.iran.liara.run/public/36"
                className="w-9 h-9 rounded-full object-cover"
                alt="avatar"
              />
            </header>

            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto p-1 text-white px-7 py-3 flex-1 scroll-smooth"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === currentUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-end gap-3 mb-2 ${
                      message.sender === currentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <img
                      src="https://avatar.iran.liara.run/public/36"
                      className="w-10 h-10 rounded-full object-cover"
                      alt="avatar"
                    />
                    <div
                      className={`${
                        message.sender === currentUser
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <span className="text-sm font-bold text-[#f8545f] block">
                        {message.sender}
                      </span>
                      <div className="bg-white text-black font-medium px-4 py-2 rounded-xl mt-1 max-w-xs break-words shadow">
                        {message.content}
                      </div>
                      <div className="text-[10px] text-white tracking-wider mt-1">
                        {timeAgo(
                          message.timeStamp ||
                            message.timeStamp ||
                            message.createdAt
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <hr />
            <div className="w-full h-16 flex items-center justify-center px-2 py-2 gap-2">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type your message here..."
                className="flex-grow h-10 sm:h-12 md:h-14 pl-3 sm:pl-5 md:pl-7 pr-3 sm:pr-5 md:pr-7 placeholder-slate-700 rounded-3xl p-1 text-base sm:text-lg md:text-xl bg-neutral-200 font-semibold focus:border-0 focus:outline-none focus:ring-2 focus:bg-white"
              />
              <button
                // onClick={}
                className="h-10 sm:h-12 md:h-14 text-lg sm:text-xl md:text-2xl border-2 border-[#f7424e] rounded-full px-3 sm:px-4 md:px-5 bg-[#f7424e] hover:bg-[#f80415] text-white"
              >
                <MdAttachFile />
              </button>
              <button
                onClick={sendMessage}
                className="h-10 sm:h-12 md:h-14 text-lg sm:text-xl md:text-2xl border-2 border-[#f7424e] rounded-full px-3 sm:px-4 md:px-5 bg-[#f7424e] hover:bg-[#f80415] text-white"
              >
                <MdSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
