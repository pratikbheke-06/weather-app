const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const conditionIcon = document.getElementById('conditionIcon');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const feelsLike = document.getElementById('feelsLike');
const pressure = document.getElementById('pressure');
const statusMessage = document.getElementById('statusMessage');

let lastRequestId = 0;

function setStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`.trim();
}

function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? 'Loading...' : 'Search';
}

function getWeatherCondition(temp) {
  if (temp >= 28) return 'Hot';
  if (temp >= 18) return 'Warm';
  if (temp >= 10) return 'Mild';
  if (temp >= 0) return 'Cool';
  return 'Cold';
}

function getWeatherIcon(temp, windSpeed, humidity) {
  if (humidity > 80 || windSpeed > 25) return '🌧️';
  if (temp >= 28) return '☀️';
  if (temp <= 0) return '❄️';
  return '⛅';
}

function updateWeatherData(data) {
  cityName.textContent = data.city;
  temperature.textContent = data.temperature;
  condition.textContent = data.condition;
  conditionIcon.textContent = data.icon;
  humidity.textContent = data.humidity;
  wind.textContent = data.wind;
  feelsLike.textContent = data.feelsLike;
  pressure.textContent = data.pressure;
}

async function fetchWeather(city) {
  const query = city.trim();

  if (!query) {
    setStatus('Please enter a city name.', 'error');
    return;
  }

  const requestId = ++lastRequestId;
  setLoading(true);
  setStatus('Fetching weather data...', '');

  try {
    const geocodeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );

    if (!geocodeResponse.ok) {
      throw new Error('Unable to locate the city.');
    }

    const geocodeData = await geocodeResponse.json();
    const place = geocodeData.results?.[0];

    if (!place) {
      throw new Error('No matching city found. Try another city.');
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m&timezone=auto`
    );

    if (!weatherResponse.ok) {
      throw new Error('Weather data is currently unavailable.');
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    const weatherInfo = {
      city: `${place.name}${place.country ? `, ${place.country}` : ''}`,
      temperature: `${Math.round(current.temperature_2m)}°C`,
      condition: getWeatherCondition(current.temperature_2m),
      icon: getWeatherIcon(current.temperature_2m, current.wind_speed_10m, current.relative_humidity_2m),
      humidity: `${Math.round(current.relative_humidity_2m)}%`,
      wind: `${Math.round(current.wind_speed_10m)} km/h`,
      feelsLike: `${Math.round(current.apparent_temperature)}°C`,
      pressure: `${Math.round(current.pressure_msl)} hPa`,
    };

    updateWeatherData(weatherInfo);
    setStatus(`Weather updated for ${weatherInfo.city}.`, 'success');
  } catch (error) {
    if (requestId === lastRequestId) {
      setStatus(error.message || 'Something went wrong.', 'error');
    }
  } finally {
    if (requestId === lastRequestId) {
      setLoading(false);
    }
  }
}

searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));

cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    fetchWeather(cityInput.value);
  }
});

fetchWeather(cityInput.value);
