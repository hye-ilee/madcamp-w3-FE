import React from 'react';

const CategoryButtons = ({ categories, activeCategories, setActiveCategories }) => {
  const handleCatClick = (id) => {
    setActiveCategories((prev) => {
      if (id === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      return prev.includes(id)
        ? prev.filter((cat) => cat !== id && cat !== 'all')
        : [...prev.filter((cat) => cat !== 'all'), id];
    });
  };

  return (
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
  );
};

export default CategoryButtons;
