import { Values, useGlobal } from "@/globalContext/GlobalContext";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Modal, Paper, Tab, Tabs, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import AudioSettings from "./AudioSettings";
import VideoSettings from "./VideoSettings";

interface SettingsProps {
  inMenu?: boolean;
}

const selectedPanel = [<AudioSettings />, <VideoSettings />];

export default function Settings({ inMenu = false }: SettingsProps) {
  // Global Context
  const { open, setOpen }: Values = useGlobal();
  // Local State
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Item styled button removed (unused in new layout)

  return (
    <>
      {/* Trigger */}
      {inMenu ? (
        <Box onClick={() => setOpen(true)} sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
          <SettingsIcon />
          <span>Settings</span>
        </Box>
      ) : (
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Button
            sx={{ p: { xs: 1.5, md: 2 }, mr: 3.5, borderRadius: "100%", border: 2, borderColor: "grey.800" }}
            onClick={() => {
              setOpen(true);
            }}
          >
            <SettingsIcon fontSize="large" />
          </Button>
        </Box>
      )}
      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-description"
      >
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: isMobile ? 0 : "50%",
            left: isMobile ? 0 : "50%",
            transform: isMobile ? "none" : "translate(-50%, -50%)",
            width: isMobile ? "100vw" : "95vw",
            maxWidth: isMobile ? "100vw" : "60rem",
            height: isMobile ? "100vh" : "70vh",
            maxHeight: isMobile ? "100vh" : "40rem",
            p: 0,
            borderRadius: isMobile ? 0 : 4,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                pt: 3,
                pb: 1,
                borderBottom: { xs: "1px solid #323232", md: "none" },
              }}
            >
              <Typography id="settings-modal-title" variant={isMobile ? "h5" : "h4"}>Settings</Typography>
              <Button
                sx={{ borderRadius: "100rem", minWidth: 0, p: 1.2 }}
                onClick={() => setOpen(false)}
                size="small"
                variant="text"
                aria-label="Close settings"
              >
                <CloseIcon fontSize="small" />
              </Button>
            </Box>
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {!isMobile && (
                <Box
                  sx={{
                    width: { md: "30%" },
                    maxWidth: 280,
                    borderRight: "1px solid #323232",
                    py: 2,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    aria-label="Settings tabs"
                    sx={{ px: 2 }}
                  >
                    <Tab label="Audio" id={`settings-tab-${0}`} aria-controls={`settings-tabpanel-${0}`} sx={{ alignItems: 'flex-start' }} />
                    <Tab label="Video" id={`settings-tab-${1}`} aria-controls={`settings-tabpanel-${1}`} sx={{ alignItems: 'flex-start' }} />
                  </Tabs>
                </Box>
              )}
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                {isMobile && (
                  <Tabs
                    orientation="horizontal"
                    variant="fullWidth"
                    value={value}
                    onChange={handleChange}
                    aria-label="Settings tabs"
                    sx={{ borderBottom: "1px solid #323232" }}
                  >
                    <Tab label="Audio" id={`settings-tab-${0}`} aria-controls={`settings-tabpanel-${0}`} />
                    <Tab label="Video" id={`settings-tab-${1}`} aria-controls={`settings-tabpanel-${1}`} />
                  </Tabs>
                )}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                  <div
                    role="tabpanel"
                    hidden={value !== 0}
                    id={`settings-tabpanel-${0}`}
                    aria-labelledby={`settings-tab-${0}`}
                    style={{ height: '100%' }}
                  >
                    {value === 0 && <Box>{selectedPanel[0]}</Box>}
                  </div>
                  <div
                    role="tabpanel"
                    hidden={value !== 1}
                    id={`settings-tabpanel-${1}`}
                    aria-labelledby={`settings-tab-${1}`}
                    style={{ height: '100%' }}
                  >
                    {value === 1 && <Box>{selectedPanel[1]}</Box>}
                  </div>
                </Box>
              </Box>
            </Box>
        </Paper>
      </Modal>
    </>
  );
}
