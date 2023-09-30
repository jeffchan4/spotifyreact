import React, { useState, useEffect, useCallback } from 'react';

function App() {
    
      
  const loginToSpotify = () => {
    // Redirect to your Flask /login route
    window.location.href = 'http://localhost:5000/login';
  };

  const [topArtists, setTopArtists] = useState([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState([]);
  const [timeRange, setTimeRange] = useState('long_term');

  const fetchTopArtists = useCallback(() => {
    // Fetch data from Flask endpoint for top artists
    const artistFetch = fetch(`/get_top_artists?time=${timeRange}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        // Ensure that data.items is an array
        if (Array.isArray(data.items)) {
          // Update the state with the fetched data
          setTopArtists(data.items);
        } else {
          console.error('Data.items is not an array:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching top artists:', error);
      });

    // Fetch data from Flask endpoint for upcoming concerts
    const concertFetch = new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Latitude:', position.coords.latitude);
          console.log('Longitude:', position.coords.longitude);
          const { latitude, longitude } = position.coords;

          // Send latitude and longitude to the Flask backend and fetch concerts
          fetch(`/get_concerts?time=${timeRange}&latitude=${latitude}&longitude=${longitude}`)
            .then((response) => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then((data) => {
              // Update the state with the fetched concert data
              setUpcomingConcerts(data);
              resolve(); // Resolve the promise when concert data is fetched
            })
            .catch((error) => {
              console.error('Error fetching concerts:', error);
              reject(error); // Reject the promise if there's an error
            });
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          reject(error); // Reject the promise if there's an error
        }
      );
    });

    // Wait for both artistFetch and concertFetch to complete
    Promise.all([artistFetch, concertFetch])
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        console.error('Error in fetchTopArtists:', error);
      });
  }, [timeRange]);

  useEffect(() => {
    // Call fetchTopArtists when the component mounts
    fetchTopArtists();
  }, [fetchTopArtists]);


  return (
    <div className="App">
    <h1>Spotify's Wrapped</h1>
    <div class='buttonwrapper'>
      <button onClick={loginToSpotify}>refresh access token</button>
      <button onClick={() => setTimeRange('short_term')}>Short Term</button>
      <button onClick={() => setTimeRange('medium_term')}>Medium Term</button>
      <button onClick={() => setTimeRange('long_term')}>Long Term</button>
    </div>
      <h2>Top Artists</h2>
      {topArtists.length > 0 ? (
        <ul>
          {topArtists.map((artist, index) => {
            const correspondingConcert = upcomingConcerts[index] || 'Loading events';
            return (
              <li key={artist.id}>
                <img
                  src={artist.images[0]['url']}
                  alt={artist.name}
                  style={{ width: '60px', height: '60px' }}
                />
                <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                  {artist.name}
                </a>
                <div>{correspondingConcert}</div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Loading top artists...</p>
      )}
    </div>
  );
}

export default App;
