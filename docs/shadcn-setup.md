# Shadcn UI bootstrap for Kneez

This project does not currently have network access, so the Shadcn UI and TailwindCSS packages cannot be installed automatically. The files below establish a place to add Shadcn-style components and outline the steps to finish the installation when connectivity is available.

## Components
- `components/ui/button.tsx`: A Shadcn-inspired button component that mirrors the variant and size API while using React Native styles so it works without TailwindCSS.

## Installation checklist (run when you have internet)
1. Install the styling toolchain:
   ```bash
   npm install nativewind tailwindcss tailwind-merge class-variance-authority
   ```
2. Generate a `tailwind.config.js` that includes the NativeWind preset and scans `app/**/*.{ts,tsx}` and `components/**/*.{ts,tsx}` for class names.
3. Add a `postcss.config.js` with `tailwindcss`, `nativewind/postcss`, and `autoprefixer` plugins.
4. Create `global.css` with Tailwind base, components, and utilities directives. Import it in `app/_layout.tsx` (for native) and link it from `app/+html.tsx` (for web).
5. Update `babel.config.js` to include the `nativewind/babel` plugin alongside `expo-router/babel`.
6. Use the `shadcn` CLI (or `react-native-shadcn`) to generate additional primitives as needed, pointing to `components` and `@/lib/utils` aliases.

Once connectivity returns, completing these steps will bring the project fully in line with the standard Shadcn UI setup.
