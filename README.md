# Route Variety Helper - Frontend

This project is a POC that never got uploaded anywhere and I just did for fun.

This app is designed to help the user vary their regular routes due to the mental health benefits that this provides.

This is a React and TypeScript frontend for the Route Variety Helper application.

## Prerequisites

- Node.js (v16+) and npm
- A running instance of the [Route Variety Helper Backend](<https://github.com/jarethmcc/route-variety-helper-backend>) on `http://localhost:5000`.
- A Google Maps API key with the "Maps JavaScript API" and "Places API" enabled.

## Setup

### 1. Install Dependencies

Navigate to this `frontend` directory and run:

```bash
npm install
```

### 2. Environment Variables

Create a `.env` (or `.env.local`) file in the root of this project with your Google Maps API key:

```dotenv
REACT_APP_GOOGLE_MAPS_JS_API_KEY=YOUR_GOOGLE_MAPS_JS_API_KEY
```

Make sure you restart the dev server after adding or changing env vars.

### 3. Running the App

Start the development server:

```bash
npm start
```

Then open http://localhost:3000 in your browser.

## 4. Available Scripts

In the project directory, you can run:

- `npm start`  
  Runs the app in development mode with hot-reload.

- `npm run build`  
  Builds the app for production to the `build` folder.

- `npm test`  
  Launches the test runner (if you add tests).

- `npm run lint`  
  Runs your linter (configure ESLint/Prettier as needed).

## 5. Project Structure

```
src/
├── components/     # React components (HomePage, ActivitiesPage, MapPage, etc.)
├── services/       # API clients and helper functions
├── types.ts        # Shared TypeScript interfaces/types
├── App.tsx         # Main application & routing
├── index.tsx       # Entry point
└── App.css         # Global styles
```

## 6. Contributing

1. Fork the repo  
2. Create a feature branch (`git checkout -b feature/XYZ`)  
3. Commit your changes (`git commit -m "feat: add XYZ"`)  
4. Push to branch (`git push origin feature/XYZ`)  
5. Open a Pull Request

Please follow conventional commits and include meaningful descriptions.

## 7. License

This project is licensed under the MIT License. See the [LICENSE](../route-variety-helper-backend/LICENSE) file for details.