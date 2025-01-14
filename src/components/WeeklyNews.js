import React, { useState, useEffect } from 'react';

const WeeklyNews = ({ apiUrl, fetchInterval = 30000 }) => {
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch weekly summary');
        const data = await response.json();
        const newWeekly = data.combined_summaries.split('\n\n');
        setWeekly((prev) => [...prev, ...newWeekly]); // 기존에 추가
      } catch (error) {
        console.error('Error fetching weekly summary:', error);
      }
    };

    fetchWeekly();

    // 주기적으로 새로 요청
    const interval = setInterval(fetchWeekly, fetchInterval);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [apiUrl, fetchInterval]);

  return (
    <div className="weekly-container">
      <div className="weekly-news">
        {weekly.map((single, index) => (
          <span key={index} style={{ marginRight: '50px' }}>
            {single} •
          </span>
        ))}
      </div>
    </div>
  );
};

export default WeeklyNews;
