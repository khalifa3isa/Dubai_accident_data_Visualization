// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2hhbGlmYTNpc2EiLCJhIjoiY200MDR5Y2JyMjByeDJpc2M0MHFzMTY4eCJ9.-nz9J07Nyt26shFr17qBhw';

// Initialize Mapbox Map
const map = new mapboxgl.Map({
    container: 'map-container',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [55.3, 25.2], // Center on Dubai
    zoom: 10
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// Global GeoJSON object for filtering
let geojson;

// Load and render data
map.on('load', () => {
    d3.csv("data/accident_weather_merged_data.csv").then((data) => {
        // Convert CSV rows to GeoJSON features
        geojson = {
            type: "FeatureCollection",
            features: data.map(d => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [parseFloat(d.Longitude), parseFloat(d.Latitude)] // Ensure numeric format
                },
                properties: {
                    "Accident Type": d["Accident Type"],
                    "Weather Conditions": d["Weather Conditions"],
                    "Temperature": parseFloat(d.Temperature),
                    "Humidity": parseFloat(d.Humidity),
                    "Time": d.Time
                }
            }))
        };

        // Add the GeoJSON data as a source
        map.addSource("accidents", {
            type: "geojson",
            data: geojson
        });

        // Add heatmap layer
        map.addLayer({
            id: "accident-heatmap",
            type: "heatmap",
            source: "accidents",
            paint: {
                // Increase the weight of points with higher temperatures
                "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["get", "Temperature"],
                    0, 0,
                    100, 1
                ],
                // Adjust intensity based on zoom
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 1,
                    15, 3
                ],
                // Color gradient based on density
                "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(33,102,172,0)",
                    0.2, "rgb(103,169,207)",
                    0.4, "rgb(209,229,240)",
                    0.6, "rgb(253,219,199)",
                    0.8, "rgb(239,138,98)",
                    1, "rgb(178,24,43)"
                ],
                // Radius increases with zoom level
                "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 2,
                    15, 20
                ],
                // Reduce opacity at higher zoom levels
                "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    7, 1,
                    15, 0
                ]
            }
        });

        // Add click interaction (optional)
        map.on("click", (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["accident-heatmap"]
            });
            if (features.length) {
                const props = features[0].properties;
                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <strong>Accident Type:</strong> ${props["Accident Type"]}<br>
                        <strong>Weather:</strong> ${props["Weather Conditions"]}<br>
                        <strong>Temperature:</strong> ${props["Temperature"]} °F<br>
                        <strong>Humidity:</strong> ${props["Humidity"]} %<br>
                        <strong>Time:</strong> ${props["Time"]}
                    `)
                    .addTo(map);
            }
        });

        // Add filtering by weather
        document.getElementById("weather-filter").addEventListener("change", (e) => {
            const condition = e.target.value;
            const filteredGeojson = {
                type: "FeatureCollection",
                features: geojson.features.filter(f =>
                    condition === "All" || f.properties["Weather Conditions"] === condition
                )
            };
            map.getSource("accidents").setData(filteredGeojson);
        });

        // Add filtering by time
        document.getElementById("time-slider").addEventListener("input", (e) => {
            const selectedHour = parseInt(e.target.value, 10);
            document.getElementById("time-label").textContent = `Time: ${selectedHour}:00`;
            const filteredGeojson = {
                type: "FeatureCollection",
                features: geojson.features.filter(f => {
                    const hour = new Date(f.properties["Time"]).getHours();
                    return hour === selectedHour;
                })
            };
            map.getSource("accidents").setData(filteredGeojson);
        });
    });
});
