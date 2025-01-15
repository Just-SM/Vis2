/* eslint-disable */
/* @ts-nocheck */
import React from "react";
import { Settings, Map, Plus, ChevronRight } from "lucide-react";


interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  openParams: boolean;
  setOpenParams: React.Dispatch<React.SetStateAction<boolean>>;
  openMap: boolean;
  setOpenMap: React.Dispatch<React.SetStateAction<boolean>>;
  openAdd: boolean;
  setOpenAdd: React.Dispatch<React.SetStateAction<boolean>>;

  showDensityLines: boolean;
  setShowDensityLines: React.Dispatch<React.SetStateAction<boolean>>;
  densityLinesThreshold: number;
  setDensityLinesThreshold: React.Dispatch<React.SetStateAction<number>>;
  densityLinesBandwidth: number;
  setDensityLinesBandwidth: React.Dispatch<React.SetStateAction<number>>;

  showHeatMap: boolean;
  setShowHeatMap: React.Dispatch<React.SetStateAction<boolean>>;
  heatmapThreshold: number;
  setHeatmapThreshold: React.Dispatch<React.SetStateAction<number>>;
  heatmapBandwidth: number;
  setHeatmapBandwidth: React.Dispatch<React.SetStateAction<number>>;

  showTextLabels: boolean;
  setShowTextLabels: React.Dispatch<React.SetStateAction<boolean>>;
  textSize: number;
  setTextSize: React.Dispatch<React.SetStateAction<number>>;
  textSizeFactor: number;
  setTextSizeFactor: React.Dispatch<React.SetStateAction<number>>;

  mainInputText: string;
  setMainInputText: React.Dispatch<React.SetStateAction<string>>;
  handleProcessMainText: () => void;

  addInputText: string;
  setAddInputText: React.Dispatch<React.SetStateAction<string>>;
  handleAddToMap: () => void;

  terms: any[];
  updateContoursAndChartSize: (arr: any[]) => void;

  handleSliderChange: (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => void;
}

// ToggleSwitch Component Definition
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  const labelStyle: React.CSSProperties = {
    marginRight: "8px",
    fontSize: "14px",
  };

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {label && <span style={labelStyle}>{label}</span>}
      <div
        style={{
          position: "relative",
          width: "42px",
          height: "22px",
          background: checked ? "#4caf50" : "#ccc",
          borderRadius: "999px",
          transition: "background-color 0.2s",
        }}
        onClick={() => onChange(!checked)}
        aria-label={label}
      >
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: checked ? "22px" : "1px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </div>
    </label>
  );
}

