"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

export default function AudioSettings() {
  const { audioDevices, selectedAudioDeviceId, setSelectedAudioDeviceId, initOrRefreshMediaStream } = useGlobal();

  const handleMicChange = (event: any) => {
    const deviceId = event.target.value;
    setSelectedAudioDeviceId(deviceId);
    initOrRefreshMediaStream("refresh", deviceId, null);
  };

  if (!audioDevices) return null;
  return (
    <Box sx={{ maxWidth: "80%", margin: "auto" }}>
      <FormControl fullWidth>
        <InputLabel id="mic">Mic</InputLabel>
        <Select labelId="mic" id="mic" value={selectedAudioDeviceId || ''} label="Mic" onChange={handleMicChange}>
          {audioDevices.devices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
