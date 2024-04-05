import { useEffect, useRef } from "react";

export default function useSocket() {
  const socketCreated = useRef(false);
  useEffect(() => {
    if (!socketCreated.current) {
      const socketInitializer = async () => {
        await fetch("http://127.0.0.1:8000/api/socket");
      };
      try {
        socketInitializer();
        socketCreated.current = true;
      } catch (error) {
        console.log(error);
      }
    }
  }, []);
}
