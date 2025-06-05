mapboxgl.accessToken = 'pk.eyJ1IjoiamVmZnJleXNoZW5jYyIsImEiOiJjamE5MDI4YmowMmMzMndzNDdoZmZnYzF5In0.zV3f0WhqbHeyixwY--TyZg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/light-v11', // style URL
    center: [-74, 40], 
    zoom: 6, 
    minZoom: 3,
    projection: "mercator"
});

function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                resolve(position.coords);
            });
        }
        else reject();
    })
};

function updateMap(){
  const isWeighted = document.getElementById("weighting").value === "percent";
  const e = document.getElementById("select");
  const option = e.options[e.selectedIndex];
  const field = {
    name: e.value,
    weight: option.getAttribute("data-weighting"),
    max: +option.getAttribute("data-max"),
    color: option.getAttribute("data-color"),
  }

  const fillColor = [
    "case",
    ["==", ["to-number", ['get',field.weight]], 0],
    "#ffffff", // white for none
    [
      'interpolate',
      ['linear'],
      [
        '/',
        ["to-number", ['get',field.name]],
        (isWeighted ? ["to-number", ['get',field.weight]] : 1)
      ],
      0, '#ffffff', 
      (isWeighted ? 1 : field.max), field.color
    ]
  ]

  if(map.getLayer('bgs')) {
    map.setPaintProperty('bgs', 'fill-color', fillColor);
  }
  else {
    map.addLayer({
      id: 'bgs',
      type: 'fill',
      source: 'tileset',
      'source-layer': 'bgs', 
      paint: {
        'fill-opacity': 0.7,
        'fill-color': fillColor
      }
    });
  }
}

map.on('load', () => {
  getLocation().then((location) => {
    if(location) map.flyTo({center: [location.longitude, location.latitude], zoom: 10});
  });

  map.addSource('tileset', {
    type: 'vector',
    url: 'mapbox://jeffreyshencc.snap',
    promoteId:'GEOID'
  });

  updateMap();

  map.addLayer({
    id: 'bgs-boundary',
    type: 'line',
    source: 'tileset',
    'source-layer': 'bgs', 
    minzoom: 9,
    paint: {
      'line-color': [
        'case',
        ['==', ['feature-state', 'click'], true],
        '#c44d56',
        '#bdc3c7'
      ],
      'line-width':  [
        'case',
        ['==', ['feature-state', 'click'], true],
        1,
        0.5
      ],
    }
  });
});

map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

const nav = new mapboxgl.NavigationControl({
  visualizePitch: true
});
map.addControl(nav, 'bottom-right');

function addCommas(n) {
    var parts = n.toString().split(".");
    const numberPart = parts[0];
    const decimalPart = parts[1];
    const thousands = /\B(?=(\d{3})+(?!\d))/g;
    return numberPart.replace(thousands, ",") + (decimalPart ? "." + decimalPart : "");
}

// Create a popup, but don't add it to the map yet.
const popup = new mapboxgl.Popup({
  closeButton: false,
  offset: [0, -15]
});

let selectedId;

function generatePopup(event){
  if(selectedId) {
    map.setFeatureState({
      source: 'tileset',
      sourceLayer: 'bgs',
      id: selectedId
    }, {
      click: false
    });
  }

  const features = map.queryRenderedFeatures(event.point, {
    layers: ['bgs']
  });
  if (!features.length) {
    popup.remove();
    return;
  }

  const feature = features[0];

  map.setFeatureState({
    source: 'tileset',
    sourceLayer: 'bgs',
    id: feature.id
  }, {
    click: true
  });

  selectedId = feature.id;

  
  const fields = [
  {
    name: 'medicarecaid_only',
    label: 'With Medicare/Medicaid Coverage Only',
    weight: 'population',
  },
  {
    name: 'medicarecaid',
    label: 'With Medicare/Medicaid Coverage',
    weight: 'population',
  },
  {
    name: 'snap_households',
    label: 'Households on Food Stamps/SNAP (in the past year)',
    weight: 'households',
  },
  {
    name: 'white',
    label: 'White (non-Hispanic)',
    weight: 'population',
  },
  {
    name: 'black',
    label: 'Black (non-Hispanic)',
    weight: 'population',
  },
  {
    name: 'hispanic',
    label: 'Hispanic',
    weight: 'population',
  },
  {
    name: 'asian',
    label: 'Asian (non-Hispanic)',
    weight: 'population',
  },
  {
    name: 'aian',
    label: 'Alaska Native/American Indian (non-Hispanic)',
    weight: 'population',
  },
  {
    name: 'nhpi',
    label: 'Native Hawaiian/Pacific Islander (non-Hispanic)',
    weight: 'population',
  }
  
]

  let string = "";
  for(const field of fields) {
    const value = +feature.properties[field.name];
    const weightValue = +feature.properties[field.weight];
    const percentage = weightValue ? (value / weightValue * 100) : null;

    string += `<p style = "margin-top:0;margin-bottom:0"><strong>${field.label}</strong>: ${addCommas(value)}${percentage !== null ? ` (${percentage.toFixed(2)}%)` : ''}</p>`;

  }

  // Code from the next step will go here.
  popup.setLngLat(event.lngLat)
  .setHTML(
    `<span class = "heading">Block Group ${feature.properties.GEOID}</span>
    ${string}
    `
  )
  .addTo(map);
}

map.on('click', generatePopup);
