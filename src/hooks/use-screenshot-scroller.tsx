"use client";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

const useScreenshotScroller = (colorScheme: string | undefined) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const captureAndStitchScreenshots = async () => {
    if (!containerRef.current) return;

    setIsCapturing(true);
    const container = containerRef.current;
    const totalHeight = container.scrollHeight;
    const visibleHeight = container.clientHeight;
    const totalScreens = Math.ceil(totalHeight / visibleHeight);
    const themeBgColor = colorScheme === "dark" ? "#000" : "#fff";
    let scrollY = 0;
    const images: HTMLCanvasElement[] = [];
    for (let i = 0; i < totalScreens; i++) {
      container.scrollTop = scrollY;
      await new Promise((resolve) => setTimeout(resolve, 300)); // Allow time for rendering
      // If it's the last page and less than full height, crop it

      const canvas = await html2canvas(container, {
        scrollX: 0,
        scrollY: -scrollY,
        useCORS: true,
        backgroundColor: themeBgColor,
        scale: 2, // High-resolution capture
        onclone: (document) => {
          document.querySelectorAll("code").forEach((el) => {
            el.style.padding = "0";
          });
        },
        logging: false,
      });
      images.push(canvas);
      scrollY += visibleHeight;
    }

    // Create final stitched canvas
    const stitchedCanvas = document.createElement("canvas");
    const ctx = stitchedCanvas.getContext("2d");

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    stitchedCanvas.width = images[0].width;
    stitchedCanvas.height = images.reduce((sum, img) => sum + img.height, 0);

    let yOffset = 0;
    images.forEach((img) => {
      ctx.drawImage(img, 0, yOffset);
      yOffset += img.height;
    });

    // Convert to PNG
    const finalImage = stitchedCanvas.toDataURL("image/png");
    saveAsPNG(finalImage);

    setIsCapturing(false);
  };

  // Function to save as PNG
  const saveAsPNG = (imageData: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = "stitched_screenshot.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    containerRef,
    isCapturing,
    captureAndStitchScreenshots,
  };
};

export default useScreenshotScroller;
