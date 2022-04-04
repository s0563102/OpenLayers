import './style.css';
import {Map, Overlay, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {Control, MousePosition,OverviewMap, FullScreen, ZoomSlider,ScaleLine, defaults as defaultControls} from 'ol/control';
import BingMaps from 'ol/source/BingMaps';
import LayerGroup from 'ol/layer/Group';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Geolocation } from 'ol';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Point from 'ol/geom/Point';
import Draw from 'ol/interaction/Draw';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import GeoJSON from 'ol/format/GeoJSON';
import Modify from 'ol/interaction/Modify';
import Geocoder from 'ol-geocoder';
import Stamen from 'ol/source/Stamen';











const view = new View({
  center: [0, 0],
  zoom: 2,
  minZoom: 2,
  maxZoom: 20,
  //rotation: 0, Wert für attribut "rotation" ist by default auf "0" gesetzt
});


// Geocoder/Suchfunktion----------------------------------------------------------------------------------------------------

var geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  lang: 'de',
  placeholder: 'Search for ...',
  limit: 5,
  autoComplete: true,
  keepOpen: true,  
});

geocoder.on('addresschosen', function(evt){
  var feature = evt.feature;
  geocoder.getSource().clear();
  geocoder.getSource().addFeature(feature);

});

//--LayerSwitcher-------------------------------------------------------------------------------------------------

class layerSwitcherControl extends Control {
  constructor (){
    
    const element = document.getElementById('layerbtn-group');
    element.className = 'ol-control layerSwitcherControl'
    super({
      element:element
    });
    const layerButtons = document.querySelectorAll('.layerButton');
    console.log(layerButtons);
    layerButtons.forEach(function(element){
      element.addEventListener('click', function(){
           console.log(element);
           let buttonID = element.id;
           console.log(buttonID);
           layerGroup.getLayers().forEach(function(layer){
           console.log(layer);
            let layerClassName = layer.getClassName();
            console.log(layerClassName);
            layer.setVisible(buttonID == layerClassName);
            
          })          
      })
    })
  }
}



// Standortfunktion ---------------------------------------------------------------------------------------------------------------------


const positionFeature = new Feature(); 

class geoLocationControl extends Control {
  constructor(){
    const geoButton = document.getElementById('geoButton');
    const element = document.getElementById('geoButtonContainer');
    element.className = 'geoLocationControl ol-control';
    


   
    super({
      element: element,
    });

    const geolocation = new Geolocation({
      projection: view.getProjection(),
      /*trackingOptions: {
        enableHighAccuracy: true,
      },
      */
    });

    geoButton.addEventListener('click', function () {
        geolocation.setTracking(true); 
    
          
    });
    

      // handle geolocation error.
geolocation.on('error', function (error) {
  const info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});




geolocation.once('change:position', function(){ //Listen once for a certain type of event.
  view.animate({center:geolocation.getPosition(),duration:2000});
  view.animate({zoom: view.getZoom() -1, duration:2000,},{zoom:17,duration:2500}); //animation
})




positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC',
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2,
      }),
    }),
  })
);

geolocation.on('change:position', function () {
  const coordinates= geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});



}



}

//--Draw Control Layerschicht------------------------------------------------------------------------------------------------------------

const source = new VectorSource();

//-----LÖschfunktion + Downloadbutton-----------------------------------------------------------------------------------------------------------------------------

class editControl extends Control{
  constructor(){
    const element = document.getElementById('editButtons');
    element.className='ol-control editControl'
    super({
      element:element
    });
    
    const clearButton = document.getElementById('clear');
    clearButton.addEventListener('click', function () {
      source.clear();
    });
    
    const format = new GeoJSON({featureProjection: 'EPSG:3857'});
    const download = document.getElementById('download');
    source.on('change', function () {
    const features = source.getFeatures();
    console.log(features);
    const json = format.writeFeatures(features);
    download.href ='data:application/json;charset=utf-8,' + encodeURIComponent(json);
    });
    
  }
}

