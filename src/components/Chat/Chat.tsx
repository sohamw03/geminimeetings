import { useGlobal } from "@/globalContext/GlobalContext";
import { AttachFile, Close, Send } from "@mui/icons-material";
import { Box, IconButton, Paper, TextField, Typography } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";

export default function Chat({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, sendFile } = useGlobal();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        setUploadProgress(0);
        await sendFile(file, (progress) => {
          setUploadProgress(progress);
        });
        setUploadProgress(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send file");
        setUploadProgress(null);
        console.error(err);
      }
    }
  };

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: "9rem",
        right: "1rem",
        width: { xs: "calc(100% - 2rem)", sm: "25rem" },
        height: "50vh",
        display: "flex",
        flexDirection: "column",
        p: 2,
        gap: 2,
        zIndex: 20,
      }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto", pr: "0.5rem" }}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              mb: 1,
              textAlign: msg.sender === "me" ? "right" : "left",
            }}>
            <Typography
              variant="caption"
              sx={{
                px: 1,
                color: "text.secondary",
                display: "block",
              }}>
              {msg.sender === "me" ? "You" : "Peer"}
            </Typography>
            <Box
              sx={{
                bgcolor: msg.sender === "me" ? "grey.800" : "grey.800",
                color: msg.sender === "me" ? "white" : "text.primary",
                p: 1.5,
                borderRadius: 2,
                display: "inline-block",
                maxWidth: "80%",
                boxShadow: 1,
              }}>
              {msg.type === "file" ? (
                <a
                  href={msg.content}
                  target="_blank"
                  download={msg.fileName}
                  style={{
                    overflowWrap: "anywhere",
                    color: msg.sender === "me" ? "white" : "inherit",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                  <AttachFile fontSize="small" /> {msg.fileName}
                </a>
              ) : (
                <span style={{ overflowWrap: "anywhere" }}>{msg.content}</span>
              )}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {error && (
        <Typography color="error" variant="caption" sx={{ px: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <input type="file" id="file-upload" hidden onChange={handleFileUpload} disabled={uploadProgress !== null} />
        <label htmlFor="file-upload">
          <IconButton component="span" disabled={uploadProgress !== null}>
            {uploadProgress !== null ? <CircularProgress size={24} variant="determinate" value={uploadProgress} /> : <AttachFile />}
          </IconButton>
        </label>
        <TextField size="medium" fullWidth value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} />
        <IconButton onClick={handleSend}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
}
