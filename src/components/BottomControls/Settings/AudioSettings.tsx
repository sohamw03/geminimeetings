"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useMemo } from "react";

export default function AudioSettings() {
  const { audioDevices, selectedAudioDeviceId, setSelectedAudioDeviceId, initOrRefreshMediaStream } = useGlobal();

  const handleMicChange = (event: any) => {
    const deviceId = event.target.value;
    setSelectedAudioDeviceId(deviceId);
    initOrRefreshMediaStream("refresh", deviceId, null);
  };

  if (!audioDevices) return null;

  // Pre-compute a stable max width for label area to avoid reflow when labels arrive
  const maxLabelChars = useMemo(() => {
    return Math.min(
      40,
      audioDevices.devices.reduce((m, d) => (d.label.length > m ? d.label.length : m), 10)
    );
  }, [audioDevices.devices]);

  const truncate = (label: string) => {
    const limit = 34; // visual limit
    return label.length > limit ? label.slice(0, limit - 1) + "…" : label;
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <FormControl fullWidth size="medium" sx={{ mt: 1 }}>
        <InputLabel id="mic">Mic</InputLabel>
        <Select
          labelId="mic"
          id="mic"
          value={selectedAudioDeviceId || ""}

          label="Mic"
          onChange={handleMicChange}
          displayEmpty
          renderValue={(selected) => {
            const dev = audioDevices.devices.find(d => d.deviceId === selected);
            return dev ? truncate(dev.label) : "Select Mic";
          }}
          sx={{
            minHeight: 56,
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pr: 4,
              width: '100%',
            },
            // Reserve horizontal space based on maxLabelChars (roughly .6ch per char due to ellipsis possibility)
            fontFamily: 'inherit',
          }}
          MenuProps={{
            anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
            transformOrigin: { vertical: 'top', horizontal: 'left' },
            PaperProps: {
              sx: {
                maxWidth: { xs: 'calc(100vw - 32px)', sm: 520 },
                width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
                overflowX: 'hidden',
                '& .MuiMenuItem-root': {
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }
              }
            }
          }}
        >
          {audioDevices.devices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
