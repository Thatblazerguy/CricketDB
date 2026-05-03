import React from "react";
import { AuroraBackgroundDemo } from "./components/demo";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  return (
    <div className="relative">
      <ThemeToggle />
      <AuroraBackgroundDemo />
    </div>
  );
}

export default App;
