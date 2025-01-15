"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import * as d3 from "d3"; // We'll use d3 for extent, as well as contourDensity & geoPath

// We assume you're storing your JSON in public/data/terms.json
async function fetchTerms() {
  const res = await fetch("/data/terms.json");
  if (!res.ok) {
    throw new Error("Failed to fetch terms.json");
  }
  return res.json();
}

// Helper that determines which groups to show based on a numeric zoom level.
function getVisibleGroups(zoom: number): number[] {
  if (zoom < 1.5) {
    return [1, 2];
  } else if (zoom < 2.5) {
    return [1, 2, 3];
  } else if (zoom < 3.5) {
    return [2, 3, 4];
  } else if (zoom < 4.5) {
    return [4, 5];
  } else {
    return [5];
  }
}

interface TermData {
  term: string;
  x: number;
  y: number;
  group: number;
  score: number;
}

export default function TermsMapPage() {
  const [terms, setTerms] = useState<TermData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // State to store the computed contours
  const [contours, setContours] = useState<d3.ContourMultiPolygon[]>();

  // We also need to know how large to make our container
  const [chartSize, setChartSize] = useState({ width: 2000, height: 2000 });

  useEffect(() => {
    fetchTerms().then((data: TermData[]) => {
      if (!data || data.length === 0) {
        setTerms([]);
        return;
      }

      // 1. Determine the bounding box (min/max) of x & y across all points
      const [minX, maxX] = d3.extent(data, (d) => d.x) as [number, number];
      const [minY, maxY] = d3.extent(data, (d) => d.y) as [number, number];

      // 2. Optionally define some margin around the data
      const margin = 100;

      // 3. Compute the needed width and height
      const width = maxX - minX + margin * 2;
      const height = maxY - minY + margin * 2;

      // 4. Shift all data points so they fall within [0, width] × [0, height]
      //    i.e. so the smallest x = margin, smallest y = margin
      const shiftedData = data.map((d) => ({
        ...d,
        x: d.x - minX + margin,
        y: d.y - minY + margin,
      }));

      // Update terms and chart size
      setTerms(shiftedData);
      setChartSize({ width, height });

      // 5. Prepare the points array for d3-contour
      const points = shiftedData.map((d) => [d.x, d.y]);

      // 6. Compute the contour lines using your new bounding box
      const densityContours = d3
        .contourDensity()
        .x((p) => p[0])
        .y((p) => p[1])
        .size([width, height])
        .bandwidth(20) // tweak as needed
        .thresholds(5)(points);

      setContours(densityContours);
    });
  }, []);

  // This function is called whenever zoom/pan changes
  const handleTransform = useCallback((scale: number) => {
    setZoomLevel(scale);
  }, []);

  // Determine which groups to display
  const visibleGroups = getVisibleGroups(zoomLevel);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "absolute",
        margin: 0,
        padding: 0,
        backgroundColor: "#333", // Gray background
        color: "#fff", // White text
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <TransformWrapper
        initialScale={0.5}
        minScale={0.3}
        maxScale={10}
        limitToBounds={false}
        centerContent={true}
        onTransformed={(ref) => handleTransform(ref.state.scale)}
        wheel={{ step: 2 }}
        doubleClick={{ disabled: false, step: 0.8 }}
      >
        <TransformComponent>
          <div
            style={{
              // Use the dynamic width and height
              width: chartSize.width,
              height: chartSize.height,
              position: "relative",
            }}
          >
            {/* Contour lines behind the text labels */}
            <svg
              width={chartSize.width}
              height={chartSize.height}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            >
              {contours?.map((c, i) => (
                <path
                  key={i}
                  // geoPath() converts each contour (MultiPolygon) to an SVG path
                  d={d3.geoPath()(c) || ""}
                  fill="none"
                  stroke="white"
                  strokeWidth={0.5}
                  strokeOpacity={0.5}
                />
              ))}
            </svg>

            {/* Now place the text labels above the contours */}
            {terms.map((termData, index) => {
              const { term, x, y, group } = termData;
              const isVisible = visibleGroups.includes(group);

              // Slightly adjust font size for higher groups
              const baseFontSize = 20;
              const fontSizeIncrement = 3.1;
              const dynamicFontSize =
                baseFontSize - (group + 1) * fontSizeIncrement;

              return (
                <div
                  key={`${term}-${index}`}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                    opacity: isVisible ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: isVisible ? "auto" : "none",
                    background: "none",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: dynamicFontSize,
                    whiteSpace: "nowrap",
                    fontWeight: "bold",
                  }}
                >
                  {term}
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
