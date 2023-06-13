# Asteroids

## About

This is a relatively standard version of the classic Asteroids game implemented in vanilla JavaScript with no runtime dependencies.

## Development

1. Checkout the repository.
2. Run `npm install` to install `esbuild` (used to bundle the game file and run the development server).
3. Run using `npm start`.
4. Open `http://localhost:8000`
5. You can now modify the game while it is running. It uses a custom HMR (hot-module reloading) system that allows any game feature (in any file in `src` folder) to be modified while the game is running, without losing the game state.
