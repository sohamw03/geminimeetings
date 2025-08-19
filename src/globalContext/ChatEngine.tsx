import SimplePeer from "simple-peer";

export type Message = {
  type: "text" | "file";
  content: string;
  sender: "me" | "peer";
  fileName?: string;
  size?: number; // Add file size info
};

export class ChatEngine {
  private MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB limit
  private MAX_CHUNK_SIZE = this.getOptimalChunkSize();
  private MAX_CONCURRENT_CHUNKS = this.getOptimalConcurrentChunks(); // restore limited concurrency for speed
  private CHUNK_DELAY = 0; // no artificial delay
  private MAX_RETRIES = 5;
  private CHUNK_TIMEOUT = 15000; // Allow slower devices / networks
  private BACKPRESSURE_THRESHOLD = 1 * 1024 * 1024; // 1MB bufferedAmount
  private BACKPRESSURE_POLL_INTERVAL = 20; // ms

  /**
   * Track in-progress incoming transfers
   */
  private transfersRef: Record<
    string,
    {
      chunks: (ArrayBuffer | null)[];
      total: number;
      received: Set<number>;
      fileName: string;
      size?: number;
      startedAt: number;
    }
  > = {};

  /**
   * Map of pending acknowledgements (index -> resolver)
   */
  private pendingAcks: Map<string, (ok: boolean) => void> = new Map();

  constructor(private peer: SimplePeer.Instance | undefined, private setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {}

  private getOptimalChunkSize(): number {
    // Larger chunks improve throughput; keep mobile somewhat smaller
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 64 * 1024; // 24KB mobile
    }
    return 64 * 1024; // 64KB desktop
  }

