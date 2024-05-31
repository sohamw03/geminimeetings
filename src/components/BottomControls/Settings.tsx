import { Values, useGlobal } from "@/globalContext/GlobalContext";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Modal, Paper, Stack, Typography, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";

export default function Settings() {
  // Global Context
  const { open, setOpen }: Values = useGlobal();

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
          p: 2,
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
            width: "80vw",
            maxWidth: "60rem",
            height: "70vh",
            maxHeight: "40rem",
            p: 0,
            borderRadius: 4,
          }}>
          <Grid
            container
            sx={{
              height: "100%",
            }}>
            <Grid
              xs={4}
              sx={{
                borderRight: "1px solid #323232",
                height: "100%",
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
                <Item>Audio</Item>
                <Item>Video</Item>
              </Stack>
            </Grid>
            <Box>Box Content</Box>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
}
