import {Deck,MapController,COORDINATE_SYSTEM} from '@deck.gl/core';
import {GeoJsonLayer,TextLayer,BitmapLayer, ArcLayer} from '@deck.gl/layers';
import {CSVLoader} from '@loaders.gl/csv';
import {CollisionFilterExtension} from '@deck.gl/extensions'

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
// const COUNTRIES =
//   'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; //eslint-disable-line
// const AIR_PORTS =
//   'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const INITIAL_VIEW_STATE = {
  latitude: 51.47,
  longitude: 0.45,
  zoom: 4,
  bearing: 0,
  pitch: 30
};

let opacity = 0.1

// class MyMapController extends MapController {

//   handleEvent(event) {
//     if (event.type === 'wheel') {

//       if (event.delta < 0){
//         opacity /= 1.55
//       }
//       else{
//         opacity *= 1.55
//       }
//       if (opacity <= 0.1) {opacity = 0.1}
//       if (opacity >= 1) {opacity = 1}
//       console.log(opacity)
//       deck.setProps({
//         layers: [
//           new GeoJsonLayer({
//             id: 'base-map',
//             data: COUNTRIES,
//             // Styles
//             stroked: true,
//             filled: true,
//             lineWidthMinPixels: 2,
//             opacity: 0.4,
//             getLineColor: [60, 60, 60],
//             getFillColor: [200, 200, 200]
//           }),
//           new GeoJsonLayer({
//             id: 'airports',
//             data: AIR_PORTS,
//             extensions: [new CollisionFilterExtension()],
//             // Styles
//             filled: true,
//             opacity: opacity,
//             pointRadiusMinPixels: 2,
//             pointRadiusScale: 2000,
//             getPointRadius: f => 11 - f.properties.scalerank,
//             getFillColor: [200, 0, 80, 180],
//             // Interactive props
//             pickable: true,
//             autoHighlight: true,
//             onClick: info =>
//               // eslint-disable-next-line
//               info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
//           }),
//         ]

//       })



//       super.handleEvent(event);
//     } else {
//       super.handleEvent(event);
//     }
//   }
// }

const deck = new Deck({
  initialViewState: INITIAL_VIEW_STATE,
  // controller: {type: MyMapController},
  controller: {inertia: true,scrollZoom: {smooth : 1}},
  layers: [

    new TextLayer({
      id: 'ScatterplotLayer',
      data: 'data.csv',
      
      loaders: [CSVLoader],
      extensions: [new CollisionFilterExtension()],
      getCollisionPriority: d => d.weight,

      loadOptions: {
        csv: {
          dynamicTyping: true,
          skipEmptyLines: true,
        },
      },
      
      getPosition: d => [d.x * 10, (d.y*10) - 20],
      getText: d => d.word,
      getAlignmentBaseline: 'center',
      getColor: [255, 128, 0],
      getSize:  d => d.weight * 10,
      getTextAnchor: 'middle',
      pickable: true
    }),

    // new GeoJsonLayer({
    //   id: 'base-map',
    //   data: COUNTRIES,
    //   // Styles
    //   stroked: true,
    //   filled: true,
    //   lineWidthMinPixels: 2,
    //   opacity: 0.4,
    //   getLineColor: [60, 60, 60],
    //   getFillColor: [200, 200, 200]
    // }),
    // new GeoJsonLayer({
    //   id: 'airports',
    //   data: AIR_PORTS,
    //   // Styles
    //   extensions : [new CollisionFilterExtension()],
    //   filled: true,
    //   opacity: 0.5,
    //   pointRadiusMinPixels: 10,
    //   pointRadiusScale: 2000,
    //   getPointRadius: f => 11 - f.properties.scalerank,
    //   getFillColor: [200, 0, 80, 180],
    //   // Interactive props
    //   pickable: true,
    //   autoHighlight: true,
    //   onClick: info =>
    //     // eslint-disable-next-line
    //     info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
    // }),
    // new ArcLayer({
    //   id: 'arcs',
    //   data: AIR_PORTS,
    //   dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
    //   // Styles
    //   getSourcePosition: f => [-0.4531566, 51.4709959], // London
    //   getTargetPosition: f => f.geometry.coordinates,
    //   getSourceColor: [0, 128, 200],
    //   getTargetColor: [200, 0, 80],
    //   getWidth: 1
    // })
  ]
});