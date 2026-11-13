import { compressImage, type CompressionSettings } from "./image-compression";

self.onmessage = async (event: MessageEvent<{ file: Blob; settings: CompressionSettings }>) => {
  try {
    const result = await compressImage(event.data.file, event.data.settings, message => self.postMessage({ progress: message }));
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "Compression failed. Try a smaller image." }); }
};
