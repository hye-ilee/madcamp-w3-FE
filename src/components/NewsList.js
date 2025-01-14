import React, {useEffect} from 'react';

const NewsList = ({ newsList, setNewsList, isListVisible, setIsListVisible, map, activeCategories, fetchCategoryData, markerDict, allPopups }) => {
    useEffect(() => {
        const fetchData = async () => {
            if (activeCategories.length === 0) {
                setNewsList([]);
                return;
            }
            try {
                const data = await fetchCategoryData(activeCategories);
                setNewsList(data);
            } catch (error) {
                console.error('Error fetching category data:', error);
            }
        };
        fetchData();
    }, [activeCategories, fetchCategoryData, setNewsList]);
    
  const handleListToggle = () => setIsListVisible((prev) => !prev);

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
    <div className="newsIcon">
        <button className="newsIcon" onClick={handleListToggle}><i className="material-icons">menu</i></button>
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
  );
};

export default NewsList;