"use client";
import { useGlobal } from "@/globalContext/GlobalContext";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

export default function VideoSettings() {
  // Global Context
  const { videoDevices, setVideoDevices, initOrRefreshMediaStream } = useGlobal();
  // Local State
  const [localVideoDevices, setLocalVideoDevices] = useState<MediaDeviceInfo[]>(videoDevices.devices);

  useEffect(() => {
    setLocalVideoDevices(videoDevices.devices);
  }, [videoDevices.devices]);

  const handleMicChange = (event: any) => {
    let selectedDevice = videoDevices.devices.find((device) => device.deviceId === event.target.value) as MediaDeviceInfo;
    console.log({ state: videoDevices.selectedDevice, event: event.target.value });
    setVideoDevices({
      ...videoDevices,
      selectedDevice: selectedDevice,
    });
    initOrRefreshMediaStream("refresh", null, selectedDevice.deviceId);
  };

  if (!videoDevices) return null;
  return (
    <Box sx={{ maxWidth: "80%", margin: "auto" }}>
      <FormControl fullWidth>
        <InputLabel id="cam">Camera</InputLabel>
        <Select labelId="cam" id="cam" value={videoDevices.selectedDevice?.deviceId} label="Cam" onChange={handleMicChange}>
          {localVideoDevices.map((device, index) => (
            <MenuItem key={index} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
