# Kneez App

This repository contains the Kneez mobile front-end (Expo + React Native) and a small local server used to power intake flows. Use this document to understand the layout, required services, and how to run development and test tasks.

## Project structure
- `app/` – Expo Router entry points that map URLs/routes to screens (for example `intake-chat.tsx` renders the intake chat UI).
- `assets/` – Shared fonts, images, and videos bundled with the app.
- `components/` – Reusable UI primitives (Themed wrappers, buttons, inputs) plus supporting hooks for platform-specific behavior.
- `constants/` – App-wide design tokens such as color definitions.
- `docs/` – Developer-facing reference notes (e.g., UI library setup instructions).
- `src/` – Core application code:
  - `api/` – Client functions that talk to the local NLU/education services.
  - `contexts/` – React context providers.
  - `logic/` – Pure helper logic for intake/question flow.
  - `screens/` – Screen-level React components wired into the router.
  - `shared/` – Types shared between the client and server.
  - `server.ts` – The local Express API that proxies NLU/education requests to model providers.
- `tests/` – Lightweight Node test harness (TypeScript) plus mocks for Expo dependencies.
- `types/` – Global type declarations used by the app runtime.
- `kneez-app/` – Early scaffolding for a future assessment-focused UI (placeholder routes and types kept separate from the main app).

## Running the app locally
1. Install dependencies: `npm install`.
2. Start the local API server (defaults to `http://localhost:4000`): `npm run server:dev`.
   - Set `OPENAI_API_KEY` to enable intent and symptom extraction.
   - Set `GEMINI_API_KEY` to enable general education replies; without it, those routes will be disabled.
3. Point the client at the local server by ensuring `EXPO_PUBLIC_NLU_BASE_URL=http://localhost:4000` (or set `expo.extra.nluBaseUrl` in `app.json`).
4. Launch the Expo app: `npm start` (then pick iOS, Android, or Web in the Expo CLI).

## Tests
Run the TypeScript test harness with `npm test`. The suite uses mocked `fetch` calls so no network or API keys are required.

Current coverage (see `tests/run-tests.ts`):
- `parseSymptomMessage` sends the user message and prior extracted entities to `/nlu/symptom-entities` and returns the mocked entity payload.
- `getNextIntakeQuestion` walks through the priority order of missing fields, returning the correct follow-up prompts and `null` once intake is complete.
- `classifyIntent` posts the initial user message to `/nlu/intent` and yields the intent classification JSON (`general_education` in the test fixture).
- `requestEducationalReply` posts a message plus prior chat turns to `/chat/education` and returns the mocked educational reply text.
