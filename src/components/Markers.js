import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

const Markers = ({ map, categories, activeCategories, fetchCategoryData, markers, setMarkers, coordsDict, markerDict, allPopups }) => {
  useEffect(() => {
    const updateMarkers = async () => {
      markers.forEach((marker) => marker.remove());
      setMarkers([]);

      if (activeCategories.length === 0) return;

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
        circle.style.width = `${imp}px`;
        circle.style.height = `${imp}px`;
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = feature.color;

        const coordKey = feature.geometry.coordinates.join(',');
        const popupHtml = `
          <div style="min-width:150px;">
            ${coordsDict.current[coordKey]
              .slice(0, 2).map((feat) => `
                <h3 style="margin:5px 0;">${feat.properties.title}</h3>
                <a href="${feat.properties.url}" target="_blank" rel="noopener noreferrer">Go to link</a>
              `).join('<hr />')}
            ${coordsDict.current[coordKey].length > 2
                ? `<button style="margin-top:5px;" onclick="window.showLongPopup('${coordKey}')">View all issues in this area</button>`
                : ''
            }
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 8 }).setHTML(popupHtml);
        const marker = new mapboxgl.Marker({ element: circle })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);
        
        markerDict.current[`${lng.toFixed(5)},${lat.toFixed(5)}`] = {marker, popup};
        allPopups.current.push(popup);
        return marker;
      });
      setMarkers(newMarkers);
    };

    updateMarkers();
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
  }, [activeCategories, map, setMarkers]);

  return null;
};

export default Markers;