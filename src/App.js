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
  const [isListVisible, setIsListVisible] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const coordsDict = useRef({});
  const markerDict = useRef({});
  const allPopups = useRef([]);

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

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCategoryData(activeCategories);
      setNewsList(data);
    };
    fetchData();
  }, [activeCategories]);

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

  const updateMarkers = async () => {//기존
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    allPopups.current = [];

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
    
    coordsDict.current = coloredFeatures.reduce((acc, feature) => {
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
      const popupHtml = Object.values(coordsDict.current[coordKey]).length <= 2 ? `
        <div style="min-width:150px;">
          ${Object.values(coordsDict.current[coordKey]).map((feat) => `
            <h3 style="margin:5px 0;">${feat.properties.title}</h3>
            <a href="${feat.properties.url}" target="_blank" rel="noopener noreferrer">Go to link</a>
          `).join('<hr />')}
        </div>
      ` : `
        <div style="min-width:150px;">
          ${Object.values(coordsDict.current[coordKey]).slice(0,2).map((feat) => `
            <h3 style="margin:5px 0;">${feat.properties.title}</h3>
            <a href="${feat.properties.url}" target="_blank" rel="noopener noreferrer">Go to link</a>
          `).join('<hr />')}
        </div>
        <button style="margin-top:5px;" onclick="window.showLongPopup('${coordKey}')">View all issues in this area</button>
      `;
      const popup = new mapboxgl.Popup({ offset: 8 }).setHTML(popupHtml);
      console.log('just popup:', popup);
      const marker = new mapboxgl.Marker({ element: circle })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);
      markerDict.current[`${lng.toFixed(5)},${lat.toFixed(5)}`] = {marker, popup};
      allPopups.current.push(popup);
      return marker;
    });
    setMarkers(newMarkers);
    console.log('Final markerDict:', markerDict.current);
  };

  window.showLongPopup = (coordKey) => {
    const features = coordsDict.current[coordKey]; // 해당 좌표의 모든 데이터
    const [lng, lat] = coordKey.split(',').map(Number);
  
    const longPopupHtml = `
      <div style="max-height: 300px; overflow-y: auto; min-width: 300px;">
        ${features.map((feat) => `
          <h3>${feat.properties.title}</h3>
          <p>${feat.properties.description}</p>
          <a href="${feat.properties.url}" target="_blank" rel="noopener noreferrer">Read more</a>
          <hr />
        `).join('')}
      </div>
    `;
  
    const longPopup = new mapboxgl.Popup({ offset: 8, maxWidth: '400px' })
      .setLngLat([lng, lat])
      .setHTML(longPopupHtml)
      .addTo(map.current);
      allPopups.current.push(longPopup);
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

  const handleListClick = async () => {
    setIsListVisible((prev) => !prev);
  };

  const handleFlyto = async (dest) => {
    const [lng, lat] = dest;
    const key = `${lng.toFixed(5)},${lat.toFixed(5)}`; //작은 따옴표 아니고 백틱
    allPopups.current.forEach((popup) => {
      if(popup !== markerDict.current[key].popup) {
        popup.remove();
      }
    });
    map.current.flyTo({ center: [lng, lat], zoom: 8, duration: 1500 });
    setTimeout(() => {
      if(markerDict.current[key] && !markerDict.current[key].popup.isOpen()) {
        markerDict.current[key].popup.addTo(map.current);
      }else {
        console.log('No popup found for key:', key);
      }
    }, 1500);
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
        <button onClick={handleProjClick}>
          Switch Projection
        </button>
      </div>
      <div id="styleControl">
        <select
          id="styleDropdown"
          onChange={handleStyleChange}
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
      <div className="newsIcon">
        <button className="newsIcon" onClick={handleListClick}><i className="material-icons">menu</i></button>
        {isListVisible && (
          <ul className="news-items">
            {newsList.map((item, index) => (
              <li key={index}>
                <div className="news-item-header" onClick={() => handleFlyto(item.geometry.coordinates)}>
                  <h3>{item.properties.title}</h3>
                  <p>{item.properties.description} #{item.properties.category}</p>
                  <a href={item.properties.url} target="_blank" rel="noopener noreferrer">Read more</a>
                </div>
                <div className="news-item-image">
                  {item.properties.preview_image ? (
                    <img src={item.properties.preview_image} alt={item.properties.title}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        display: 'block',
                      }}/>
                  ) : (
                    <div></div> /* placeholder */
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default App;
