import { useEffect, useRef } from "react";
// import "./App.css";
// import css from "./App.module.less";
import run from "./canvas1";

function App() {
  const ref = useRef(null);
  useEffect(() => {
    const cale = () => {
      run(ref);
    };
    window.addEventListener("resize", cale);
    cale();
    return () => {
      window.removeEventListener("resize", cale);
    };
  }, []);
  return (
    <>
      <canvas ref={ref}></canvas>
    </>
  );
}

export default App;
