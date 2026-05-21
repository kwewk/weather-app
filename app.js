const form = document.getElementById('searchForm');
const input = document.getElementById('cityInput');
const geoBtn = document.getElementById('geoBtn');
const refreshBtn = document.getElementById('refreshBtn');
const msg = document.getElementById('message');
const currentBlock = document.getElementById('currentWeather');
const forecastBlock = document.getElementById('forecast');

const cityNameEl = document.getElementById('cityName');
const dateEl = document.getElementById('currentDate');
const iconEl = document.getElementById('currentIcon');
const tempEl = document.getElementById('tempValue');
const descEl = document.getElementById('weatherDescription');
const feelsEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('windSpeed');
const pressureEl = document.getElementById('pressure');
const forecastList = document.getElementById('forecastList');

let lastLocation = null;
const STORAGE_KEY = "currentLocation";

const codes = {
    0:  ['clear sky', '☀️', 'sunny'],
    1:  ['mainly clear', '🌤️', 'sunny'],
    2:  ['partly cloudy', '⛅', 'cloudy'],
    3:  ['overcast', '☁️', 'cloudy'],
    45: ['fog', '🌫️', 'cloudy'],
    48: ['rime fog', '🌫️', 'cloudy'],
    51: ['light drizzle', '🌦️', 'rainy'],
    53: ['drizzle', '🌦️', 'rainy'],
    55: ['heavy drizzle', '🌧️', 'rainy'],
    61: ['light rain', '🌦️', 'rainy'],
    63: ['rain', '🌧️', 'rainy'],
    65: ['heavy rain', '🌧️', 'rainy'],
    71: ['light snow', '🌨️', 'snowy'],
    73: ['snow', '❄️', 'snowy'],
    75: ['heavy snow', '❄️', 'snowy'],
    77: ['snow grains', '❄️', 'snowy'],
    80: ['light showers', '🌦️', 'rainy'],
    81: ['showers', '🌧️', 'rainy'],
    82: ['heavy showers', '⛈️', 'rainy'],
    85: ['snow showers', '🌨️', 'snowy'],
    86: ['heavy snow showers', '❄️', 'snowy'],
    95: ['thunderstorm', '⛈️', 'stormy'],
    96: ['thunderstorm with hail', '⛈️', 'stormy'],
    99: ['heavy thunderstorm', '⛈️', 'stormy'],
};

function showMsg(text, error = false) {
    msg.textContent = text;
    msg.classList.remove('hidden');
    if (error) msg.classList.add('error');
    else msg.classList.remove('error');
}

function hideMsg() {
    msg.classList.add('hidden');
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

function shortDay(d) {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
}

async function getCoords(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (!data.results || !data.results.length) {
        throw new Error(`City "${city}" not found`);
    }
    return data.results[0];
}

async function getWeather(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        wind_speed_unit: 'ms',
        forecast_days: 6,
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error('Failed to load weather data');
    return res.json();
}

async function reverseGeocoding (lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
    })
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
        if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);
        const data = await res.json();
        const cityOrLocality = data.city || data.locality || '';
        const country = data.countryName || '';
        const label = [cityOrLocality, country].filter(Boolean).join(', ');
        return label;
    }
    catch (err) {
        console.error(err);
        return 'Your location';
    }
}

function renderCurrent(data, name) {
    const cur = data.current;
    const code = cur.weather_code;
    const info = codes[code] || ['unknown', '❓', 'cloudy'];

    cityNameEl.textContent = name;
    dateEl.textContent = formatDate(new Date());
    iconEl.textContent = info[1];
    tempEl.textContent = Math.round(cur.temperature_2m);
    descEl.textContent = info[0];
    feelsEl.textContent = Math.round(cur.apparent_temperature) + '°';
    humidityEl.textContent = cur.relative_humidity_2m + '%';
    windEl.textContent = Math.round(cur.wind_speed_10m) + ' m/s';
    pressureEl.textContent = Math.round(cur.surface_pressure) + ' hPa';

    currentBlock.classList.remove('hidden');
}

function renderForecast(data) {
    const daily = data.daily;
    forecastList.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const code = daily.weather_code[i];
        const info = codes[code] || ['unknown', '❓'];

        const card = document.createElement('div');
        card.className = 'forecast-item';
        card.innerHTML = `
      <div class="forecast-day">${shortDay(daily.time[i])}</div>
      <div class="forecast-icon">${info[1]}</div>
      <div class="forecast-temps">
        <span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°</span>
        <span class="temp-min">${Math.round(daily.temperature_2m_min[i])}°</span>
      </div>
    `;
        forecastList.appendChild(card);
    }

    forecastBlock.classList.remove('hidden');
}

async function loadByCoords(lat, lon, name) {
    try {
        showMsg('Loading weather...');
        const data = await getWeather(lat, lon);
        hideMsg();
        renderCurrent(data, name);
        renderForecast(data);
        lastLocation = {lat, lon, name};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lastLocation));
    } catch (err) {
        console.error(err);
        showMsg(err.message || 'Something went wrong', true);
        currentBlock.classList.add('hidden');
        forecastBlock.classList.add('hidden');
    }
}

async function searchCity(city) {
    if (!city.trim()) return;
    try {
        showMsg('Searching...');
        const loc = await getCoords(city.trim());
        const fullName = `${loc.name}, ${loc.country}`;
        await loadByCoords(loc.latitude, loc.longitude, fullName);
    } catch (err) {
        console.error(err);
        showMsg(err.message || 'Could not find city', true);
        currentBlock.classList.add('hidden');
        forecastBlock.classList.add('hidden');
    }
}

function useGeo() {
    if (!navigator.geolocation) {
        showMsg('Geolocation is not supported', true);
        return;
    }

    showMsg('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            let reversedLocation = await reverseGeocoding(latitude, longitude);
            await loadByCoords(latitude, longitude, reversedLocation);
        },
        (err) => {
            console.error(err);
            let text = 'Could not detect location';
            if (err.code === err.PERMISSION_DENIED) {
                text = 'Location access denied';
            }
            showMsg(text, true);
        }
    );
}

async function refreshWeather() {
    if (lastLocation) {
        await loadByCoords(lastLocation.lat, lastLocation.lon, lastLocation.name);
    }
    else {
        showMsg('Search for a city first.');
        setTimeout(hideMsg, 5000);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    searchCity(input.value);
});

geoBtn.addEventListener('click', useGeo);

refreshBtn.addEventListener('click', refreshWeather);

const sk = localStorage.getItem(STORAGE_KEY);

if (sk !== null) {
    try {
        const obj = JSON.parse(sk);
        loadByCoords(obj.lat, obj.lon, obj.name);
    }
    catch (err) {
        console.error(err);
        showMsg('Saved location is corrupted, please search again', true);
    }
} else {
    showMsg('A simple pet project "Weather App" by kwewk')
}