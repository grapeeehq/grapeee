"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authClient } from "@/lib/auth-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export interface Thread {
  id: string;
  name: string;
  pluginConnected: boolean;
  cliConnected: boolean;
  chats: Chat[];
  createdAt: number;
}

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

const POPULAR_GAMES = [
  "Steal a Brainrot",
  "Grow a Garden",
  "Lumber Tycoon 2",
  "Adopt Me",
  "Blox Fruits",
  "Murder Mystery 2",
  "Tower of Hell",
  "Doors",
  "Pet Simulator 99",
  "Brookhaven RP",
  "Rivals",
  "Da Hood",
  "Bee Swarm Simulator",
  "Arsenal",
  "Jailbreak",
  "Phantom Forces",
  "Build A Boat For Treasure",
  "Anime Defenders",
];

const STORAGE_KEY = "grapeee.workspace.v2";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface WorkspaceContextValue {
  user: WorkspaceUser;
  threads: Thread[];
  hydrated: boolean;
  getThread: (id: string) => Thread | null;
  startThreadFromMessage: (text: string) => string;
  sendMessage: (threadId: string, chatId: string, text: string) => void;
  createEmptyThread: () => string;
  getActiveChatId: (threadId: string) => string | null;
  setActiveChat: (threadId: string, chatId: string) => void;
  createChat: (threadId: string) => string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceShell");
  return ctx;
}