//--------------------Zeichenfunktion-----------------------------------------------------------------------------------------------------

class drawControl extends Control{
      
  constructor(){
    let draw; //draw interaction
    const drawButtons = document.querySelectorAll('.drawButton')
    const element = document.getElementById('drawbtn-group');
    element.className = 'drawControl ol-control';
    
    super({
      element:element
    });
  
    drawButtons.forEach(function(element){
      element.addEventListener('click', function(){
        map.removeInteraction(draw);
          console.log(element);
          let drawButtonID = element.id;
          console.log(drawButtonID);
          draw = new Draw({
             type: element.id,
             source: source,
          });
          map.addInteraction(draw);   
          draw.on('drawend', function(){
            console.log("Drawing finished");
            map.removeInteraction(draw);
            console.log(source);

            
          })

      })

    })



  }
}
//----Themenquellen-----------------------------------------------------------------------------------------------------------------
const stamenSource = new Stamen({
  layer:'watercolor'
});

const cartoDBSource = new XYZ({
  url: 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{scale}.png',
  attributions: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  
});

const bingMapsSource = new BingMaps({
  key: "Aq_vYQcM0sj3AUXXM-msRg3W3kWjDO7-Zpc7A2bgZqzE8z6EhH80CcViTNRd9nXu", //https://www.bingmapsportal.com/Announcement?redirect=True
  imagerySet: 'CanvasLight',
  
})

//---Layergroup mit Kartenthemen---------------------------------------------------------------------------------------------------

const layerGroup = new LayerGroup({
  layers: [new TileLayer({
    source: new OSM(),
    visible: false,
    className: 'osm'
  }),
  
  new TileLayer({
    source: stamenSource,
    visible: false,
    className: 'stamen'
  }),
  new TileLayer({
    source: cartoDBSource,
    visible: false,
    className: 'cartoDB',
  }),
  new TileLayer({
    source: bingMapsSource,
    visible:true,
    className:'bingMaps',
}),

]
})



//-Map-Objekt---------------------------------------------------------------------------------------------------------------------
const map = new Map({
  target: 'map',
  layers: [
    layerGroup,//---------------------zentrale Variable für alle Kartendesigns----------------------------------------------------
    new VectorLayer({
      source: source,
    }),
    new VectorLayer({ //-------------------------Layerschicht für Standortfunktion (blauer punkt) --------------------------------
      source: new VectorSource({
        features: [positionFeature],
      }), 
    
    }) //-------------------------------------------------------------------------------------------------------------------------
  ],
  view: view,
   controls: defaultControls().extend([
        new ScaleLine({
        //units: 'metric',  metrisches Einheitssystem
        minWidth:100, //Mindestlänge des Maßstabsbalken
        bar: true, // Maßstabsbalken
        steps: 4,
        text: true, //integrierter Zahlenmaßstab
      }),
    new ZoomSlider(), 
    new OverviewMap({
      layers: [ 
      new TileLayer({
          source: new BingMaps({
              key: "Aq_vYQcM0sj3AUXXM-msRg3W3kWjDO7-Zpc7A2bgZqzE8z6EhH80CcViTNRd9nXu", //https://www.bingmapsportal.com/Announcement?redirect=True
              imagerySet: 'AerialWithLabels' 
          }),
      })
    ],
    
    collapsed:false
    }),
    new MousePosition(),
    new FullScreen(),
    new layerSwitcherControl(),
    new geoLocationControl(),
    new drawControl(),
    new editControl()
   ]),
  
   
}); 

//---------------Suchfunktion------------------------------------------------------------------------------------------------------
map.addControl(geocoder); 

//-------------------------------------------Drag and Drop Funktion für GJSON Dateien----------------------------------------------
map.addInteraction(
  new DragAndDrop({
    source: source,
    formatConstructors: [GeoJSON],
  })
);

//-------------------------------------------Modify Funktion------------------------------------------------------------------------


map.addInteraction(
  new Modify({
    source: source,
  })
);

//----Geocoder----------------------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------------------------------










