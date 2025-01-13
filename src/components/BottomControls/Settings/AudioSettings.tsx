"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

export default function AudioSettings() {
  // Global Context
  const { audioDevices, setAudioDevices, initOrRefreshMediaStream } = useGlobal();
  // Local State
  const [localAudioDevices, setLocalAudioDevices] = useState<MediaDeviceInfo[]>(audioDevices.devices);

  useEffect(() => {
    setLocalAudioDevices(audioDevices.devices);
  }, [audioDevices.devices]);

  const handleMicChange = (event: any) => {
    let selectedDevice = audioDevices.devices.find((device) => device.deviceId === event.target.value) as MediaDeviceInfo;
    console.log({ state: audioDevices.selectedDevice, event: event.target.value });
    setAudioDevices({
      ...audioDevices,
      selectedDevice: selectedDevice,
    });
    initOrRefreshMediaStream("refresh", selectedDevice.deviceId, null);
  };

  if (!audioDevices) return null;
  return (
    <Box sx={{ maxWidth: "80%", margin: "auto" }}>
      <FormControl fullWidth>
        <InputLabel id="mic">Mic</InputLabel>
        <Select labelId="mic" id="mic" value={audioDevices.selectedDevice?.deviceId} label="Mic" onChange={handleMicChange}>
          {localAudioDevices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
