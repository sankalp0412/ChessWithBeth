import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Auth from "./pages/Auth";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}

export default App;
