import { useGlobal } from "@/globalContext/GlobalContext";
import { AttachFile, Close, Send } from "@mui/icons-material";
import { Box, IconButton, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import CircularProgress from '@mui/material/CircularProgress';

export default function Chat({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, sendFile } = useGlobal();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
        setError(err instanceof Error ? err.message : 'Failed to send file');
        setUploadProgress(null);
        console.error(err);
      }
    }
  };

  return (
    <Paper sx={{
      position: 'absolute',
      bottom: '100px',
      right: '20px',
      width: '300px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      gap: 2,
      zIndex: 20
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{
            mb: 1,
            textAlign: msg.sender === 'me' ? 'right' : 'left',
            '& > *': {
              bgcolor: msg.sender === 'me' ? 'primary.main' : 'grey.300',
              color: 'black',
              p: 1,
              borderRadius: 1,
              display: 'inline-block',
              maxWidth: '80%'
            }
          }}>
            {msg.type === 'file' ? (
              <a href={msg.content} download={msg.fileName}>
                📎 {msg.fileName}
              </a>
            ) : (
              <span>{msg.content}</span>
            )}
          </Box>
        ))}
      </Box>

      {error && (
        <Typography color="error" variant="caption" sx={{ px: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <input
          type="file"
          id="file-upload"
          hidden
          onChange={handleFileUpload}
          disabled={uploadProgress !== null}
        />
        <label htmlFor="file-upload">
          <IconButton component="span" disabled={uploadProgress !== null}>
            {uploadProgress !== null ? (
              <CircularProgress
                size={24}
                variant="determinate"
                value={uploadProgress}
              />
            ) : (
              <AttachFile />
            )}
          </IconButton>
        </label>
        <TextField
          size="small"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <IconButton onClick={handleSend}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
}
