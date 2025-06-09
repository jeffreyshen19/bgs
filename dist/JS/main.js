mapboxgl.accessToken = 'pk.eyJ1IjoiamVmZnJleXNoZW5jYyIsImEiOiJjamE5MDI4YmowMmMzMndzNDdoZmZnYzF5In0.zV3f0WhqbHeyixwY--TyZg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/light-v11', // style URL
    center: [-74, 40],
    zoom: 6,
    minZoom: 3,
    projection: "mercator"
});

const bgSources = ["9am8kb0i", "40bv3jkg", "8yvyazok", "bmt0dizu", "8noqvw6a", "9rvau020", "1i3rnvxb"]
const countySource = "5th9xdpz"
const stateSource = "dn2i24or";

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

const fieldMapping = {
    'medicaid_only': 'a',
    'medicaid': 'b',
    'medicare_only': 'c',
    'medicare': 'd',
    'households': 'e',
    'snap_households': 'f',
    'population': 'g',
    'white': 'h',
    'black': 'i',
    'aian': 'j',
    'asian': 'k',
    'nhpi': 'l',
    'hispanic': 'm'     
}

const layers = {
    "bgs": {
        minzoom: 7,
        maxzoom: 22,
        sources: ['bgs-0', 'bgs-1', 'bgs-2', 'bgs-3', 'bgs-4', 'bgs-5', 'bgs-6'],
        sourceLayers: ["1-simplifed-4oudnq", "2-simplifed-54wyov", "3-simplifed-ali8na", "5-simplifed-8ksaob", "4-simplifed-25v6ls", "6-simplifed-bd2h7t", "7-simplifed-cc5d46"]
    },
    "counties": {
        minzoom: 5,
        maxzoom: 7,
        sources: ['counties'],
        sourceLayers: ['counties-atvf5u']
    },
    "states": {
        minzoom: 0,
        maxzoom: 5,
        sources: ['states'],
        sourceLayers: ['states-34662l']
    }
}

function setLayer(type, field) {

    const fieldMax = type === 'bgs' ? field.bgMax : (type === 'counties' ? field.countyMax : field.stateMax);

    const fillColor = [
        "case",
        ["==", ["to-number", ['get', type === 'bgs' ? fieldMapping[field.weight] : field.weight]], 0],
        "#ffffff", // white for none
        [
            'interpolate',
            ['linear'],
            [
                '/',
                ["to-number", ['get', type === 'bgs' ? fieldMapping[field.name] : field.name]],
                (field.useWeighting ? ["to-number", ['get', type === 'bgs' ? fieldMapping[field.weight] : field.weight]] : 1)
            ],
            0, '#ffffff',
            (field.useWeighting ? 1  : fieldMax), field.color
        ]
    ]

    const {sources, minzoom, maxzoom, sourceLayers} = layers[type];
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const sourceLayer = sourceLayers[i];
        const fillLayerId = `${source}-fill-${i}`;
        const boundaryLayerId = `${source}-boundary-${i}`;
        if (map.getLayer(fillLayerId)) {
            map.setPaintProperty(fillLayerId, 'fill-color', fillColor);
        }
        else {
            map.addLayer({
                id: fillLayerId,
                type: 'fill',
                minzoom, 
                maxzoom,
                source: source,
                'source-layer': sourceLayer,
                paint: {
                    'fill-opacity': 0.7,
                    'fill-color': fillColor
                }
            });
        }

        if (!map.getLayer(boundaryLayerId)) map.addLayer({
            id: boundaryLayerId,
            type: 'line',
            source: source,
            'source-layer': sourceLayer,
            minzoom,
            maxzoom,
            paint: {
                'line-color': [
                    'case',
                    ['==', ['feature-state', 'click'], true],
                    '#c44d56',
                    '#bdc3c7'
                ],
                'line-width': [
                    'case',
                    ['==', ['feature-state', 'click'], true],
                    3,
                    0.5
                ],
            }
        });
    }



}

function updateMap() {
    const e = document.getElementById("select");
    const option = e.options[e.selectedIndex];

    const field = {
        name: e.value,
        weight: option.getAttribute("data-weighting"),
        useWeighting: document.getElementById("weighting").value === "percent",
        bgMax: +option.getAttribute("data-bg-max"),
        countyMax: +option.getAttribute("data-county-max"),
        stateMax: +option.getAttribute("data-state-max"),
        color: option.getAttribute("data-color"),
    }

    setLayer('bgs', field);
    setLayer('counties', field);
    setLayer('states', field);
}

