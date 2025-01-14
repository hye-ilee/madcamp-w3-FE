import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { rgba } from 'polished';
import './App.css';

import CategoryButtons from './components/CategoryButtons';
import Markers from './components/Markers';
import NewsList from './components/NewsList';
import WeeklyNews from './components/WeeklyNews';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const projs = ['mercator', 'globe'];
const styles = [
  // 'mapbox://styles/mapbox/standard',
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
  const [isListVisible, setIsListVisible] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const coordsDict = useRef({});
  const markerDict = useRef({});
  const allPopups = useRef([]);

  useEffect(() => {
    if (map.current) return; //이미 초기화된 경우 방지지
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styles[currentStyleIndex],
      center: [162.18183, 29.840607],
      zoom: 1.7,
      projection: projs[currentProjectionIndex],
    });
  }, []);

  useEffect(() => {
    if (!map.current || !isLandingVisible) return;
    let userInteracting = false;
    let speed = 360 / 160;// 몇초에 1바퀴

    function stopGradually() {
      const stopInterval = setInterval(() => {
        speed *= 0.8;
        if (speed < 0.01) {
          clearInterval(stopInterval); //매우 느려지면 멈춤
          speed = 0;
        }
      }, 200); // 100ms마다 감소
    }

    function spinGlobe() {
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < 4) {
        if (zoom > 2) {
          const zoomDif = (4 - zoom) / (4 - 2);
          speed *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= speed;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    const onMouseDown = () => {userInteracting = true; stopGradually();};
    const onDragStart = () => {userInteracting = true; stopGradually();};
    const onMoveEnd = () => {if(!userInteracting) spinGlobe();};
    map.current.on('mousedown', onMouseDown);
    map.current.on('dragstart', onDragStart);
    map.current.on('moveend', onMoveEnd);

    spinGlobe();
    // Cleanup: 컴포넌트 언마운트 시 이벤트 제거
    return () => {
      map.current.off('mousedown', onMouseDown);
      map.current.off('dragstart', onDragStart);
      map.current.off('moveend', onMoveEnd);
    };
  }, [isLandingVisible]);

  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(styles[currentStyleIndex]);
    map.current.setProjection(projs[currentProjectionIndex]);
  }, [currentProjectionIndex, currentStyleIndex]);

  const handleLandingClick = (e) => {
    e.stopPropagation();
    setIsLandingVisible(false);
  };

  const handleProjClick = (e) => {
    e.stopPropagation();
    setCurrentProjectionIndex((prev) => (prev + 1) % projs.length);
  };
  
  const handleStyleChange = (e) => {
    e.stopPropagation();
    setCurrentStyleIndex(parseInt(e.target.value, 10));
  };

  const handleHomeClick = (e) => {
    e.stopPropagation();
    map.current.flyTo({ center: [162.18183, 29.840607], zoom: 1.7, duration: 1500, bearing: 0, pitch: 0, duration: 1000 });
    allPopups.current.forEach((popup) => {
      popup.remove();
    });
  };

  const fetchCategoryData = useCallback(async (activeCategories) => {
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
  }, []);

  return (
    <div>
      {isLandingVisible && (
        <div className="landing" onClick={handleLandingClick}>
          <h1>
            <span>Global news at a Glance,</span> <br />
            <span style={{ fontSize: '120px', fontWeight: 'bold' }}>Globance</span>
          </h1>
        </div>
      )}
      <div id="projControl">
        <button onClick={handleProjClick}>Switch Projection</button>
      </div>
      <div id="styleControl">
        <select id="styleDropdown" onChange={handleStyleChange}>
          {/* <option value="0">Standard</option> */}
          <option value="0">Satellite</option>
          <option value="1">Dark</option>
          <option value="2">Navigation</option>
        </select>
      </div>
      <div>
        <button className="homeIcon" onClick={handleHomeClick}>
          <i className="material-icons">home</i></button>
      </div>
      <CategoryButtons 
        categories={categories} 
        activeCategories={activeCategories} 
        setActiveCategories={setActiveCategories} 
      />
      <Markers 
        map={map} 
        categories={categories}
        activeCategories={activeCategories} 
        fetchCategoryData={fetchCategoryData}
        markers={markers} 
        setMarkers={setMarkers} 
        coordsDict={coordsDict}
        markerDict={markerDict}
        allPopups={allPopups}
      />
      <NewsList 
        newsList={newsList}
        setNewsList={setNewsList} 
        isListVisible={isListVisible} 
        setIsListVisible={setIsListVisible} 
        map={map} 
        activeCategories={activeCategories}
        fetchCategoryData={fetchCategoryData}
        markerDict={markerDict} 
        allPopups={allPopups} 
      />
      <WeeklyNews
        apiUrl="http://172.10.7.20:8000/api/news/weekly_news/?limit=10"
      />
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default App;
