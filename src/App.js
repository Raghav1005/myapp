import React, { useState } from "react";
import "./App.css";
import ChatHistory from "./ChatHistory";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;


function App() {
  if (!OPENROUTER_API_KEY) {
    return (
      <div className="error-message">
        <h2>API Key Missing</h2>
        <p>
          Please set your OpenRouter API key in the
          <code>.env</code> file as <code>REACT_APP_OPENROUTER_API_KEY</code>.
        </p>
      </div>
    );
  }
  const [chatSessions, setChatSessions] = useState([
    {
      id: "1",
      messages: [{ text: "Hello! How can I help you?", sender: "ai" }],
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState("1");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState("");

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };

    // Find current session
    const updatedSessions = chatSessions.map((chat) =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    );
    setChatSessions(updatedSessions);
    setInput("");

    const requestBody = {
      model: "mistralai/mistral-7b-instruct", // free model to avoid 402
      messages: updatedSessions
        .find((chat) => chat.id === currentChatId)
        .messages.map((msg) => ({
          role: msg.sender === "ai" ? "assistant" : "user",
          content: msg.text,
        })),
    };

    console.log("API Request Payload:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} - ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("Raw API Response:", data);
      const aiResponseText =
        data.choices?.[0]?.message?.content || "No response from AI.";

      const aiMessage = { text: aiResponseText, sender: "ai" };

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, aiMessage] }
            : chat
        )
      );
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);
      const errorMessage = {
        text: `Sorry, something went wrong. Details: ${error.message}`,
        sender: "ai",
      };
      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    }
  };

  const handleNewChat = () => {
    const newId = (Math.random() * 100000).toFixed(0).toString();
    const initialMessage = { text: "Hello! How can I help you?", sender: "ai" };

    setChatSessions([
      ...chatSessions,
      { id: newId, messages: [initialMessage] },
    ]);

    setCurrentChatId(newId);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    setIsSidebarOpen(false);
  };

  const currentMessages =
    chatSessions.find((chat) => chat.id === currentChatId)?.messages || [];

  return (
    <div className="gemini-container">
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <ChatHistory
          sessions={chatSessions}
          currentId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
      </div>
      <div className="main-chat-area">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          ☰
        </button>
        <div className="messages-list">
          {currentMessages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          ))}
        </div>
        <form className="input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