  private getOptimalConcurrentChunks(): number {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 4; // mobile
    }
    return 4; // desktop
  }

  private concatenateArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach((buffer) => {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    return result.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000; // 32KB substring blocks to avoid call stack limits
    for (let i = 0; i < bytes.length; i += chunk) {
      const slice = bytes.subarray(i, i + chunk);
      let segment = "";
      for (let j = 0; j < slice.length; j++) segment += String.fromCharCode(slice[j]);
      binary += segment;
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
    return bytes.buffer;
  }

  private async respectBackpressure() {
    const channel: any = (this.peer as any)?._channel;
    if (!channel) return;
    while (channel.bufferedAmount > this.BACKPRESSURE_THRESHOLD) {
      await new Promise((r) => setTimeout(r, this.BACKPRESSURE_POLL_INTERVAL));
    }
  }

  private async sendJson(obj: any) {
    await this.respectBackpressure();
    this.peer?.send(JSON.stringify(obj));
  }

  private async sendChunk(peer: SimplePeer.Instance, fileId: string, chunk: ArrayBuffer, index: number, total: number, fileName: string, retries = 0): Promise<void> {
    const key = `${fileId}:${index}`;
    try {
      const payload = {
        type: "file-chunk",
        fileId,
        index,
        total,
        fileName,
        // Encode chunk as base64 once
        chunk: this.arrayBufferToBase64(chunk),
      };

      // Promise waiting for ack
      const ackPromise = new Promise<void>((resolve, reject) => {
        this.pendingAcks.set(key, (ok: boolean) => {
          if (ok) resolve();
          else reject(new Error("Ack failed"));
        });
        setTimeout(() => {
          if (this.pendingAcks.has(key)) {
            this.pendingAcks.delete(key);
            reject(new Error("Chunk timeout"));
          }
        }, this.CHUNK_TIMEOUT);
      });

      await this.sendJson(payload);
      await ackPromise;
    } catch (err) {
      if (retries < this.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (retries + 1)));
        return this.sendChunk(peer, fileId, chunk, index, total, fileName, retries + 1);
      }
      throw err;
    } finally {
      this.pendingAcks.delete(key);
    }
  }

  async sendFile(file: File, onProgress?: (progress: number) => void) {
    if (!this.peer) throw new Error("No peer connection");
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const fileId = Math.random().toString(36).substring(7);
    const chunkSize = this.MAX_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let sentChunks = 0;
    try {
      // Pipeline limited number of concurrent chunk sends
      let offset = 0;
      let index = 0;
      const inFlight = new Set<Promise<void>>();

      while (offset < file.size || inFlight.size > 0) {
        while (offset < file.size && inFlight.size < this.MAX_CONCURRENT_CHUNKS) {
          const thisIndex = index;
            const chunkPromise = file
              .slice(offset, offset + chunkSize)
              .arrayBuffer()
              .then((buf) => this.sendChunk(this.peer!, fileId, buf, thisIndex, totalChunks, file.name))
              .then(() => {
                sentChunks++;
                onProgress?.(Math.round((sentChunks / totalChunks) * 100));
              })
              .finally(() => inFlight.delete(chunkPromise));
          inFlight.add(chunkPromise);
          offset += chunkSize;
          index++;
        }
        if (inFlight.size > 0) {
          await Promise.race(inFlight);
        }
      }

      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        this.setMessages((prev) => [
          ...prev,
          {
            type: "file",
            content: e.target?.result as string,
            fileName: file.name,
            sender: "me",
            size: file.size,
          },
        ]);
      };
      fileReader.readAsDataURL(file);
    } catch (err: any) {
      throw new Error(`Failed to send file: ${err.message}`);
    }
  }

  sendMessage(message: string) {
    this.setMessages((prev) => [...prev, { type: "text", content: message, sender: "me" }]);
    this.peer?.send(JSON.stringify({ type: "chat", content: message }));
  }

  handleIncomingData(data: string) {
    const message = JSON.parse(data);

    if (message.type === "file-chunk") {
      this.handleFileChunk(message);
    } else if (message.type === "chunk-ack") {
      const key = `${message.fileId}:${message.index}`;
      const resolver = this.pendingAcks.get(key);
      resolver?.(true);
    } else if (message.type === "chat") {
      this.setMessages((prev) => [...prev, { ...message, sender: "peer" }]);
      window.postMessage("showChat", window.location.origin);
    }
  }

  private handleFileChunk(message: any) {
    const { fileId, chunk, index, total, fileName } = message;

    if (!this.transfersRef[fileId]) {
      this.transfersRef[fileId] = {
        chunks: Array(total).fill(null),
        total,
        received: new Set(),
        fileName,
        startedAt: performance.now(),
      };
    }

    const transfer = this.transfersRef[fileId];

    // Ignore if already received (duplicate resend)
    if (transfer.received.has(index)) {
      this.sendJson({ type: "chunk-ack", fileId, index });
      return;
    }

    // Decode & store
    try {
      const buffer = this.base64ToArrayBuffer(chunk);
      transfer.chunks[index] = buffer;
      transfer.received.add(index);
    } catch (e) {
      // Failed to decode; ask for resend by not acking
      console.warn("Failed to decode chunk", index, e);
      return;
    }

    // Ack
    this.sendJson({ type: "chunk-ack", fileId, index });

    if (transfer.received.size === transfer.total) {
      this.completeFileTransfer(fileId, fileName);
      const duration = performance.now() - transfer.startedAt;
      console.log(`File ${fileName} received: ${transfer.total} chunks in ${(duration / 1000).toFixed(2)}s`);
    }
  }

  private completeFileTransfer(fileId: string, fileName: string) {
    const transfer = this.transfersRef[fileId];
    const totalSize = transfer.chunks.reduce((acc, chunk) => acc + (chunk?.byteLength || 0), 0);

    // For large files, create URL instead of base64
    if (totalSize > 5 * 1024 * 1024) {
      // 5MB threshold
      const validChunks = transfer.chunks.filter((chunk): chunk is ArrayBuffer => chunk !== null);
      const blob = new Blob(validChunks);
      const url = URL.createObjectURL(blob);

      this.setMessages((prev) => [
        ...prev,
        {
          type: "file",
          content: url,
          fileName,
          sender: "peer",
          size: totalSize,
        },
      ]);

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000); // Cleanup after 1 minute
    } else {
      // Small files can still use base64
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setMessages((prev) => [
          ...prev,
          {
            type: "file",
            content: e.target?.result as string,
            fileName,
            sender: "peer",
            size: totalSize,
          },
        ]);
      };
      reader.readAsDataURL(new Blob(transfer.chunks.filter((chunk): chunk is ArrayBuffer => chunk !== null)));
    }

    // Clean up transfer data
    delete this.transfersRef[fileId];
    window.postMessage("showChat", window.location.origin);
  }

  // Add method to clean up resources
  public cleanup() {
    // Clean up any ongoing transfers
    Object.keys(this.transfersRef).forEach((fileId) => {
      delete this.transfersRef[fileId];
    });

    // Clean up any blob URLs
    this.setMessages((prev) => {
      prev.forEach((msg) => {
        if (msg.type === "file" && msg.content.startsWith("blob:")) {
          URL.revokeObjectURL(msg.content);
        }
      });
      return prev;
    });
  this.pendingAcks.clear();
  }
}
