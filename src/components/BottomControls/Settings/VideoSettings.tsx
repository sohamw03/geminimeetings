"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

export default function VideoSettings() {
  // Global Context
  const { videoDevices, selectedVideoDeviceId, setSelectedVideoDeviceId, initOrRefreshMediaStream } = useGlobal();

  const handleMicChange = (event: any) => {
    const deviceId = event.target.value;
    setSelectedVideoDeviceId(deviceId);
    initOrRefreshMediaStream("refresh", null, deviceId);
  };

  if (!videoDevices) return null;
  return (
    <Box sx={{ maxWidth: "80%", margin: "auto" }}>
      <FormControl fullWidth>
        <InputLabel id="cam">Camera</InputLabel>
        <Select labelId="cam" id="cam" value={selectedVideoDeviceId || ''} label="Cam" onChange={handleMicChange}>
          {videoDevices.devices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
