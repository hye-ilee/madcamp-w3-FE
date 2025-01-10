import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiaGFycmlsZWUiLCJhIjoiY201cDE2Y2xuMGY5ZDJsb2tuanMzZnFkYSJ9.lyj7U89xkzXFnwu0Z-ojZQ';

const App = () => {
  const mapContainer = useRef(null); // 맵 컨테이너 참조
  const map = useRef(null); // 맵 객체 참조
  const [currentProjectionIndex, setCurrentProjectionIndex] = useState(1);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);

  const projs = ['mercator', 'globe'];
  const styles = [
    'mapbox://styles/mapbox/standard',
    'mapbox://styles/mapbox/standard-satellite',
    'mapbox://styles/mapbox/dark-v11',
    'mapbox://styles/mapbox/navigation-night-v1',
  ];

  useEffect(() => {
    if (map.current) return; // 맵이 이미 초기화된 경우 방지
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styles[currentStyleIndex],
      center: [162.18183, 29.840607],
      zoom: 1.7,
      projection: projs[currentProjectionIndex],
    });
  }, [currentProjectionIndex, currentStyleIndex]);

  const chooseProjection = () => {
    const nextIndex = (currentProjectionIndex + 1) % projs.length;
    setCurrentProjectionIndex(nextIndex);
    map.current.setProjection(projs[nextIndex]);
    alert(`Switched to ${projs[nextIndex]} projection`);
  };

  const chooseStyle = (event) => {
    const selectedIndex = parseInt(event.target.value, 10);
    setCurrentStyleIndex(selectedIndex);
    map.current.setStyle(styles[selectedIndex]);
  };

  return (
    <div>
      <div id="projControl">
        <button onClick={chooseProjection}>Switch Projection</button>
      </div>
      <div id="styleControl">
        <select id="styleDropdown" onChange={chooseStyle}>
          <option value="0">Standard</option>
          <option value="1">Satellite</option>
          <option value="2">Dark</option>
          <option value="3">Navigation</option>
        </select>
      </div>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default App;
