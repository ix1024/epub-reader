import { useEffect, useState } from "react";

export const useWindow = (element?: HTMLElement | null) => {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const onResize = () => {
    const { clientWidth, clientHeight } = element || document.documentElement;
    setWidth(clientWidth);
    setHeight(clientHeight);
  };
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return { width, height };
};
