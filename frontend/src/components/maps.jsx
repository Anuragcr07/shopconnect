import React, { useEffect } from 'react';
import L from 'leaflet'; 


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Maps = () => {
  useEffect(() => {
    // Check if the map container already exists and has a Leaflet map initialized
    // This prevents re-initializing the map if the component re-renders
    if (document.getElementById('map')._leaflet_id) {
      document.getElementById('map')._leaflet_id = undefined;
    }

    // Initialize the map
    const map = L.map('map').setView([48.8584, 2.2945], 13); // Eiffel Tower coordinates and zoom level

    // Add a tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker for the Eiffel Tower
    L.marker([48.8584, 2.2945])
      .addTo(map)
      .bindPopup('Eiffel Tower')
      .openPopup();

    // Cleanup function to remove the map when the component unmounts
    return () => {
      map.remove();
    };
  }, []); // Empty dependency array means this effect runs once after the initial render

  return (
    <div>
        <h2>Map Centered on Eiffel Tower</h2>
      <div>
        <div id="map" style={{ height: "400px", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default Maps;