export function WorkspaceShell({
  user,
  children,
}: {
  user: WorkspaceUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const storageKey = `${STORAGE_KEY}.${user.id}`;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeChats, setActiveChats] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeThreadId = useMemo(() => {
    const m = pathname?.match(/^\/workspace\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { threads: Thread[]; activeChats?: Record<string, string> };
        if (Array.isArray(parsed.threads)) setThreads(parsed.threads);
        if (parsed.activeChats && typeof parsed.activeChats === "object") setActiveChats(parsed.activeChats);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const cleaned = threads.map((p) => ({
      ...p,
      chats: p.chats.map((c) => ({
        ...c,
        messages: c.messages.map(({ pending: _p, ...m }) => m),
      })),
    }));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ threads: cleaned, activeChats }));
    } catch {
      // quota
    }
  }, [threads, activeChats, hydrated, storageKey]);

  const getActiveChatId = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return null;
      const stored = activeChats[threadId];
      if (stored && thread.chats.some((c) => c.id === stored)) return stored;
      return thread.chats[0]?.id ?? null;
    },
    [threads, activeChats],
  );

  const setActiveChat = useCallback((threadId: string, chatId: string) => {
    setActiveChats((prev) => ({ ...prev, [threadId]: chatId }));
  }, []);

  const createChat = useCallback((threadId: string) => {
    const chatId = uid();
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== threadId
          ? t
          : { ...t, chats: [{ id: chatId, title: "New chat", messages: [] }, ...t.chats] },
      ),
    );
    setActiveChats((prev) => ({ ...prev, [threadId]: chatId }));
    return chatId;
  }, []);

  const getThread = useCallback(
    (id: string) => threads.find((p) => p.id === id) ?? null,
    [threads],
  );

  function appendDelta(threadId: string, chatId: string, messageId: string, delta: string) {
    setThreads((prev) =>
      prev.map((p) =>
        p.id !== threadId
          ? p
          : {
              ...p,
              chats: p.chats.map((c) =>
                c.id !== chatId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id !== messageId
                          ? m
                          : { ...m, content: m.content + delta, pending: true },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function finalizeAssistant(threadId: string, chatId: string, messageId: string) {
    setThreads((prev) =>
      prev.map((p) =>
        p.id !== threadId
          ? p
          : {
              ...p,
              chats: p.chats.map((c) =>
                c.id !== chatId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id !== messageId ? m : { ...m, pending: false },
                      ),
                    },
              ),
            },
      ),
    );
  }

  async function generateAndApplyTitle(threadId: string, chatId: string, prompt: string) {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) return;
      const { title } = (await res.json()) as { title?: string };
      if (!title) return;
      setThreads((prev) =>
        prev.map((p) =>
          p.id !== threadId
            ? p
            : {
                ...p,
                name: p.name === "New thread" || p.name.length < 3 ? title : p.name,
                chats: p.chats.map((c) => (c.id !== chatId ? c : { ...c, title })),
              },
        ),
      );
    } catch {
      // ignore
    }
  }

  async function streamReply(threadId: string, chatId: string, history: Message[]) {
    const assistantId = uid();
    setThreads((prev) =>
      prev.map((p) =>
        p.id !== threadId
          ? p
          : {
              ...p,
              chats: p.chats.map((c) =>
                c.id !== chatId
                  ? c
                  : {
                      ...c,
                      messages: [
                        ...c.messages,
                        { id: assistantId, role: "assistant", content: "", pending: true },
                      ],
                    },
              ),
            },
      ),
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        appendDelta(threadId, chatId, assistantId, `⚠️ ${text || `Request failed (${res.status})`}`);
        finalizeAssistant(threadId, chatId, assistantId);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        appendDelta(threadId, chatId, assistantId, decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      appendDelta(threadId, chatId, assistantId, `⚠️ ${(err as Error).message || "Network error"}`);
    } finally {
      finalizeAssistant(threadId, chatId, assistantId);
      const isFirstExchange = history.length === 1 && history[0].role === "user";
      if (isFirstExchange) {
        void generateAndApplyTitle(threadId, chatId, history[0].content);
      }
    }
  }

  function startThreadFromMessage(text: string) {
    const threadId = uid();
    const chatId = uid();
    const userMsg: Message = { id: uid(), role: "user", content: text };
    const thread: Thread = {
      id: threadId,
      name: "New thread",
      pluginConnected: false,
      cliConnected: false,
      chats: [{ id: chatId, title: "New chat", messages: [userMsg] }],
      createdAt: Date.now(),
    };
    setThreads((prev) => [thread, ...prev]);
    router.push(`/workspace/${threadId}`);
    void streamReply(threadId, chatId, [userMsg]);
    return threadId;
  }

  function createEmptyThread() {
    const threadId = uid();
    const chatId = uid();
    const thread: Thread = {
      id: threadId,
      name: "New thread",
      pluginConnected: false,
      cliConnected: false,
      chats: [{ id: chatId, title: "New chat", messages: [] }],
      createdAt: Date.now(),
    };
    setThreads((prev) => [thread, ...prev]);
    router.push(`/workspace/${threadId}`);
    return threadId;
  }

  function sendMessage(threadId: string, chatId: string, text: string) {
    const thread = threads.find((p) => p.id === threadId);
    const chat = thread?.chats.find((c) => c.id === chatId);
    if (!thread || !chat) return;
    const userMsg: Message = { id: uid(), role: "user", content: text };
    setThreads((prev) =>
      prev.map((p) =>
        p.id !== threadId
          ? p
          : {
              ...p,
              chats: p.chats.map((c) =>
                c.id !== chatId ? c : { ...c, messages: [...c.messages, userMsg] },
              ),
            },
      ),
    );
    void streamReply(threadId, chatId, [...chat.messages, userMsg]);
  }

  async function handleSignOut() {
    setSignOutPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = (user.name || user.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ctx: WorkspaceContextValue = {
    user,
    threads,
    hydrated,
    getThread,
    startThreadFromMessage,
    sendMessage,
    createEmptyThread,
    getActiveChatId,
    setActiveChat,
    createChat,
  };

  const activeThread = activeThreadId ? threads.find((t) => t.id === activeThreadId) ?? null : null;
  const inThread = !!activeThread;

  const userBlock = (
    <div className="ws-user-wrap">
      <button
        type="button"
        className="ws-user"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
      >
        <span className="ws-avatar" aria-hidden>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" />
          ) : (
            initials
          )}
        </span>
        {!inThread ? (
          <span className="ws-user-meta">
            <span className="ws-user-name">{user.name}</span>
            <span className="ws-user-email">{user.email}</span>
          </span>
        ) : null}
      </button>
      {menuOpen ? (
        <div className="ws-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signOutPending}
          >
            {signOutPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <WorkspaceContext.Provider value={ctx}>
      <div className={`ws ${inThread ? "ws-rail-mode" : ""} ${inThread && historyOpen ? "ws-history-open" : ""}`}>
        {inThread ? (
          <RailSide
            user={user}
            initials={initials}
            thread={activeThread!}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            signOutPending={signOutPending}
            onSignOut={handleSignOut}
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
          />
        ) : (
          <aside className="ws-side">
            <div className="ws-side-top">
              <Link href="/" className="ws-brand" aria-label="grapeee home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logosmall.svg" alt="" className="ws-brand-mark" />
                <span>grapeee</span>
              </Link>
              <button type="button" className="ws-new" onClick={createEmptyThread}>
                <span aria-hidden>+</span> New thread
              </button>
            </div>

            <div className="ws-side-scroll">
              <div className="ws-section-label">Threads</div>
              {threads.length === 0 ? (
                <p className="ws-side-empty">No threads yet — start one from the chat box.</p>
              ) : (
                <ul className="ws-thread-list">
                  {threads.map((thread) => {
                    const open = thread.id === activeThreadId;
                    return (
                      <li key={thread.id} className="ws-thread">
                        <Link
                          href={`/workspace/${thread.id}`}
                          className={`ws-thread-row ${open ? "ws-thread-row-active" : ""}`}
                        >
                          <span className="ws-thread-name">{thread.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {userBlock}
          </aside>
        )}


        <main className="ws-main">{children}</main>

        <style>{styles}</style>
      </div>
    </WorkspaceContext.Provider>
  );
}

type AgentStatus = "idle" | "thinking" | "ready";

export function getThreadStatus(thread: Thread): AgentStatus {
  let status: AgentStatus = "idle";
  for (const c of thread.chats) {
    const last = c.messages[c.messages.length - 1];
    if (!last) continue;
    if (last.pending) return "thinking";
    if (last.role === "assistant") status = "ready";
  }
  return status;
}

function relativeDate(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function RailSide({
  user,
  initials,
  thread,
  menuOpen,
  setMenuOpen,
  signOutPending,
  onSignOut,
  historyOpen,
  setHistoryOpen,
}: {
  user: WorkspaceUser;
  initials: string;
  thread: Thread;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  signOutPending: boolean;
  onSignOut: () => void;
  historyOpen: boolean;
  setHistoryOpen: (v: boolean | ((p: boolean) => boolean)) => void;
}) {
  const { getActiveChatId, setActiveChat, createChat } = useWorkspace();
  const activeChatId = getActiveChatId(thread.id);

  return (
    <aside className={`ws-rail ${historyOpen ? "ws-rail-wide" : ""}`}>
      <div className="ws-rail-icons">
        <div className="ws-rail-top">
          <Link href="/workspace" className="ws-rail-brand" aria-label="grapeee home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logosmall.svg" alt="" className="ws-brand-mark" />
          </Link>

          <button
            type="button"
            className={`ws-rail-icon ${historyOpen ? "ws-rail-icon-active" : ""}`}
            onClick={() => setHistoryOpen((v) => !v)}
            aria-label="Chat history"
            title="Chat history"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="ws-rail-bottom">
          <button
            type="button"
            className="ws-rail-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={user.name}
            title={user.name}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </button>
          {menuOpen ? (
            <div className="ws-menu ws-menu-rail" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                disabled={signOutPending}
              >
                {signOutPending ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {historyOpen ? (
        <div className="ws-rail-chats">
          <div className="ws-history-head">
            <button
              type="button"
              className="ws-history-back"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close chat history"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="ws-history-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Chat History
            </div>
          </div>

          <div className="ws-history-body">
            {thread.chats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`ws-history-item ${isActive ? "ws-history-item-active" : ""}`}
                  onClick={() => {
                    setActiveChat(thread.id, c.id);
                    setHistoryOpen(false);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 5h16v11H9l-5 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                  <span className="ws-history-item-name">{c.title}</span>
                  {isActive ? <span className="ws-history-item-tag">(current)</span> : null}
                </button>
              );
            })}
            <button
              type="button"
              className="ws-history-new"
              onClick={() => {
                createChat(thread.id);
                setHistoryOpen(false);
              }}
            >
              <span aria-hidden>+</span> Start a new chat
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function HeroPane() {
  const { startThreadFromMessage } = useWorkspace();
  const suggestions = [
    "Tycoon like @Lumber Tycoon 2 but crystal mining",
    "Round-based survival inspired by @Doors",
    "Pet collector like @Pet Simulator 99 with a brainrot twist",
  ];
  return (
    <div className="ws-hero">
      <div className="ws-hero-inner">
        <h1>What are we building?</h1>
        <Composer
          onSend={(text) => startThreadFromMessage(text)}
          placeholder="Describe your game, or @-mention one for context…"
          autoFocus
        />
        <div className="ws-suggest">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="ws-suggest-chip"
              onClick={() => startThreadFromMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThreadPane({ threadId }: { threadId: string }) {
  const { getThread, sendMessage, hydrated, getActiveChatId } = useWorkspace();
  const router = useRouter();
  const thread = getThread(threadId);
  const activeChatId = getActiveChatId(threadId);
  const chat = thread?.chats.find((c) => c.id === activeChatId) ?? thread?.chats[0] ?? null;
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.messages]);

  if (!hydrated) {
    return <div className="ws-hero"><div className="ws-hero-inner"><p className="ws-muted">Loading…</p></div></div>;
  }

  if (!thread || !chat) {
    return (
      <div className="ws-hero">
        <div className="ws-hero-inner">
          <h1>Thread not found</h1>
          <p className="ws-muted">This thread doesn&apos;t exist on this device. It may have been created elsewhere — local-only storage for now.</p>
          <button
            type="button"
            className="ws-suggest-chip"
            onClick={() => router.push("/workspace")}
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  if (chat.messages.length === 0) {
    return (
      <div className="ws-hero">
        <div className="ws-hero-inner">
          <h1>What are we building?</h1>
          <Composer
            onSend={(text) => sendMessage(thread.id, chat.id, text)}
            placeholder="Describe your game, or @-mention one for context…"
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ws-thread-view">
      <header className="ws-thread-head">
        <div className="ws-thread-head-left">
          <h1>{thread.name}</h1>
          <ThreadStatusPill status={getThreadStatus(thread)} />
        </div>
        <div className="ws-thread-head-right">
          <ConnectionIndicator thread={thread} />
          <NewChatButton threadId={thread.id} />
        </div>
      </header>

      <section className="ws-convo" ref={threadRef}>
        <div className="ws-msgs">
          {chat.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </section>

      <footer className="ws-composer-wrap">
        <Composer
          onSend={(text) => sendMessage(thread.id, chat.id, text)}
          placeholder="Reply, or @-mention a game for context…"
        />
      </footer>
    </div>
  );
}

function NewChatButton({ threadId }: { threadId: string }) {
  const { createChat } = useWorkspace();
  return (
    <button
      type="button"
      className="ws-conn-icon"
      onClick={() => createChat(threadId)}
      aria-label="New chat"
      title="New chat"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 5h11M4 10h11M4 15h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 16v6M14 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ConnectionIndicator({ thread }: { thread: Thread }) {
  const [open, setOpen] = useState(false);
  const connected = thread.pluginConnected || thread.cliConnected;
  return (
    <div className="ws-conn-host">
      <button
        type="button"
        className={`ws-conn-icon ${connected ? "ws-conn-ok" : "ws-conn-bad"}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={connected ? "Connected" : "Plugin/CLI not connected"}
        title={connected ? "Connected" : "Plugin/CLI not connected"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M2 8.5C5 6 8.4 4.5 12 4.5s7 1.5 10 4M5 12.2C7 10.5 9.4 9.5 12 9.5s5 1 7 2.7M8 15.8c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="19" r="1.4" fill="currentColor" />
          {!connected ? (
            <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : null}
        </svg>
      </button>
      {open ? (
        <div className="ws-conn-pop" role="dialog">
          <div className="ws-pop-head">Connection</div>
          <div className="ws-pop-row">
            <span className={`ws-dot ${thread.pluginConnected ? "ws-dot-ok" : "ws-dot-bad"}`} />
            Studio plugin {thread.pluginConnected ? "connected" : "not connected"}
          </div>
          <div className="ws-pop-row">
            <span className={`ws-dot ${thread.cliConnected ? "ws-dot-ok" : "ws-dot-bad"}`} />
            CLI {thread.cliConnected ? "connected" : "not connected"}
          </div>
          {!connected ? (
            <p className="ws-pop-hint">Install the Studio plugin or run <code>grapeee</code> in your project to enable file edits.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ThreadStatusPill({ status }: { status: AgentStatus }) {
  const label = status === "thinking" ? "Thinking…" : status === "ready" ? "Ready for reply" : "Idle";
  return (
    <span className={`ws-status ws-status-${status}`}>
      <span className={`ws-dot ws-dot-${status}`} />
      {label}
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`ws-msg ws-msg-${message.role}`}>
      <div className="ws-msg-role">{message.role === "user" ? "You" : "Grapeee"}</div>
      <div className="ws-msg-body">
        {renderWithMentions(message.content)}
        {message.pending && message.content.length === 0 ? (
          <span className="ws-cursor" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

function renderWithMentions(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /@([A-Za-z0-9][A-Za-z0-9 _'-]*?)(?=[.,!?;:\n]|$| {2,})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const isKnown = POPULAR_GAMES.some((g) => g.toLowerCase() === name.toLowerCase());
    if (!isKnown) continue;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <span key={key++} className="ws-mention-pill">
        @{name}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function Composer({
  onSend,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [mentionState, setMentionState] = useState<{ start: number; query: string } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const expandedTaRef = useRef<HTMLTextAreaElement | null>(null);

  const newlineCount = useMemo(() => (value.match(/\n/g) || []).length, [value]);
  const showExpand = newlineCount >= 3;

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => {
    if (!expanded) return;
    expandedTaRef.current?.focus();
    const ta = expandedTaRef.current;
    if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  const filtered = useMemo(() => {
    if (!mentionState) return [];
    const q = mentionState.query.toLowerCase();
    if (!q) return POPULAR_GAMES.slice(0, 6);
    return POPULAR_GAMES.filter((g) => g.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionState]);

  useEffect(() => {
    setHighlight(0);
  }, [mentionState?.query]);

  function recomputeMention(text: string, caret: number) {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at === -1) return setMentionState(null);
    const between = before.slice(at + 1);
    if (/\s/.test(between)) return setMentionState(null);
    if (at > 0 && /[A-Za-z0-9]/.test(text[at - 1])) return setMentionState(null);
    setMentionState({ start: at, query: between });
  }

  function insertMention(name: string) {
    if (!mentionState) return;
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? value.length;
    const before = value.slice(0, mentionState.start);
    const after = value.slice(caret);
    const inserted = `@${name} `;
    const next = before + inserted + after;
    const nextCaret = (before + inserted).length;
    setValue(next);
    setMentionState(null);
    requestAnimationFrame(() => {
      const t = taRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    setMentionState(null);
    setExpanded(false);
    onSend(trimmed);
  }

  return (
    <div className="ws-composer">
      <div className="ws-composer-inner">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            recomputeMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
          }}
          onKeyUp={(e) => {
            const t = e.currentTarget;
            recomputeMention(t.value, t.selectionStart ?? t.value.length);
          }}
          onClick={(e) => {
            const t = e.currentTarget;
            recomputeMention(t.value, t.selectionStart ?? t.value.length);
          }}
          onKeyDown={(e) => {
            if (mentionState && filtered.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => (h + 1) % filtered.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filtered[highlight]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setMentionState(null);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
        />
        {showExpand ? (
          <button
            type="button"
            className="ws-expand"
            onClick={() => setExpanded(true)}
            aria-label="Expand prompt"
            title="Expand"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2 6V2H6M12 8V12H8M2 2L6 6M12 12L8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          className="ws-send"
          onClick={submit}
          disabled={!value.trim()}
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {mentionState && filtered.length > 0 ? (
          <div className="ws-mention-pop" role="listbox">
            <div className="ws-mention-head">Roblox games</div>
            {filtered.map((name, i) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={`ws-mention-item ${i === highlight ? "ws-mention-item-active" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(name);
                }}
              >
                <span className="ws-mention-dot" aria-hidden />
                {name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {expanded ? (
        <div className="ws-expand-overlay" role="dialog" aria-modal="true" aria-label="Expanded prompt">
          <div className="ws-expand-card">
            <button
              type="button"
              className="ws-expand-close"
              onClick={() => setExpanded(false)}
              aria-label="Close expanded prompt"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <textarea
              ref={expandedTaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
            />
            <div className="ws-expand-bar">
              <span className="ws-tiny ws-muted">⌘↵ to send</span>
              <button
                type="button"
                className="ws-expand-send"
                onClick={submit}
                disabled={!value.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = `
  .ws {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100vh;
    color: #f3efe7;
    background: #0b0d12;
  }

  .ws-side {
    display: grid;
    grid-template-rows: auto 1fr auto;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(15, 17, 23, 0.96);
    min-height: 0;
  }
  .ws-side-top { padding: 18px 16px 12px; display: grid; gap: 12px; }
  .ws-brand {
    display: inline-flex; align-items: center; gap: 10px;
    color: #f3efe7; font-weight: 700; font-size: 1rem; letter-spacing: -0.02em;
  }
  .ws-brand-mark { width: 22px; height: 22px; display: block; }
  .ws-new {
    background: #f3efe7; color: #0b0d12;
    border: 0; border-radius: 999px;
    padding: 11px 16px; text-align: center; font-size: 0.94rem; font-weight: 600;
    cursor: pointer; transition: transform 120ms ease, background 120ms ease;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .ws-new:hover:not(:disabled) { background: #fff; }
  .ws-new:active { transform: translateY(1px); }
  .ws-new:disabled { opacity: 0.5; cursor: not-allowed; }
  .ws-new span[aria-hidden] { font-weight: 400; font-size: 1.05rem; line-height: 1; }

  .ws-side-scroll { overflow-y: auto; padding: 8px 8px 16px; min-height: 0; scrollbar-width: none; }
  .ws-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ws-section-label {
    padding: 10px 8px 6px; font-size: 0.72rem; letter-spacing: 0.14em;
    text-transform: uppercase; color: #6f6a60;
  }
  .ws-side-empty { margin: 0; padding: 8px 12px 14px; font-size: 0.86rem; color: #8a8474; line-height: 1.5; }

  .ws-thread-list { list-style: none; margin: 0; padding: 0; }
  .ws-thread { margin-bottom: 2px; }
  .ws-thread-row {
    width: 100%; display: block;
    padding: 9px 10px; border-radius: 8px;
    color: #f3efe7; font-size: 0.94rem; cursor: pointer; text-align: left;
    text-decoration: none;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ws-thread-row:hover { background: rgba(255, 255, 255, 0.05); }
  .ws-thread-row-active { background: rgba(184, 117, 185, 0.14); color: #f3efe7; }

  .ws-user-wrap { position: relative; border-top: 1px solid rgba(255, 255, 255, 0.06); }
  .ws-user {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; background: transparent; border: 0; color: #f3efe7;
    text-align: left; cursor: pointer;
  }
  .ws-user:hover { background: rgba(255, 255, 255, 0.04); }
  .ws-avatar {
    width: 30px; height: 30px; border-radius: 999px; background: #B875B9; color: #0a0a0a;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.78rem; overflow: hidden; flex: 0 0 auto;
  }
  .ws-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ws-user-meta { display: grid; min-width: 0; }
  .ws-user-name { font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ws-user-email { font-size: 0.76rem; color: #8a8474; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ws-menu {
    position: absolute; bottom: calc(100% + 6px); left: 12px; right: 12px;
    background: #1a1d24; border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px; padding: 4px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  }
  .ws-menu button {
    width: 100%; text-align: left; background: transparent; border: 0;
    color: #f3efe7; padding: 9px 10px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
  }
  .ws-menu button:hover:not(:disabled) { background: rgba(255, 123, 120, 0.12); color: #ff9e91; }

  .ws-main { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  .ws-hero {
    flex: 1; display: grid; place-items: center;
    padding: 40px 24px; overflow-y: auto;
    scrollbar-width: none;
  }
  .ws-hero::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ws-hero-inner { width: min(720px, 100%); display: grid; gap: 22px; text-align: center; }
  .ws-hero-inner h1 {
    margin: 0; font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -0.03em; font-weight: 600;
  }
  .ws-hero-inner .ws-composer { text-align: left; }

  .ws-suggest { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; justify-content: center; }
  .ws-suggest-chip {
    background: rgba(184, 117, 185, 0.08);
    border: 1px solid rgba(184, 117, 185, 0.25);
    color: #e8d6ea; padding: 8px 12px; border-radius: 999px;
    font-size: 0.86rem; cursor: pointer; transition: background 120ms ease;
  }
  .ws-suggest-chip:hover { background: rgba(184, 117, 185, 0.16); }

  .ws-thread-view { flex: 1; display: grid; grid-template-rows: auto 1fr auto; min-height: 0; }
  .ws-thread-head { padding: 18px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
  .ws-thread-head h1 { margin: 0; font-size: 1.05rem; letter-spacing: -0.02em; font-weight: 600; }

  .ws-convo {
    overflow-y: auto; padding: 22px 28px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .ws-convo::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ws-msgs { display: grid; gap: 18px; max-width: 760px; margin: 0 auto; }
  .ws-msg { display: grid; gap: 6px; }
  .ws-msg-role {
    font-family: var(--font-mono), monospace; font-size: 0.7rem;
    letter-spacing: 0.12em; text-transform: uppercase; color: #8a8474;
  }
  .ws-msg-user .ws-msg-role { color: #B875B9; }
  .ws-msg-body { white-space: pre-wrap; line-height: 1.6; color: #f3efe7; font-size: 0.96rem; }
  .ws-mention-pill {
    background: rgba(184, 117, 185, 0.18);
    color: #e8d6ea; border-radius: 6px; padding: 1px 6px;
    font-weight: 500;
  }
  .ws-cursor {
    display: inline-block; width: 8px; height: 1em; vertical-align: -2px;
    background: #B875B9; animation: ws-blink 1s steps(2) infinite;
  }
  @keyframes ws-blink { to { opacity: 0; } }
  .ws-muted { color: #8a8474; }
  .ws-tiny { font-size: 0.78rem; }

  .ws-composer-wrap {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding: 16px 22px 20px;
    background: rgba(11, 13, 18, 0.94);
  }
  .ws-composer { display: grid; gap: 10px; max-width: 760px; margin: 0 auto; width: 100%; }
  .ws-composer-inner { position: relative; }
  .ws-composer textarea {
    width: 100%; resize: none; min-height: 56px; max-height: 240px;
    border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(7, 10, 14, 0.6); color: #f3efe7;
    padding: 16px 56px 16px 18px; font-size: 0.96rem; line-height: 1.5;
    font-family: inherit;
    overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none;
  }
  .ws-composer textarea::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ws-composer textarea:focus { outline: 2px solid #B875B9; outline-offset: 1px; }
  .ws-expand {
    position: absolute; right: 52px; bottom: 12px;
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255, 255, 255, 0.05); color: #b6b0a6; border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    transition: background 120ms ease, color 120ms ease;
  }
  .ws-expand:hover { background: rgba(255, 255, 255, 0.1); color: #f3efe7; }
  .ws-send {
    position: absolute; right: 10px; bottom: 10px;
    width: 34px; height: 34px; border-radius: 999px;
    background: #B875B9; color: #0a0a0a; border: 0; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  }
  .ws-send:disabled { opacity: 0.4; cursor: not-allowed; }
  .ws-send:hover:not(:disabled) { background: #822FB2; color: #fff; }
  .ws-send:active:not(:disabled) { transform: translateY(1px); }

  .ws-mention-pop {
    position: absolute; bottom: calc(100% + 8px); left: 0;
    width: min(320px, 100%);
    background: #15181f; border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px; padding: 6px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    display: grid; gap: 1px; z-index: 20;
  }
  .ws-mention-head {
    padding: 8px 10px 6px; font-family: var(--font-mono), monospace;
    font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #6f6a60;
  }
  .ws-mention-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; text-align: left; background: transparent; border: 0;
    color: #f3efe7; padding: 8px 10px; border-radius: 8px; cursor: pointer;
    font-size: 0.92rem;
  }
  .ws-mention-item-active { background: rgba(184, 117, 185, 0.18); }
  .ws-mention-dot {
    width: 8px; height: 8px; border-radius: 999px; background: #B875B9; flex: 0 0 auto;
  }

  .ws-expand-overlay {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(5, 7, 11, 0.7);
    backdrop-filter: blur(6px);
    display: grid; place-items: center;
    padding: 48px;
    animation: ws-fade 120ms ease;
  }
  @keyframes ws-fade { from { opacity: 0; } to { opacity: 1; } }
  .ws-expand-card {
    position: relative;
    width: min(960px, 100%); height: min(720px, 100%);
    background: #11141b; border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px; padding: 24px;
    display: grid; grid-template-rows: 1fr auto; gap: 14px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  }
  .ws-expand-close {
    position: absolute; top: 14px; right: 14px;
    width: 32px; height: 32px; border-radius: 8px;
    background: transparent; color: rgba(243, 239, 231, 0.4); border: 0;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    transition: color 120ms ease, background 120ms ease;
  }
  .ws-expand-close:hover { color: #f3efe7; background: rgba(255, 255, 255, 0.06); }
  .ws-expand-card textarea {
    width: 100%; height: 100%; resize: none;
    background: transparent; border: 0; color: #f3efe7;
    font-size: 1.02rem; line-height: 1.6; font-family: inherit;
    padding: 14px 40px 0 0;
    overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none;
  }
  .ws-expand-card textarea::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .ws-expand-card textarea:focus { outline: none; }
  .ws-expand-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .ws-expand-send {
    background: #B875B9; color: #0a0a0a; border: 0; border-radius: 10px;
    padding: 10px 18px; font-weight: 700; cursor: pointer;
  }
  .ws-expand-send:hover:not(:disabled) { background: #822FB2; color: #fff; }
  .ws-expand-send:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 760px) {
    .ws-expand-overlay { padding: 0; }
    .ws-expand-card { width: 100%; height: 100%; border-radius: 0; }
  }

  @media (max-width: 760px) {
    .ws { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .ws-side { border-right: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); max-height: 50vh; }
  }

  /* slim icon rail (in-thread) */
  .ws-rail-mode { grid-template-columns: 56px 1fr; }
  .ws-rail-mode.ws-history-open { grid-template-columns: 316px 1fr; }

  .ws-rail { display: grid; grid-template-columns: 56px; overflow: hidden; }
  .ws-rail-wide { grid-template-columns: 56px 260px; }
  .ws-rail-icons { display: grid; grid-template-rows: 1fr auto; padding: 14px 0; min-width: 0; }
  .ws-rail-chats {
    display: grid; grid-template-rows: auto 1fr;
    padding: 16px 12px 16px 4px;
    min-width: 0; overflow: hidden;
  }

  .ws-history-head {
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 14px; margin-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .ws-history-back {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
    color: #b6b0a6; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    flex: 0 0 auto;
  }
  .ws-history-back:hover { background: rgba(255, 255, 255, 0.08); color: #f3efe7; }
  .ws-history-title {
    flex: 1;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px; padding: 7px 10px;
    font-size: 0.9rem; font-weight: 600; color: #f3efe7;
  }
  .ws-history-body {
    display: grid; gap: 6px; align-content: start;
    overflow-y: auto; padding-top: 6px;
    scrollbar-width: none;
  }
  .ws-history-body::-webkit-scrollbar { width: 0; display: none; }
  .ws-history-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; text-align: left;
    background: transparent; border: 1px solid transparent;
    color: #f3efe7; padding: 10px 12px; border-radius: 10px;
    font-size: 0.9rem; cursor: pointer;
  }
  .ws-history-item:hover { background: rgba(255, 255, 255, 0.04); }
  .ws-history-item-active { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.08); }
  .ws-history-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
  .ws-history-item-tag { font-size: 0.78rem; color: #8a8474; font-weight: 400; }
  .ws-history-new {
    display: flex; align-items: center; gap: 8px;
    width: 100%; text-align: left;
    background: transparent; border: 1px dashed rgba(255, 255, 255, 0.14);
    color: #8a8474; padding: 10px 12px; border-radius: 10px;
    font-size: 0.9rem; font-style: italic; cursor: pointer;
    margin-top: 2px;
  }
  .ws-history-new:hover { border-color: rgba(184, 117, 185, 0.4); color: #e8d6ea; background: rgba(184, 117, 185, 0.06); }
  .ws-history-new span[aria-hidden] { font-style: normal; }
  .ws-rail {
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(15, 17, 23, 0.96);
  }
  .ws-rail-top { display: grid; gap: 4px; justify-items: center; align-content: start; }
  .ws-rail-bottom { display: grid; justify-items: center; padding-bottom: 6px; position: relative; }
  .ws-rail-brand {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 10px;
    margin-bottom: 4px;
  }
  .ws-rail-brand:hover { background: rgba(255, 255, 255, 0.05); }
  .ws-rail-pop-host { position: relative; }
  .ws-rail-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: transparent; color: #8a8474; border: 0;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    transition: color 120ms ease, background 120ms ease;
  }
  .ws-rail-icon:hover { color: #f3efe7; background: rgba(255, 255, 255, 0.04); }
  .ws-rail-icon-active { color: #f3efe7; background: rgba(184, 117, 185, 0.14); }
  .ws-rail-avatar {
    width: 32px; height: 32px; border-radius: 999px;
    background: #B875B9; color: #0a0a0a; border: 0; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.72rem; overflow: hidden;
  }
  .ws-rail-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ws-menu-rail { left: calc(100% + 8px); right: auto; bottom: 6px; width: 180px; }

  /* rail popovers */
  .ws-rail-pop {
    position: absolute; left: calc(100% + 8px); top: 0;
    width: 240px;
    background: #15181f; border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px; padding: 10px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    z-index: 30;
  }
  .ws-rail-pop-wide { width: 320px; }
  .ws-pop-head {
    font-family: var(--font-mono), monospace;
    font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #6f6a60;
    padding: 4px 6px 8px;
  }
  .ws-pop-row {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 6px; font-size: 0.88rem; color: #f3efe7;
  }
  .ws-pop-hint { margin: 6px 6px 2px; font-size: 0.82rem; color: #8a8474; line-height: 1.5; }
  .ws-pop-hint code { background: rgba(255, 255, 255, 0.06); padding: 1px 5px; border-radius: 4px; font-size: 0.78rem; }
  .ws-pop-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
  .ws-pop-item {
    display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center;
    padding: 8px 8px; border-radius: 8px;
    color: #f3efe7; font-size: 0.9rem; text-decoration: none;
  }
  .ws-pop-item:hover { background: rgba(255, 255, 255, 0.05); }
  .ws-pop-item-active { background: rgba(184, 117, 185, 0.14); }
  .ws-pop-item-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ws-pop-item-date { font-size: 0.74rem; color: #8a8474; }

  /* status dots / pills */
  .ws-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 999px;
    background: #6f6a60; flex: 0 0 auto;
  }
  .ws-dot-idle { background: #6f6a60; }
  .ws-dot-thinking { background: #f5b54a; box-shadow: 0 0 0 3px rgba(245, 181, 74, 0.18); animation: ws-pulse 1.4s ease-in-out infinite; }
  .ws-dot-ready { background: #4ad295; box-shadow: 0 0 0 3px rgba(74, 210, 149, 0.18); }
  .ws-dot-ok { background: #4ad295; }
  .ws-dot-bad { background: #ff6b6b; }
  @keyframes ws-pulse { 50% { opacity: 0.55; } }

  .ws-thread-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
  .ws-thread-head-left { display: inline-flex; align-items: center; gap: 12px; min-width: 0; }
  .ws-thread-head-right { display: inline-flex; align-items: center; gap: 4px; }

  .ws-conn-host { position: relative; }
  .ws-conn-icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: transparent; border: 0; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: #8a8474; transition: color 120ms ease, background 120ms ease;
  }
  .ws-conn-icon:hover { background: rgba(255, 255, 255, 0.04); color: #f3efe7; }
  .ws-conn-ok { color: #4ad295; }
  .ws-conn-bad { color: #ff6b6b; }
  .ws-conn-bad:hover { color: #ff8e8e; }
  .ws-conn-pop {
    position: absolute; right: 0; top: calc(100% + 8px);
    width: 260px;
    background: #15181f; border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px; padding: 10px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    z-index: 30;
  }

  .ws-pop-action {
    margin-top: 6px;
    width: 100%; text-align: left;
    background: rgba(184, 117, 185, 0.12); border: 1px solid rgba(184, 117, 185, 0.3);
    color: #e8d6ea; padding: 8px 10px; border-radius: 8px;
    font-size: 0.88rem; cursor: pointer;
  }
  .ws-pop-action:hover { background: rgba(184, 117, 185, 0.2); }

  .ws-pop-item { width: 100%; background: transparent; border: 0; cursor: pointer; }

  .ws-status {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 10px 5px 9px; border-radius: 999px;
    font-size: 0.78rem; color: #c4bfb3;
    background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .ws-status-thinking { color: #f5d28a; border-color: rgba(245, 181, 74, 0.3); background: rgba(245, 181, 74, 0.08); }
  .ws-status-ready { color: #b1ebcf; border-color: rgba(74, 210, 149, 0.3); background: rgba(74, 210, 149, 0.08); }

  @media (max-width: 760px) {
    .ws-rail-mode, .ws-rail-mode.ws-history-open { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .ws-rail-wide { grid-template-columns: 1fr; grid-template-rows: auto auto; }
    .ws-rail { grid-template-rows: auto; grid-auto-flow: column; padding: 10px; justify-content: start; gap: 8px; }
    .ws-rail-top { grid-auto-flow: column; }
    .ws-rail-bottom { padding: 0; }
    .ws-rail-pop { left: 0; top: calc(100% + 8px); }
    .ws-menu-rail { left: 0; bottom: auto; top: calc(100% + 8px); }
  }
`;
