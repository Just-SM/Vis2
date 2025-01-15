import {Deck} from '@deck.gl/core';
import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import {CollisionFilterExtension} from '@deck.gl/extensions';
import {TextLayer} from '@deck.gl/layers';
import {H3ClusterLayer} from '@deck.gl/geo-layers';

import {
  ZOOM_SCALE_FACTOR,
  ENABLE_MIN_MAX,
  MIN_TEXT_SIZE,
  MAX_TEXT_SIZE,
  SCROLL_ZOOM_SPEED,
  BASE_ZOOM_OFFSET,
  INITIAL_VIEW_STATE,
} from './config.js';

// Deck.gl instance
let deck = new Deck({
  initialViewState: INITIAL_VIEW_STATE,
  controller: {
    scrollZoom: {
      speed: SCROLL_ZOOM_SPEED,
      smooth: true,
    },
    doubleClickZoom: true,
    dragPan: true,
  },
  layers: [], // Initialize with no layers
});

// Layers
let heatmapLayer = null;
let hex3layer = null;
let textlayer = null;

// State variables
let selectedYear = 2017; // Default year
let isHeatmapVisible = true; // Heatmap visibility
let isHexVisible = true; // Hexagon visibility

/**
 * Function to create or update the HeatmapLayer dynamically
 * @param {number} year - The selected year for the heatmap data
 */
function updateHeatmapLayer(year) {
  if (isHeatmapVisible) {
    heatmapLayer = new HeatmapLayer({
      id: 'heatmap-layer',
      data: './data/heat_map_data.json',
      getPosition: d => [d.coord[1], d.coord[0]],
      getWeight: d => d[year],
      radiusPixels: 60,
      opacity: 0.4,
      updateTriggers: {getWeight: year},
      pickable: true,
    });
  } else {
    heatmapLayer = null;
  }
  updateLayers();
}

/**
 * Function to create or update the HexagonLayer
 */
function updateHexLayer() {
  if (isHexVisible) {
    hex3layer = new H3ClusterLayer({
      id: 'H3ClusterLayer',
      data: './data/hex_data.json',
      stroked: true,
      getHexagons: d => d.hexIds,
      getFillColor: d => [d.color[0], d.color[1], d.color[2]],
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 2,
      pickable: true,
      opacity: 0.2,
    });
  } else {
    hex3layer = null;
  }
  updateLayers();
}

/**
 * Function to create or update the TextLayer dynamically
 * @param {object} viewState - The current view state of the Deck.gl instance
 */
function updateTextLayer(viewState) {
  if (!textlayer) {
    textlayer = new TextLayer({
      id: 'text',
      sizeUnits: 'pixels', // Scale text size directly in screen-space
      parameters: {depthTest: false},
      data: './data/words_emb.json',
      extensions: [new CollisionFilterExtension()],
      collisionEnabled: true,
      getCollisionPriority: d => (d.tf_icf * 4000) ** 2,
      getPosition: d => [d.coord[0], d.coord[1]],
      getSize: d => (d.tf_icf * 3000) + 4, // Base size calculation
      getColor: [70, 70, 70],
      getText: d => d.words,
      pickable: true,
    });
  }

  // Update text size based on zoom
  const updatedTextLayer = textlayer.clone({
    getSize: d => {
      const baseSize = (d.tf_icf * 3000) + 4;
      // Scale the text size based on zoom level
      const scaledSize = baseSize * Math.pow(
        2,
        ZOOM_SCALE_FACTOR * (viewState.zoom - BASE_ZOOM_OFFSET)
      );
      return scaledSize;
    },
    getText: d => {
      const baseSize = (d.tf_icf * 3000) + 4;
      const scaledSize = baseSize * Math.pow(
        2,
        ZOOM_SCALE_FACTOR * (viewState.zoom - BASE_ZOOM_OFFSET)
      );

      // Hide text if it falls outside the specified size range
      if (ENABLE_MIN_MAX) {
        if (scaledSize < MIN_TEXT_SIZE) return '';
        if (scaledSize > MAX_TEXT_SIZE) return '';
      }
      return d.words;
    },
  });

  textlayer = updatedTextLayer;
}

/**
 * Function to update all layers based on current state
 */
function updateLayers(viewState) {
  const layers = [];
  if (isHexVisible && hex3layer) layers.push(hex3layer);
  if (isHeatmapVisible && heatmapLayer) layers.push(heatmapLayer);
  if (textlayer) layers.push(textlayer);
  deck.setProps({ layers });
}

// Initialize Hexagon Layer
updateHexLayer();

// Initialize Text Layer
updateTextLayer(deck.viewState);

// Initial Heatmap Update
updateHeatmapLayer(selectedYear);

// Slider for selecting the year
const yearSlider = document.getElementById('yearSlider');
const selectedYearLabel = document.getElementById('selectedYear');
yearSlider.addEventListener('input', event => {
  selectedYear = event.target.value;
  selectedYearLabel.textContent = selectedYear;
  updateHeatmapLayer(selectedYear);
});

// Heatmap Toggle
const heatmapToggle = document.getElementById('heatmapToggle');
heatmapToggle.addEventListener('change', event => {
  isHeatmapVisible = event.target.checked;
  updateHeatmapLayer(selectedYear);
});

// Hexagon Toggle
const hexToggle = document.getElementById('hexToggle');
hexToggle.addEventListener('change', event => {
  isHexVisible = event.target.checked;
  updateHexLayer();
});

// Handle view state changes for dynamic text sizing
deck.setProps({
  onViewStateChange: ({viewState}) => {
    updateTextLayer(viewState);
    updateLayers(viewState);
  },
});
