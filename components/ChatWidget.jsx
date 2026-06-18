"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCommentDots,
  faPaperPlane,
  faLightbulb,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. Ask me to find products, compare items, or get recommendations.",
      products: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, something went wrong. Please try again.",
          products: data.products || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle shopping assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-slate-700/90 text-slate-300 scale-95"
            : "bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 text-white hover:scale-110 glow-brand"
        }`}
      >
        <FontAwesomeIcon icon={open ? faXmark : faCommentDots} className="text-xl" />
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            AI
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[30rem] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden border border-indigo-500/20 fade-in-up chat-window">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faLightbulb} className="text-yellow-300 text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">AI Shopping Assistant</div>
              <div className="text-indigo-200 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                Online · Ready to help
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} fade-in-up`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5 shadow-md">
                    <FontAwesomeIcon icon={faLightbulb} className="text-yellow-300 text-[9px]" />
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-sm shadow-md"
                        : "bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/50 shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.products.map((p) => (
                        <Link
                          key={p._id}
                          href={`/product/${p._id}`}
                          className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5 hover:border-indigo-500/40 hover:bg-slate-800 transition-all group"
                        >
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                            {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-200 text-xs truncate group-hover:text-indigo-400 transition-colors">{p.name}</div>
                            <div className="text-indigo-400 text-xs font-bold">${p.price}</div>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-slate-600 group-hover:text-indigo-400 text-xs flex-shrink-0 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 flex items-center justify-center">
                  <FontAwesomeIcon icon={faLightbulb} className="text-yellow-300 text-[9px]" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-slate-700/50 p-3 flex gap-2 bg-slate-900/60">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              className="input-dark flex-1 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
