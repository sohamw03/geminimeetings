import { Dialog, DialogTitle, DialogContent, Box, Button, Typography, Tooltip, IconButton } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

interface ShareProps {
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ open, onClose }: ShareProps) {
  const [copied, setCopied] = useState(false);
  const roomName = window.location.href.split("/").pop();
  const meetingUrl = `${window.location.origin}/?id=${roomName}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=Join my GeminiMeeting at: ${encodeURIComponent(meetingUrl)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = () => {
    const emailUrl = `mailto:?subject=Join my GeminiMeeting&body=Join my GeminiMeeting at: ${encodeURIComponent(meetingUrl)}`;
    window.location.href = emailUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Share Meeting
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={2}>
          {/* QR Code */}
          <Box bgcolor="white" p={2} borderRadius={1}>
            <QRCodeSVG value={meetingUrl} size={200} />
          </Box>

          {/* Meeting URL */}
          <Box
            sx={{
              bgcolor: "background.paper",
              p: 2,
              borderRadius: 1,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
              {meetingUrl}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
              <IconButton onClick={handleCopy}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Share Buttons */}
          <Box display="flex" gap={2} width="100%">
            <Button variant="contained" fullWidth startIcon={<WhatsAppIcon />} onClick={handleWhatsAppShare} sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#128C7E" } }}>
              WhatsApp
            </Button>
            <Button variant="contained" fullWidth startIcon={<EmailIcon />} onClick={handleEmailShare}>
              Email
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
