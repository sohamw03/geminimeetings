import SimplePeer from "simple-peer";

export type Message = {
  type: "text" | "file";
  content: string;
  sender: "me" | "peer";
  fileName?: string;
  size?: number; // Add file size info
};

export class ChatEngine {
  private MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit
  private MAX_CHUNK_SIZE = this.getOptimalChunkSize();
  private MAX_CONCURRENT_CHUNKS = this.getOptimalConcurrentChunks();
  private CHUNK_DELAY = 50;
  private MAX_RETRIES = 3;
  private CHUNK_TIMEOUT = 10000;

  private transfersRef: {
    [fileId: string]: {
      chunks: (ArrayBuffer | null)[];
      pieces: { [index: number]: (ArrayBuffer | null)[] };
      total: number;
      received: Set<number>;
      timeouts: { [index: number]: NodeJS.Timeout };
    };
  } = {};

  constructor(private peer: SimplePeer.Instance | undefined, private setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {}

  private getOptimalChunkSize(): number {
    // Smaller chunks for mobile devices
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 8 * 1024; // 8KB for mobile
    }
    return 16 * 1024; // 16KB for desktop
  }

  private getOptimalConcurrentChunks(): number {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 2; // Fewer concurrent chunks for mobile
    }
    return 3; // More for desktop
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

  private async sendChunk(peer: SimplePeer.Instance, fileId: string, chunk: ArrayBuffer, index: number, total: number, fileName: string, retries = 0): Promise<void> {
    try {
      const maxSize = 16 * 1024;
      const uint8Array = new Uint8Array(chunk);
      const numPieces = Math.ceil(uint8Array.length / maxSize);

      for (let i = 0; i < numPieces; i++) {
        const start = i * maxSize;
        const end = Math.min(start + maxSize, uint8Array.length);
        const piece = uint8Array.slice(start, end);

        const chunkData = {
          type: "file-chunk",
          fileId,
          chunk: btoa(String.fromCharCode.apply(null, Array.from(piece))),
          index,
          total,
          fileName,
          pieceIndex: i,
          totalPieces: numPieces,
        };

        peer.send(JSON.stringify(chunkData));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const handler = (data: any) => {
            const message = JSON.parse(data.toString());
            if (message.type === "chunk-ack" && message.fileId === fileId && message.index === index) {
              peer.off("data", handler);
              resolve();
            }
          };
          peer.on("data", handler);
        }),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Chunk timeout")), this.CHUNK_TIMEOUT)),
      ]);
    } catch (err) {
      if (retries < this.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (retries + 1)));
        return this.sendChunk(peer, fileId, chunk, index, total, fileName, retries + 1);
      }
      throw err;
    }
  }

  async sendFile(file: File, onProgress?: (progress: number) => void) {
    if (!this.peer) throw new Error("No peer connection");
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const fileId = Math.random().toString(36).substring(7);
    const chunks: ArrayBuffer[] = [];
    const chunkSize = this.MAX_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < file.size; i += chunkSize) {
      const chunk = await file.slice(i, i + chunkSize).arrayBuffer();
      chunks.push(chunk);
    }

    let sentChunks = 0;
    try {
      for (let i = 0; i < chunks.length; i += this.MAX_CONCURRENT_CHUNKS) {
        const batch = chunks.slice(i, i + this.MAX_CONCURRENT_CHUNKS);
        await Promise.all(
          batch.map(async (chunk, index) => {
            const chunkIndex = i + index;
            await this.sendChunk(this.peer!, fileId, chunk, chunkIndex, totalChunks, file.name);
            sentChunks++;
            onProgress?.(Math.round((sentChunks / totalChunks) * 100));
          })
        );
        await new Promise((resolve) => setTimeout(resolve, this.CHUNK_DELAY));
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
    } else if (message.type === "chat") {
      this.setMessages((prev) => [...prev, { ...message, sender: "peer" }]);
      window.postMessage("showChat", window.location.origin);
    }
  }

  private handleFileChunk(message: any) {
    const { fileId, chunk, index, total, fileName, pieceIndex, totalPieces } = message;

    if (!this.transfersRef[fileId]) {
      this.transfersRef[fileId] = {
        chunks: Array(total).fill(null),
        pieces: {},
        total,
        received: new Set(),
        timeouts: {},
      };
    }

    const transfer = this.transfersRef[fileId];

    if (!transfer.pieces[index]) {
      transfer.pieces[index] = Array(totalPieces).fill(null);
    }

    const chunkBuffer = Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0)).buffer;
    transfer.pieces[index][pieceIndex] = chunkBuffer;

    if (!transfer.pieces[index].includes(null)) {
      const validPieces = transfer.pieces[index].filter((piece): piece is ArrayBuffer => piece !== null);
      const completeChunk = this.concatenateArrayBuffers(validPieces);
      transfer.chunks[index] = completeChunk;
      transfer.received.add(index);
      delete transfer.pieces[index];

      this.peer?.send(
        JSON.stringify({
          type: "chunk-ack",
          fileId,
          index,
        })
      );

      if (transfer.received.size === total) {
        this.completeFileTransfer(fileId, fileName);
      }
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
      const transfer = this.transfersRef[fileId];
      Object.values(transfer.timeouts).forEach((timeout) => clearTimeout(timeout));
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
  }
}
