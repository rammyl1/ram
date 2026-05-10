import { useState } from "react";
import LandingScreen from "./components/LandingScreen";
import PixelGame from "./components/PixelGame";

type Screen = "landing" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [transitioning, setTransitioning] = useState(false);

  const enterGame = () => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen("game");
      setTransitioning(false);
    }, 400);
  };

  const exitGame = () => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen("landing");
      setTransitioning(false);
    }, 400);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <div
        className="w-full h-full transition-opacity duration-400"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {screen === "landing" ? (
          <LandingScreen onExplore={enterGame} />
        ) : (
          <PixelGame onExit={exitGame} />
        )}
      </div>
    </div>
  );
}
