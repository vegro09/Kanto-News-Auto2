# Kanto Flow Visualizer

Act as an expert Frontend Architect and UI/UX Designer. Build a React-based single-page application for an AI Automation Flow Visualizer. 

### 1. DESIGN SYSTEM (STRICT KANTO EMPIRE CONSTITUTION)

You MUST strictly adhere to the following design rules:

- **Colors:** Primary background MUST be solid Kanto Black (#000000). Primary accents, text, and nodes MUST use Kanto Cream (#F5F5DC). Structural dividers are 1px solid (#333333).

- **Typography:** The main logo must be 'Kanto Terminal' (or 'Kanto Automator') using a Serif Italic font (e.g., Playfair Display Italic). General UI body text must use 'Inter' for English and 'Tajawal' for Arabic.

- **UI Archetype:** "Dynamic Flat UI". Use exactly 8px border radius for all cards, nodes, and inputs.

- **ABSOLUTE PROHIBITION:** NO drop shadows, NO glassmorphism, NO 3D effects, NO gradients, NO glowing filters. Everything must be purely flat. 

### 2. STATE MANAGEMENT & ARCHITECTURE

- Use React Context or Zustand to manage a global state. 

- The state must hold: an array of `searchUrls`, an `apiKey` string, a `promptInstructions` string, and a `scheduledTime` string.

- The UI has two main views: 'Dashboard View' (Main) and 'Settings View'. Toggle between them using a minimal gear icon in the top right corner.

### 3. DASHBOARD VIEW (MAIN PAGE)

- This is a READ-ONLY visualizer.

- **Header:** Top-left shows the Kanto logo in Serif Italic Kanto Cream. Top-right shows the settings gear icon.

- **Canvas:** The center of the screen uses a node-based visualizer (you can use 'reactflow' or build a custom SVG-based node tree).

- **Node Flow Logic:** 

  1. Root Node: "Timer Node" (displays the `scheduledTime` from state).

  2. Child Nodes: "Search Nodes". Map over the `searchUrls` state and render one node per URL. If a URL is added in settings, a new node MUST dynamically appear here.

  3. Processing Node: "AI Engine Node" (connected to all Search Nodes).

  4. Output Node: "Email Delivery Node".

- **Node Styling:** Solid Kanto Black fill, 1px Kanto Cream border, 8px radius, Kanto Cream text. Connections between nodes must be smooth Bezier curves in Kanto Cream.

### 4. SETTINGS VIEW

- A clean, minimal form page with expansive negative space.

- Use 1px hairline separators between sections.

- **Components:**

  1. A "Sign in with Google" button for OAuth email connection.

  2. Time Picker input for scheduling.

  3. Password input field for the API Key.

  4. Textarea for "AI Instructions / Prompt".

  5. A dynamic list input for URL Sources. Include an "Add Source" button. When a user adds or deletes a URL here, it updates the global state (which instantly updates the Dashboard nodes).

- NO complex styling, keep it technical, quiet, and hyper-minimalist.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b8347173-3207-499a-aad3-6c17cb0a1458).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
