"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useMemo } from "react";

export default function VideoSettings() {
  // Global Context
  const { videoDevices, selectedVideoDeviceId, setSelectedVideoDeviceId, initOrRefreshMediaStream } = useGlobal();

  const handleMicChange = (event: any) => {
    const deviceId = event.target.value;
    setSelectedVideoDeviceId(deviceId);
    initOrRefreshMediaStream("refresh", null, deviceId);
  };

  if (!videoDevices) return null;

  const truncate = (label: string) => {
    const limit = 34;
    return label.length > limit ? label.slice(0, limit - 1) + "…" : label;
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <FormControl fullWidth size="medium" sx={{ mt: 1 }}>
        <InputLabel id="cam">Camera</InputLabel>
        <Select
          labelId="cam"
          id="cam"
          value={selectedVideoDeviceId || ""}
          label="Camera"
          onChange={handleMicChange}
          displayEmpty
          renderValue={(selected) => {
            const dev = videoDevices.devices.find(d => d.deviceId === selected);
            return dev ? truncate(dev.label) : "Select Camera";
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
          {videoDevices.devices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