// Sidebar Component Definition
export default function Sidebar({
  isSidebarOpen,
  openParams,
  openMap,
  openAdd,
  setIsSidebarOpen,
  setOpenParams,
  setOpenMap,
  setOpenAdd,
  showDensityLines,
  setShowDensityLines,
  densityLinesThreshold,
  setDensityLinesThreshold,
  densityLinesBandwidth,
  setDensityLinesBandwidth,
  showHeatMap,
  setShowHeatMap,
  heatmapThreshold,
  setHeatmapThreshold,
  heatmapBandwidth,
  setHeatmapBandwidth,
  showTextLabels,
  setShowTextLabels,
  textSize,
  setTextSize,
  textSizeFactor,
  setTextSizeFactor,
  mainInputText,
  setMainInputText,
  handleProcessMainText,
  addInputText,
  setAddInputText,
  handleAddToMap,
  handleSliderChange,
}: SidebarProps) {
  // Consistent label styling
  const smallLabelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 5,
    fontSize: "14px",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: isSidebarOpen ? 0 : "-400px",
        width: "300px",
        height: "100%",
        background: "#444",
        zIndex: 9998,
        transition: "left 0.3s ease",
        padding: "20px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Parameters Section */}
      <div
        onClick={() => setOpenParams(!openParams)}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "10px 0",
          borderBottom: "1px solid #555",
          marginTop: 30,
        }}
      >
        <Settings style={{ marginRight: 8 }} size={16} />
        <span>Parameters</span>
        <ChevronRight
          style={{
            marginLeft: "auto",
            transform: openParams ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          size={16}
        />
      </div>
      {openParams && (
        <div style={{ marginTop: 10 }}>
          {/* Toggle for Density Lines */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <ToggleSwitch
              checked={showDensityLines}
              onChange={(val) => setShowDensityLines(val)}
              label="Display Density Lines"
            />
          </div>
          {/* Density Lines Threshold */}
          <div style={{ marginBottom: 15 }}>
            <label style={smallLabelStyle}>
              Density Lines Threshold: {densityLinesThreshold}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={densityLinesThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleSliderChange(setDensityLinesThreshold, val);
              }}
              style={{ width: "100%" }}
              aria-label="Density Lines Threshold"
            />
          </div>
          {/* Density Lines Bandwidth */}
          <div style={{ marginBottom: 20 }}>
            <label style={smallLabelStyle}>
              Density Lines Bandwidth: {densityLinesBandwidth}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={densityLinesBandwidth}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleSliderChange(setDensityLinesBandwidth, val);
              }}
              style={{ width: "100%" }}
              aria-label="Density Lines Bandwidth"
            />
          </div>
          <hr style={{ border: "0.5px solid #555", margin: "15px 0" }} />
          {/* Toggle for Heat Map */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <ToggleSwitch
              checked={showHeatMap}
              onChange={(val) => setShowHeatMap(val)}
              label="Display Heat Map"
            />
          </div>
          {/* Heatmap Threshold */}
          <div style={{ marginBottom: 15 }}>
            <label style={smallLabelStyle}>
              Heatmap Intensity Threshold: {heatmapThreshold}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={heatmapThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleSliderChange(setHeatmapThreshold, val);
              }}
              style={{ width: "100%" }}
              aria-label="Heatmap Intensity Threshold"
            />
          </div>
          {/* Heatmap Bandwidth */}
          <div style={{ marginBottom: 20 }}>
            <label style={smallLabelStyle}>
              Heatmap Bandwidth: {heatmapBandwidth}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={heatmapBandwidth}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleSliderChange(setHeatmapBandwidth, val);
              }}
              style={{ width: "100%" }}
              aria-label="Heatmap Bandwidth"
            />
          </div>
          <hr style={{ border: "0.5px solid #555", margin: "15px 0" }} />
          {/* Toggle for Text Labels */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <ToggleSwitch
              checked={showTextLabels}
              onChange={(val) => setShowTextLabels(val)}
              label="Display Text Labels"
            />
          </div>
          {/* Text Size */}
          <div style={{ marginBottom: 15 }}>
            <label style={smallLabelStyle}>Text Size: {textSize}px</label>
            <input
              type="range"
              min="8"
              max="36"
              value={textSize}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTextSize(val);
                // Re-render is sufficient for text size changes
              }}
              style={{ width: "100%" }}
              aria-label="Text Size"
            />
          </div>
          {/* Text Size Factor */}
          <div style={{ marginBottom: 20 }}>
            <label style={smallLabelStyle}>
              Text Size Factor: {textSizeFactor.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={textSizeFactor}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTextSizeFactor(val);
                // Re-render is sufficient for text size factor changes
              }}
              style={{ width: "100%" }}
              aria-label="Text Size Factor"
            />
          </div>
        </div>
      )}

      {/* Map Creation Section */}
      <div
        onClick={() => setOpenMap(!openMap)}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "10px 0",
          borderBottom: "1px solid #555",
        }}
      >
        <Map style={{ marginRight: 8 }} size={16} />
        <span>Map</span>
        <ChevronRight
          style={{
            marginLeft: "auto",
            transform: openMap ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          size={16}
        />
      </div>
      {openMap && (
        <div style={{ marginTop: 10 }}>
          <label style={smallLabelStyle}>Enter text:</label>
          <textarea
            style={{
              width: "100%",
              height: "60px",
              marginBottom: "10px",
              fontSize: "14px",
              color: "#fff",
              backgroundColor: "#333",
              border: "1px solid #555",
              borderRadius: "4px",
              padding: "8px",
              boxSizing: "border-box",
            }}
            value={mainInputText}
            onChange={(e) => setMainInputText(e.target.value)}
            aria-label="Main Input Text"
          />
          <button
            onClick={handleProcessMainText}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0275d8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
            aria-label="Update Map"
          >
            Update Map
          </button>
        </div>
      )}

      {/* Add Words Section */}
      <div
        onClick={() => setOpenAdd(!openAdd)}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "10px 0",
          borderBottom: "1px solid #555",
        }}
      >
        <Plus style={{ marginRight: 8 }} size={16} />
        <span>Add Words</span>
        <ChevronRight
          style={{
            marginLeft: "auto",
            transform: openAdd ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          size={16}
        />
      </div>
      {openAdd && (
        <div style={{ marginTop: 10 }}>
          <label style={smallLabelStyle}>Enter text:</label>
          <textarea
            style={{
              width: "100%",
              height: "60px",
              marginBottom: "10px",
              fontSize: "14px",
              color: "#fff",
              backgroundColor: "#333",
              border: "1px solid #555",
              borderRadius: "4px",
              padding: "8px",
              boxSizing: "border-box",
            }}
            value={addInputText}
            onChange={(e) => setAddInputText(e.target.value)}
            aria-label="Add Input Text"
          />
          <button
            onClick={handleAddToMap}
            style={{
              padding: "8px 16px",
              backgroundColor: "#5cb85c",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
            aria-label="Add to Map"
          >
            Add to Map
          </button>
        </div>
      )}
    </div>
  );
}
