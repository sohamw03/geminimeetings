"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Home.module.css";

export default function Home() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  const joinRoom = () => {
    router.push(`/room/${roomName || Math.random().toString(36).slice(2)}`);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Lets join a room!</h1>
        <input onChange={(e) => setRoomName(e.target.value)} value={roomName} className={styles["room-name"]} />
        <button onClick={joinRoom} type="button" className={styles["join-room"]}>
          Join Room
        </button>
      </main>
    </div>
  );
}
