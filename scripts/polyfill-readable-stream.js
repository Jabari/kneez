// Ensure ReadableStream exists for tools (e.g., Expo CLI) on Node versions that lack it.
try {
  if (typeof globalThis.ReadableStream === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ReadableStream } = require('stream/web');
    globalThis.ReadableStream = ReadableStream;
  }
} catch (error) {
  // Swallow errors to avoid blocking startup; callers can surface more detail if needed.
  // eslint-disable-next-line no-console
  console.warn('ReadableStream polyfill failed; Expo CLI may not start:', error);
}
