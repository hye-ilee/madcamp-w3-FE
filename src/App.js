import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
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
  const [activeCategories, setActiveCategories] = useState([]);
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
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(styles[currentStyleIndex]);
    map.current.setProjection(projs[currentProjectionIndex]);
  }, [currentProjectionIndex, currentStyleIndex]);

  useEffect(() => {
    updateMarkers();
  }, [activeCategories]);


  const handleLandingClick = (e) => {
    e.stopPropagation();
    setIsLandingVisible(false);
  };

  const fetchCategoryData = async (activeCategories) => {
    const limit = 20; //카테고리 당 개수
    let url = '';
    if (activeCategories.includes('all')) {
      const total = limit * (categories.length - 1);
      url = `http://172.10.7.20:8000/api/news/news_geojson/?limit=${total}`;
    } else {
      const total = limit * activeCategories.length;
      const categoryQuery = activeCategories.map((cat) => `category=${cat}`).join('&');
      url = `http://172.10.7.20:8000/api/news/news_geojson/?${categoryQuery}&limit=${total}`;
    }
  
    try {
      console.log('fetching data from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Fetched data:', data);
      return data.features; // GeoJSON 형태의 features 반환
    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    }
  };

  const updateMarkers = async () => {
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    console.log('removed all prev markers, Active Categories:', activeCategories);
    if (activeCategories.length === 0) {
      console.log('No markers');
      return;
    }
    const featuresList = await fetchCategoryData(activeCategories);

    const coloredFeatures = featuresList.map((feature) => {
      if (activeCategories.includes('all')) {
        const allCat = categories.find((cat) => cat.id === 'all');
        return { ...feature, color: allCat.color };
      }
      const foundCat = categories.find(
        (cat) => activeCategories.includes(cat.id) && cat.id === feature.properties.category
      );
      if (foundCat) {
        return { ...feature, color: foundCat.color };
      } 
      return feature;
    });
    const newMarkers = coloredFeatures.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return new mapboxgl.Marker({ color: feature.color, scale: 1.2 })
        .setLngLat([lng, lat])
        .addTo(map.current);
    });
    setMarkers(newMarkers);
  };    

  const handleCatClick = async (id) => {
    setActiveCategories((prev) => {
      if(id === 'all') {
        if (prev.includes('all')) {
          const next = prev.filter((cat) => cat !== 'all');
          console.log('ALL OFF =>', next);
          return next;
        } else {
          return ['all'];
        }
      }
      //그외 카테고리
      if (prev.includes(id)) {
        console.log('was on: ', id);
        const filtered = prev.filter((cat) => cat !== id);
        console.log('TOGGLE OFF =>', filtered);
        return filtered.length ? filtered : [];
      } else {
        const next = [...prev.filter((cat) => cat !== 'all'), id];
        console.log('TOGGLE ON =>', next);
        return next;
      }
    });
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
