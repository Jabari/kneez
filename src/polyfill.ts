// src/polyfills.ts

// 1) Web Streams (ReadableStream, TransformStream, WritableStream)
import {
    ReadableStream,
    TransformStream,
    WritableStream,
  } from 'web-streams-polyfill/ponyfill/es2018';
  
  // Attach to globalThis so libraries like undici / openai can see them
  (globalThis as any).ReadableStream = ReadableStream;
  (globalThis as any).TransformStream = TransformStream;
  (globalThis as any).WritableStream = WritableStream;
  
  // 2) Fetch + related APIs from undici
  import fetch, {
    Headers,
    Request,
    Response,
    FormData,
    File,
    Blob,
  } from 'undici';
  
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
  (globalThis as any).FormData = FormData;
  (globalThis as any).File = File;
  (globalThis as any).Blob = Blob;
  
  // Debug: confirm polyfills actually ran
  console.log('[polyfills] initialized', {
    hasReadableStream: typeof (globalThis as any).ReadableStream !== 'undefined',
    hasFetch: typeof (globalThis as any).fetch !== 'undefined',
  });
  