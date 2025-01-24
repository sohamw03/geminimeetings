import { Values, useGlobal } from "@/globalContext/GlobalContext";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Modal, Paper, Stack, Typography, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useState } from "react";
import AudioSettings from "./AudioSettings";
import VideoSettings from "./VideoSettings";

export default function Settings() {
  // Global Context
  const { open, setOpen }: Values = useGlobal();
  // Local State
  const [value, setValue] = useState(0);

  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  const Item = styled(Button)(({ theme }) => ({
    backgroundColor: "#323232",
    padding: theme.spacing(2),
    borderStartStartRadius: 0,
    borderEndStartRadius: 0,
    borderStartEndRadius: 32,
    borderEndEndRadius: 32,
    textAlign: "left",
    justifyContent: "flex-start",
    paddingLeft: theme.spacing(4),
    color: theme.palette.text.secondary,
    textTransform: "none",
    fontSize: "1rem",
  }));

  return (
    <>
      {/* Trigger */}
      <Button
        sx={{
          p: { xs: 1.5, md: 2 },
          mr: 3.5,
          borderRadius: "100%",
        }}
        className="border-2 border-gray-700 border-solid"
        onClick={() => {
          setOpen(true);
        }}>
        <SettingsIcon fontSize="large" />
      </Button>
      {/* Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description">
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95vw",
            maxWidth: "60rem",
            height: { xs: "90vh", md: "70vh" },
            maxHeight: "40rem",
            p: 0,
            borderRadius: 4,
          }}>
          <Grid
            container
            sx={{
              height: "100%",
              flexDirection: { xs: "column", md: "row" },
            }}>
            <Grid
              xs={12}
              md={4}
              sx={{
                borderRight: { xs: "none", md: "1px solid #323232" },
                borderBottom: { xs: "1px solid #323232", md: "none" },
                height: { xs: "auto", md: "100%" },
                pr: 2,
              }}>
              <Stack spacing={2}>
                <Typography
                  variant="h4"
                  sx={{
                    p: 3,
                    pb: 1,
                  }}>
                  Settings
                </Typography>
                <Item
                  onClick={() => {
                    handleChange(0);
                  }}
                  className="transition-all"
                  sx={{
                    backgroundColor: value === 0 ? "#323232" : "transparent",
                  }}>
                  Audio
                </Item>
                <Item
                  onClick={() => {
                    handleChange(1);
                  }}
                  className="transition-all"
                  sx={{
                    backgroundColor: value === 1 ? "#323232" : "transparent",
                  }}>
                  Video
                </Item>
              </Stack>
            </Grid>
            <Box
              sx={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
              }}>
              <div className="w-full flex flex-row justify-end h-16">
                <Button
                  sx={{
                    borderRadius: "100rem",
                  }}
                  onClick={() => {
                    setOpen(false);
                  }}
                  size="small"
                  variant="text">
                  <CloseIcon fontSize="small" />
                </Button>
              </div>
              {/* Audio Panel */}
              <TabPanel value={value} index={0} handleChange={handleChange}>
                <AudioSettings />
              </TabPanel>
              {/* Video Panel */}
              <TabPanel value={value} index={1} handleChange={handleChange}>
                <VideoSettings />
              </TabPanel>
            </Box>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
}

const TabPanel = (props: any) => {
  const { children, value, index, handleChange, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};
