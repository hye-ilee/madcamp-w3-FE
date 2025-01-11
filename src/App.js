import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { rgba } from 'polished';
import './App.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const projs = ['mercator', 'globe'];
const styles = [
  'mapbox://styles/mapbox/standard',
  'mapbox://styles/mapbox/standard-satellite',
  'mapbox://styles/mapbox/dark-v11',
  'mapbox://styles/mapbox/navigation-night-v1',
];

const categories = [
  { id: 'all', name: 'All', color: rgba(210, 101, 97, 0.7) },
  { id: 'general', name: 'General', color: rgba(73, 151, 180, 0.7)  },
  { id: 'business', name: 'Business', color: rgba(218, 138, 84, 0.7) },
  { id: 'health', name: 'Health', color: rgba(82, 153, 82, 0.7) },
  { id: 'science', name: 'Science', color: rgba(153, 73, 180, 0.7) },
  { id: 'technology', name: 'Technology', color: rgba(223, 151, 199, 0.7) },
  { id: 'sports', name: 'Sports', color: rgba(221, 200, 80, 0.7) },
  { id: 'entertainment', name: 'Entertainment', color: rgba(65, 83, 200, 0.7) },
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
    const limit = 20;
    let url = '';
    if (activeCategories.includes('all')) {
      const total = limit * (categories.length - 1);
      url = `http://172.10.7.20:8000/api/news/news_geojson/?limit=${total}`;
    } else {
      const categoryQuery = activeCategories.map((cat) => `category=${cat}`).join('&');
      console.log('categoryQuery:', categoryQuery);
      url = `http://172.10.7.20:8000/api/news/news_geojson/?${categoryQuery}&limit=${limit}`; //카테고리 당 limit개
    }
  
    try {
      console.log('fetching data from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Fetched data:', data);
      return data.features; //GeoJSON 형태의 features 반환
    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    }
  };

  const updateMarkers = async () => {
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    if (activeCategories.length === 0) {
      console.log('No markers');
      return;
    }
    const featuresList = await fetchCategoryData(activeCategories);
    console.log('Fetched featuresList:', featuresList);
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
    
    const coordsDict = coloredFeatures.reduce((acc, feature) => {
      const coordKey = feature.geometry.coordinates?.join(',');
      if (!acc[coordKey]) {
        acc[coordKey] = [];
      }
      acc[coordKey].push(feature);
      return acc;
    }, {});

    const newMarkers = coloredFeatures.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const circle = document.createElement('div');
      const imp = feature.properties.importance;
      circle.className = 'myMarker';
      circle.style.width = imp + 'px';
      circle.style.height = imp + 'px';
      circle.style.borderRadius = '50%';
      circle.style.backgroundColor = feature.color;

      const coordKey = feature.geometry.coordinates?.join(',');
      const popupHtml = `
        <div style="min-width:150px;">
          ${Object.values(coordsDict[coordKey]).map((feat) => `
            <h3 style="margin:5px 0;">${feat.properties.title}</h3>
            <a href="${feat.properties.url}" target="_blank" rel="noopener noreferrer">Go to link</a>
          `).join('<hr />')}
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 8 }).setHTML(popupHtml);
        
      const marker = new mapboxgl.Marker({ element: circle })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);
      return marker;
    });
    setMarkers(newMarkers);
  };

  const handleCatClick = async (id) => {
    setActiveCategories((prev) => {
      if(id === 'all') {
        if (prev.includes('all')) {
          return prev.filter((cat) => cat !== 'all');
        } else {
          return ['all'];
        }
      }
      //그외 카테고리
      if (prev.includes(id)) {
        const filtered = prev.filter((cat) => cat !== id);
        return filtered.length ? filtered : [];
      } else {
        return [...prev.filter((cat) => cat !== 'all'), id];
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
