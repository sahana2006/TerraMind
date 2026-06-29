import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { FaLeaf, FaPaperPlane, FaRobot } from "react-icons/fa6";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";
import "../styles/aiChatbot.css";

const QUICK_PROMPTS = [
  "What is horticulture?",
  "Rice cultivation guide",
  "Symptoms of bacterial wilt",
  "Best fertilizer for tomato",
];

const formatTime = (value) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderMarkdown = (value) => {
  const safe = escapeHtml(value);
  return safe
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
};

const parseError = (error) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof error.response?.data === "string" && error.response.data.trim())
    return error.response.data;
  return "The assistant could not respond right now. Please try again.";
};

function LoadingIndicator() {
  return (
    <div className="ai-chatbot-loading" aria-label="Assistant is typing">
      <span />
      <span />
      <span />
    </div>
  );
}

function SuggestionChips({ items, onPick }) {
  return (
    <div className="ai-chatbot-chips">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="ai-chatbot-chip"
          onClick={() => onPick(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message, expandedSource, onToggleSource }) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={`ai-chatbot-message ai-chatbot-message--${message.role}`}
    >
      <div className="ai-chatbot-message__avatar">
        {isAssistant ? <FaRobot /> : <span>YOU</span>}
      </div>
      <div className="ai-chatbot-message__content">
        <div className="ai-chatbot-message__meta">
          <strong>{isAssistant ? "TerraMind AI" : "You"}</strong>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <div className="ai-chatbot-message__bubble">
          <div
            className="ai-chatbot-message__text"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(message.content),
            }}
          />
        </div>

        {isAssistant &&
          Array.isArray(message.sources) &&
          message.sources.length > 0 && (
            <div className="ai-chatbot-sources">
              <span className="ai-chatbot-sources__label">Sources</span>
              <div className="ai-chatbot-sources__grid">
                {message.sources.map((source, index) => {
                  const key = `${message.id}-${index}`;
                  const isOpen = expandedSource === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`ai-chatbot-source-card ${isOpen ? "is-open" : ""}`}
                      onClick={() => onToggleSource(key)}
                    >
                      <strong>{source.source_filename}</strong>
                      <span>
                        {source.category} •{" "}
                        {source.page_number
                          ? `Page ${source.page_number}`
                          : "Page unknown"}
                      </span>
                      {isOpen && <small>{source.source_path}</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </article>
  );
}

function ChatWindow({
  messages,
  expandedSource,
  onToggleSource,
  onPick,
  loading,
  endRef,
}) {
  return (
    <div className="ai-chatbot-window">
      {messages.length === 0 ? (
        <div className="ai-chatbot-welcome">
          <div className="ai-chatbot-welcome__icon">
            <FaLeaf />
          </div>
          <h2>Ask TerraMind AI Advisor</h2>
          <p>
            Start with a crop question, a disease symptom, or a farm-management
            decision. The assistant will answer using the connected RAG backend.
          </p>
        </div>
      ) : (
        <div className="ai-chatbot-thread">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              expandedSource={expandedSource}
              onToggleSource={onToggleSource}
            />
          ))}
          {loading && <LoadingIndicator />}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

function ChatInput({ value, onChange, onSend, disabled }) {
  return (
    <Form
      className="ai-chatbot-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(value);
      }}
    >
      <Form.Control
        as="textarea"
        rows={2}
        value={value}
        placeholder="Ask about crops, soil, weather, irrigation, or disease symptoms..."
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend(value);
          }
        }}
        disabled={disabled}
      />
      <div className="ai-chatbot-composer__row">
        <span className="ai-chatbot-composer__hint">
          Enter to send, Shift+Enter for a new line.
        </span>
        <Button
          type="submit"
          variant="success"
          className="ai-chatbot-composer__send"
          disabled={disabled || !value.trim()}
        >
          <FaPaperPlane />
          Send
        </Button>
      </div>
    </Form>
  );
}

export default function AIChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSource, setExpandedSource] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || loading) return;

    setError("");
    setDraft("");
    setExpandedSource("");
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const response = await api.post("/chat/", { message });
      const answer = response.data?.answer;
      const sources = Array.isArray(response.data?.sources)
        ? response.data.sources
        : [];

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("empty-response");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
          sources,
        },
      ]);
    } catch (err) {
      const fallback =
        err?.message === "empty-response"
          ? "The assistant returned an empty response."
          : parseError(err);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallback,
          createdAt: new Date().toISOString(),
          sources: [],
          isError: true,
        },
      ]);
      setError(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container fluid className="px-0">
        <Row className="justify-content-center">
          <Col xl={11} xxl={10}>
            <div className="ai-chatbot-page">
              <div className="ai-chatbot-hero">
                <div>
                  <p className="dashboard-eyebrow mb-3">AI advisor</p>
                  <h1 className="mb-3">TerraMind chat assistant</h1>
                  <p className="ai-chatbot-hero__lead mb-0">
                    A modern TerraMind chat interface for farm questions, crop
                    guidance, disease symptoms, and weather-aware advice.
                  </p>
                </div>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Row className="g-3 g-xl-4 align-items-stretch">
                <Col xl={4} className="d-flex">
                  <Card className="dashboard-card ai-chatbot-side w-100">
                    <Card.Body>
                      <div className="ai-chatbot-side__header">
                        <div>
                          <p className="dashboard-eyebrow mb-2">
                            Quick suggestions
                          </p>
                          <h2>Tap to ask</h2>
                        </div>
                      </div>
                      <SuggestionChips
                        items={QUICK_PROMPTS}
                        onPick={sendMessage}
                      />
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={8} className="d-flex">
                  <Card className="dashboard-card ai-chatbot-chat w-100">
                    <Card.Body className="d-flex flex-column">
                      <ChatWindow
                        messages={messages}
                        expandedSource={expandedSource}
                        onToggleSource={(key) =>
                          setExpandedSource((current) =>
                            current === key ? "" : key,
                          )
                        }
                        onPick={sendMessage}
                        loading={loading}
                        endRef={endRef}
                      />
                      <ChatInput
                        value={draft}
                        onChange={setDraft}
                        onSend={sendMessage}
                        disabled={loading}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
