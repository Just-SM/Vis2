/*
* https://deck.gl/docs/api-reference/aggregation-layers/heatmap-layer
*/

import {Deck,} from '@deck.gl/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import {CollisionFilterExtension} from '@deck.gl/extensions'
import {TextLayer,ScatterplotLayer} from '@deck.gl/layers';
import {CSVLoader} from '@loaders.gl/csv';
import {H3ClusterLayer} from '@deck.gl/geo-layers';

// const heatmapLayer = new HeatmapLayer({
//   id: 'heatmap-layer',
//   data: [
//     { position: [3.5, 8], weight: 1 },
//     { position: [3.8, 7.7], weight: 2 },
//   ],
//   getPosition: d => d.position,
//   getWeight: d => d.weight,
//   pickable: true, // Enable picking for interaction 
// });

function updateHeatmapLayer(year) {
  // const heatmapData = getDataForYear(year);

  const heatmapLayer = new HeatmapLayer({
    id: 'heatmap-layer',
  data: "heat_map_data.json",
  // data: [
  //       { coord: [3.5, 8], 2005: 1 },
  //       { coord: [3.8, 7.7], 2005: 2 },
  //     ],
  getPosition: d => [d.coord[1], d.coord[0]],
  getWeight: d => d[year],
  radiusPixels: 60,
  opacity: 0.7,
  updateTriggers: {
    getWeight: year,
  },
  pickable: true, // Enable picking for interaction 
  })


  deck.setProps({
    layers: isLayerVisible ? [hex3layer,heatmapLayer,textlayer,] : [hex3layer,textlayer],
  });
}

    const hex3layer = new H3ClusterLayer({
      id: 'H3ClusterLayer',
      data: 'hex_data.json',
      
      stroked: true,
      getHexagons: d => d.hexIds,
      getFillColor: d => [d.color[0], d.color[1], d.color[2]],
      getLineColor: [255, 255, 255],
      lineWidthMinPixels: 2,
      pickable: true,
      opacity: 0.3,
  
    });

const textlayer = new TextLayer({
      id: 'text',
      parameters: {depthTest: false},
      data: 'words_emb.json',
      
      // loaders: [CSVLoader],
      extensions: [new CollisionFilterExtension()],
      getCollisionPriority: d => d.tf_icf *1000 ^ 2,
      // collisionTestProps: {radiusScale: 100},

      loadOptions: {
        csv: {
          dynamicTyping: true,
          skipEmptyLines: true,
        },
      },
      
      getPosition: d => [d.coord[0],d.coord[1]],
      getText: d => d.words,
      // getAlignmentBaseline: 'center',
      getColor: [70,70, 70],
      getSize:  d => (d.tf_icf * 3000) +10 ,
      // getTextAnchor: 'middle',
      pickable: true
    })

deck = new Deck({
  // mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',

  initialViewState: {
    longitude: 3.5,
    latitude: 8,
    zoom: 6.5,
    maxZoom: 20,
    pitch: 30,
    bearing: 0
  },
  controller: true,
  
  // layers: [, hex3layer,layer,textlayer,heatmapLayer]
  layers: [, hex3layer,textlayer]
});



let selectedYear = 2017; // Default year

let isLayerVisible = true; // State for toggling the layer

updateHeatmapLayer(selectedYear);

// Event Listener: Update the map when the year slider changes
const yearSlider = document.getElementById('yearSlider');
const selectedYearLabel = document.getElementById('selectedYear');

yearSlider.addEventListener('input', (event) => {
  selectedYear = event.target.value;
  selectedYearLabel.textContent = selectedYear;
  updateHeatmapLayer(selectedYear);
});

// Event Listener: Toggle the layer visibility
const toggleLayerButton = document.getElementById('toggleLayerButton');

toggleLayerButton.addEventListener('click', () => {
  isLayerVisible = !isLayerVisible;
  toggleLayerButton.textContent = isLayerVisible ? 'Turn Off Layer' : 'Turn On Layer';
  updateHeatmapLayer(selectedYear);
});
