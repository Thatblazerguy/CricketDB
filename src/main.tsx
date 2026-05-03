import React from "react";
import ReactDOM from "react-dom/client";
import { AuroraBackground } from "./components/ui/aurora-background";
import { ThemeToggle } from "./components/ThemeToggle";
import "./index.css";

// Mount the background
const bgRoot = document.getElementById("aurora-bg");
if (bgRoot) {
  ReactDOM.createRoot(bgRoot).render(
    <React.StrictMode>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <AuroraBackground className="h-full w-full" showRadialGradient={true}>
          {/* No children, just the background */}
          <div />
        </AuroraBackground>
      </div>
    </React.StrictMode>
  );
}

// Mount the theme toggle separately so it's always accessible
const toggleContainer = document.createElement("div");
toggleContainer.id = "theme-toggle-root";
document.body.appendChild(toggleContainer);

ReactDOM.createRoot(toggleContainer).render(
  <React.StrictMode>
    <ThemeToggle />
  </React.StrictMode>
);