function addSources() {
    for (let i = 0; i < bgSources.length; i++) {
        const bgSource = bgSources[i];
        map.addSource(`bgs-${i}`, {
            type: 'vector',
            url: `mapbox://jeffreyshencc.${bgSource}`,
            generqteId: true,
        });
    }

    map.addSource(`counties`, {
        type: 'vector',
        url: `mapbox://jeffreyshencc.${countySource}`,
    });

    map.addSource(`states`, {
        type: 'vector',
        url: `mapbox://jeffreyshencc.${stateSource}`,
    });
}

map.on('load', () => {
    getLocation().then((location) => {
        if (location) map.flyTo({ center: [location.longitude, location.latitude], zoom: 10 });
    });

    addSources();

    updateMap();

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
    closeButton: true,
    offset: [0, -15]
});

let selectedId;

function setFeatureState(id, click) {
    for(let i = 0; i < layers.bgs.sources.length; i++) {
        const source = layers.bgs.sources[i];
        const sourceLayer = layers.bgs.sourceLayers[i];

        map.setFeatureState({
            source,
            sourceLayer,
            id
        }, {
            click
        });
    }
}

function generatePopup(event) {

    const features = map.queryRenderedFeatures(event.point).filter((f) => f.layer.type === 'fill' && (f.layer.source === "counties" || f.layer.source === "states" || f.layer.source.startsWith("bgs-")));

    if (!features.length || features[0].id === selectedId) {
        popup.remove();
        // selectedId = null;
        return;
    }

    const feature = features[0];

    // if(selectedId) setFeatureState(selectedId, false);
    // setFeatureState(feature.id, true);
    // selectedId = feature.id;

    const fields = [
        {
            name: 'medicaid_only',
            label: 'With Medicaid Only',
            weight: 'population',
        },
        {
            name: 'medicaid',
            label: 'With Medicaid',
            weight: 'population',
        },
        {
            name: 'medicare_only',
            label: 'With Medicare Only',
            weight: 'population',
        },
        {
            name: 'medicare',
            label: 'With Medicare',
            weight: 'population',
        },
        {
            name: 'snap_households',
            label: 'Households on Food Stamps/SNAP*',
            weight: 'households',
        },
        {
            name: 'white',
            label: 'White**',
            weight: 'population',
        },
        {
            name: 'black',
            label: 'Black**',
            weight: 'population',
        },
        {
            name: 'hispanic',
            label: 'Hispanic/Latine',
            weight: 'population',
        },
        {
            name: 'asian',
            label: 'Asian**',
            weight: 'population',
        },
        {
            name: 'aian',
            label: 'Alaska Native/American Indian**',
            weight: 'population',
        },
        {
            name: 'nhpi',
            label: 'Native Hawaiian/Pacific Islander**',
            weight: 'population',
        }

    ]

    let string = "";
    for (const field of fields) {
        const value = +feature.properties[field.name] || +feature.properties[fieldMapping[field.name]] || 0;
        const weightValue = +feature.properties[field.weight] || +feature.properties[fieldMapping[field.weight]]
        const percentage = weightValue ? (value / weightValue * 100) : 0;

        string += `<p style = "margin-top:0;margin-bottom:0"><strong>${field.label}</strong>: ${addCommas(value)}${percentage !== null ? ` (${percentage.toFixed(2)}%)` : ''}</p>`;
        if(field.name === 'snap_households') string += "<br>"
    }

    let heading;

    if(feature.layer.source === 'states') heading = feature.properties.NAME;
    else if(feature.layer.source === 'counties') heading = `${feature.properties.NAME} County`;
    else heading = `Block Group`;

    // Code from the next step will go here.
    popup.setLngLat(event.lngLat)
        .setHTML(
            `<span class = "heading">${heading}</span>
            ${string}
            <br>
            <i>* within the past 12 months</i><br>
            <i>** non-Hispanic</i>
            `
        )
        .addTo(map);
}

map.on('click', generatePopup);
