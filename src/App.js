import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
// mapboxgl.accessToken = 'pk.eyJ1IjoiaGFycmlsZWUiLCJhIjoiY201cDE2Y2xuMGY5ZDJsb2tuanMzZnFkYSJ9.lyj7U89xkzXFnwu0Z-ojZQ';
console.log('Mapbox Access Token:', process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);

const projs = ['mercator', 'globe'];
const styles = [
  'mapbox://styles/mapbox/standard',
  'mapbox://styles/mapbox/standard-satellite',
  'mapbox://styles/mapbox/dark-v11',
  'mapbox://styles/mapbox/navigation-night-v1',
];

const categories = [
  { id: 'all', name: 'All', color: '#D26561' },
  { id: 'general', name: 'General', color: '#4997B4' },
  { id: 'business', name: 'Business', color: '#DA8A54' },
  { id: 'health', name: 'Health', color: '#529952' },
  { id: 'science', name: 'Science', color: '#9949B4' },
  { id: 'technology', name: 'Technology', color: '#DF97C7' },
  { id: 'sports', name: 'Sports', color: '#DDC850' },
  { id: 'entertainment', name: 'Entertainment', color: '#4153C8' },
];

const App = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentProjectionIndex, setCurrentProjectionIndex] = useState(1);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [isLandingVisible, setIsLandingVisible] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['all']);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (map.current) return; //이미 초기화된 경우 방지
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styles[currentStyleIndex],
      center: [162.18183, 29.840607],
      zoom: 1.7,
      projection: projs[currentProjectionIndex],
    });

    map.current.on('load', () => {
      console.log('Map has loaded:', map.current);
      const marker1 = new mapboxgl.Marker()
        .setLngLat([127.359245, 36.373794]) // 마커 좌표
        .addTo(map.current); // 맵에 추가
      console.log('Marker1 added:', marker1);
    });
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(styles[currentStyleIndex]);
    map.current.setProjection(projs[currentProjectionIndex]);
    const features = fetchCategoryData('all');
    console.log('features:', features);
    // const loadAllMarkers = async () => {
    //   const features = await fetchCategoryData('all');
    //   addMarkersToMap(features, categories.find((cat) => cat.id === 'all').color);
    // };
    // loadAllMarkers();
    // map.current.on('load', () => {
    //   console.log('Map has loaded:', map.current);
    //   const marker1 = new mapboxgl.Marker()
    //     .setLngLat([127.359245, 36.373794]) // 마커 좌표
    //     .addTo(map.current); // 맵에 추가
    //   console.log('Marker1 added:', marker1);
    // });
  }, [currentProjectionIndex, currentStyleIndex]);

  const handleLandingClick = (e) => {
    e.stopPropagation();
    setIsLandingVisible(false);
  };

  const fetchCategoryData = async (category) => {
    const limit = 20;
    var url = '';
    if(category == 'all') {
      console.log('fetching all data');
      const total = limit * (categories.length-1);
      url = `http://172.10.7.20:8000/api/news/news_geojson/?limit=${total}`;
    } else {
      url = `http://172.10.7.20:8000/api/news/news_geojson/?category=${category}&limit=${limit}`;
    }
    try {
      console.log('fetching data from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      return data.features;
    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    }
  };

  const addMarkersToMap = (features, color) => {
    markers.forEach((marker) => marker.remove());// 이전 마커 제거
    const newMarkers = features.map((feature) => {
      // const [lng, lat] = [127.259839,37.166155];
      const [lng, lat] = feature.geometry.coordinates;
      console.log('$', lng, lat);
      const marker = new mapboxgl.Marker({ color, scale: 1.2,})
        .setLngLat([lng, lat])
        .addTo(map.current);
      return marker;
    });
    setMarkers(newMarkers);
  };

  const handleCatClick = async (id) => {
    if (id === 'all') {
      setActiveCategories(['all']);
      setMarkers([]);
    } else {
      console.log('why no marker');
      // 일반 버튼 클릭 시 "All" 버튼 비활성화
      setActiveCategories((prev) => {
        const updated = prev.includes(id)
          ? prev.filter((cat) => cat !== id) // 이미 활성화된 경우 비활성화
          : [...prev.filter((cat) => cat !== 'all'), id];
        return updated;
      });
    }
    const features = await fetchCategoryData(id);
    console.log('features:', features);
    addMarkersToMap(features, categories.find((cat) => cat.id === id).color);
  };

  return (
    <div>
      {isLandingVisible && (
        <div className={`landing ${!isLandingVisible ? 'hidden' : ''}`}
          onClick={handleLandingClick} >
          <h1>
          <span>Global news at a Glance,</span> <br />
          <span style={{ fontSize: '120px', fontWeight: 'bold'}}>Globance</span>
          </h1>
        </div>
      )}
      <div id="projControl">
        <button onClick={(e) => e.stopPropagation() || setCurrentProjectionIndex((prev) => (prev + 1) % projs.length)}>
          Switch Projection
        </button>
      </div>
      <div id="styleControl">
        <select
          id="styleDropdown"
          onChange={(e) => e.stopPropagation() || setCurrentStyleIndex(parseInt(e.target.value, 10))}
        >
          <option value="0">Standard</option>
          <option value="1">Satellite</option>
          <option value="2">Dark</option>
          <option value="3">Navigation</option>
        </select>
      </div>
      <div className="category-buttons">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-button ${activeCategories.includes(cat.id) ? 'active' : ''}`}
            style={{
              backgroundColor: activeCategories.includes(cat.id) ? cat.color : '#cccccc',
            }}
            onClick={() => handleCatClick(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default App;
