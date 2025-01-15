"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import * as d3 from "d3";
import { Settings, Map, Plus, ChevronRight } from "lucide-react";
import Sidebar from "./sidebar";

// Represents the data structure for each term on the map.
interface TermData {
  term: string;
  x: number;
  y: number;
  group: number;
  score?: number;
}

// Retrieves an initial set of words from the JSON file.
async function fetchDefaultTerms() {
  const res = await fetch("/data/terms.json");
  if (!res.ok) {
    throw new Error("Could not load default terms.");
  }
  return res.json() as Promise<TermData[]>;
}

// Contacts a FastAPI backend to process text and return embeddings.
async function fetchFromFastApi(inputText: string): Promise<TermData[]> {
  const url = "http://localhost:8000/api/embeddings";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: inputText }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Request failed: ${err}`);
  }
  return res.json();
}

// Determines which "group" levels to show based on zoom.
function getVisibleGroups(zoom: number): number[] {
  if (zoom < 1.5) {
    return [1, 2];
  } else if (zoom < 2.5) {
    return [1, 2, 3];
  } else if (zoom < 3.5) {
    return [2, 3, 4];
  } else if (zoom < 4.5) {
    return [3, 4, 5];
  } else {
    return [4, 5];
  }
}

export default function TermsMapPage() {
  // Stores all terms (both default and newly added).
  const [defaultTerms, setDefaultTerms] = useState<TermData[]>([]);
  const [terms, setTerms] = useState<TermData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Used for generating density lines and heatmaps.
  const [contours, setContours] = useState<d3.ContourMultiPolygon[]>();
  const [scoreContours, setScoreContours] = useState<d3.ContourMultiPolygon[]>();
  const [chartSize, setChartSize] = useState({ width: 2000, height: 2000 });

  // Sidebar and other UI toggles.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDensityLines, setShowDensityLines] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showTextLabels, setShowTextLabels] = useState(true);

  // Collapsible sections in the sidebar.
  const [openParams, setOpenParams] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  // Text fields for updating or adding words.
  const [mainInputText, setMainInputText] = useState("");
  const [addInputText, setAddInputText] = useState("");
  const [currentMainText, setCurrentMainText] = useState("");

  // Numeric sliders for controlling density lines and heatmaps.
  const [heatmapThreshold, setHeatmapThreshold] = useState(8);
  const [densityLinesThreshold, setDensityLinesThreshold] = useState(5);
  const [densityLinesBandwidth, setDensityLinesBandwidth] = useState(23);
  const [heatmapBandwidth, setHeatmapBandwidth] = useState(50);

  // Controls for text label sizing.
  const [textSize, setTextSize] = useState(16);
  const [textSizeFactor, setTextSizeFactor] = useState(1);

  // Debouncing for Performance Optimization
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Adjusts contours and chart size after receiving new data.
  const updateContoursAndChartSize = useCallback(
    (allTerms: TermData[]) => {
      if (!allTerms || allTerms.length === 0) {
        setTerms([]);
        setContours(undefined);
        setScoreContours(undefined);
        return;
      }

      // Calculate bounding box to determine chart dimensions.
      const xs = allTerms.map((d) => d.x);
      const ys = allTerms.map((d) => d.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const margin = 100;
      const width = maxX - minX + margin * 2;
      const height = maxY - minY + margin * 2;

      // Move everything so that the bounding box starts at (0,0).
      const shifted = allTerms.map((d) => ({
        ...d,
        x: d.x - minX + margin,
        y: d.y - minY + margin,
      }));

      setTerms(shifted);
      setChartSize({ width, height });

      // Unweighted density lines
      const points = shifted.map((d) => [d.x, d.y]);
      const density = d3
        .contourDensity()
        .x((p) => p[0])
        .y((p) => p[1])
        .size([width, height])
        .bandwidth(densityLinesBandwidth)
        .thresholds(densityLinesThreshold)(points);
      setContours(density);

      // Weighted heatmap based on "score"
      const scoredPoints = shifted
        .filter((d) => (d.score ?? 0) > 0)
        .map((d) => [d.x, d.y, d.score ?? 1]);
      if (scoredPoints.length > 0) {
        const weighted = d3
          .contourDensity()
          .x((p) => p[0])
          .y((p) => p[1])
          .weight((p) => p[2])
          .size([width, height])
          .bandwidth(heatmapBandwidth)
          .thresholds(heatmapThreshold)(scoredPoints);
        setScoreContours(weighted);
      } else {
        setScoreContours(undefined);
      }
    },
    [densityLinesBandwidth, densityLinesThreshold, heatmapBandwidth, heatmapThreshold]
  );

  // Load default terms on component mount (from the JSON file).
  useEffect(() => {
    fetchDefaultTerms()
      .then((initial) => {
        setDefaultTerms(initial);
        updateContoursAndChartSize(initial);
      })
      .catch((err) => console.error("Error loading defaults:", err));
  }, []); // Removed updateContoursAndChartSize from dependencies

  // Replaces the entire map with the user-input text.
  async function handleProcessMainText() {
    if (!mainInputText.trim()) {
      alert("Enter some text to update the map.");
      return;
    }
    try {
      const newData = await fetchFromFastApi(mainInputText.trim());
      const replaced = newData.map((d) => ({ ...d, score: 1 }));
      updateContoursAndChartSize(replaced);
      setCurrentMainText(mainInputText.trim());
    } catch (err: any) {
      console.error("Map update error:", err);
      alert(err.message);
    }
  }

  // Adds new words to the current map.
  async function handleAddToMap() {
    if (!addInputText.trim()) {
      alert("Enter some text to add.");
      return;
    }
    const newWords = addInputText.split(/\s+/);
    // Duplicate the new words to ensure visibility and higher group
    const duplicatedNewWords = newWords.flatMap((w) => [w, w]);
    const newWordsText = duplicatedNewWords.join(" ");

    try {
      if (currentMainText === "") {
        // If user hasn't replaced the map yet, add to original data
        const newEmbeddings = await fetchFromFastApi(newWordsText);
        const newEmbeddingsScored = newEmbeddings.map((d) => ({ ...d, score: 1 }));
        const merged = [
          ...defaultTerms.map((t) => ({ ...t, score: 0 })),
          ...newEmbeddingsScored,
        ];
        updateContoursAndChartSize(merged);
      } else {
        // If user already replaced the map, re-fetch combined text
        const combinedText = (currentMainText + " " + newWordsText).trim();
        const result = await fetchFromFastApi(combinedText);

        const newWordsLower = duplicatedNewWords.map((w) => w.toLowerCase());
        const newSet = new Set(newWordsLower);

        const merged: TermData[] = result.map((r) => ({
          ...r,
          score: newSet.has(r.term.toLowerCase()) ? 1 : 0,
        }));

        updateContoursAndChartSize(merged);
        setCurrentMainText(combinedText);
      }
      setAddInputText("");
    } catch (err: any) {
      console.error("Add words error:", err);
      alert(err.message);
    }
  }

  // Keeps track of the current zoom scale.
  const handleTransform = useCallback((scale: number) => {
    setZoomLevel(scale);
  }, []);

  // Color scale for the heatmap based on actual density values
  const pinkPurpleScale = useMemo(() => {
    if (!scoreContours || scoreContours.length === 0) {
      // Default scale if no data
      return d3.scaleSequential(d3.interpolateRdPu).domain([0, 1]);
    }
    const minDensity = d3.min(scoreContours, (c) => c.value) || 0;
    const maxDensity = d3.max(scoreContours, (c) => c.value) || 1;
    return d3.scaleSequential(d3.interpolateRdPu).domain([minDensity, maxDensity]);
  }, [scoreContours]);

  // Determines which term "groups" to show based on zoom.
  const visibleGroups = getVisibleGroups(zoomLevel);

  // Debounced Slider Change Handler
  const handleSliderChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
      setter(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateContoursAndChartSize(terms);
      }, 300); // 300ms debounce
    },
    [updateContoursAndChartSize, terms]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        position: "relative",
        background: "#333",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Hamburger Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: "absolute",
          top: "15px",
          left: "15px",
          zIndex: 10000,
          width: "24px",
          height: "18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        aria-label="Toggle Sidebar"
      >
        <span
          style={{
            display: "block",
            height: "2px",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "2px",
            transition: "all 0.3s ease",
            transform: isSidebarOpen
              ? "translateY(7px) rotate(45deg)"
              : "none",
          }}
        />
        <span
          style={{
            display: "block",
            height: "2px",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "2px",
            opacity: isSidebarOpen ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        />
        <span
          style={{
            display: "block",
            height: "2px",
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "2px",
            transition: "all 0.3s ease",
            transform: isSidebarOpen
              ? "translateY(-7px) rotate(-45deg)"
              : "none",
          }}
        />
      </button>

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        openParams={openParams}
        setOpenParams={setOpenParams}
        openMap={openMap}
        setOpenMap={setOpenMap}
        openAdd={openAdd}
        setOpenAdd={setOpenAdd}
        showDensityLines={showDensityLines}
        setShowDensityLines={setShowDensityLines}
        densityLinesThreshold={densityLinesThreshold}
        setDensityLinesThreshold={setDensityLinesThreshold}
        densityLinesBandwidth={densityLinesBandwidth}
        setDensityLinesBandwidth={setDensityLinesBandwidth}
        showHeatMap={showHeatMap}
        setShowHeatMap={setShowHeatMap}
        heatmapThreshold={heatmapThreshold}
        setHeatmapThreshold={setHeatmapThreshold}
        heatmapBandwidth={heatmapBandwidth}
        setHeatmapBandwidth={setHeatmapBandwidth}
        showTextLabels={showTextLabels}
        setShowTextLabels={setShowTextLabels}
        textSize={textSize}
        setTextSize={setTextSize}
        textSizeFactor={textSizeFactor}
        setTextSizeFactor={setTextSizeFactor}
        mainInputText={mainInputText}
        setMainInputText={setMainInputText}
        handleProcessMainText={handleProcessMainText}
        addInputText={addInputText}
        setAddInputText={setAddInputText}
        handleAddToMap={handleAddToMap}
        terms={terms}
        updateContoursAndChartSize={updateContoursAndChartSize}
        handleSliderChange={handleSliderChange} // Pass the debounced handler
      />

      {/* The primary interactive container for zoom/pan + drawing the map */}
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
              width: chartSize.width,
              height: chartSize.height,
              position: "relative",
            }}
          >
            {/* Unweighted density lines */}
            {showDensityLines && contours && (
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
                {contours.map((c, i) => (
                  <path
                    key={i}
                    d={d3.geoPath()(c) || ""}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={0.5}
                    strokeOpacity={0.5}
                  />
                ))}
              </svg>
            )}

            {/* Weighted heatmap */}
            {showHeatMap && scoreContours && (
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
                {scoreContours.map((c, i) => (
                  <path
                    key={i}
                    d={d3.geoPath()(c) || ""}
                    fill={pinkPurpleScale(c.value)}
                    stroke="none"
                    fillOpacity={0.4}
                  />
                ))}
              </svg>
            )}

            {/* Display text labels */}
            {showTextLabels &&
              terms.map((t, idx) => {
                const { term, x, y, group } = t;
                const isVisible = getVisibleGroups(zoomLevel).includes(group);

                // Compute text size based settings
                const baseFontSize = textSize;
                const fontSizeIncrement = 1.5;
                const dynamicFontSize =
                  baseFontSize * textSizeFactor - group * fontSizeIncrement;

                return (
                  <div
                    key={`${term}-${idx}`}
                    style={{
                      position: "absolute",
                      left: x,
                      top: y,
                      transform: "translate(-50%, -50%)",
                      opacity: isVisible ? 1 : 0,
                      transition: "opacity 0.3s",
                      pointerEvents: isVisible ? "auto" : "none",
                      fontSize: `${dynamicFontSize}px`,
                      fontWeight: "bold",
                      color: "#fff",
                      whiteSpace: "nowrap",
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
