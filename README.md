# Weather App

Weather Application for tracking current weather in searched city. Built for practice and learning.

## Features
- weather search by city name
- auto-detect location via browser geolocation
- refresh current location without re-searching
- current temperature, "feels like", humidity, wind and pressure
- 5-day forecast containing min/max temp
- dark theme, responsive layout

## Technologies
- **HTML5** - semantics
- **CSS** - Flexbox, Grid, CSS-variables, responsive design (`auto-fit` / `minmax`)
- **JavaScript** - async/await, Fetch API, Geolocation API
- **Open-Meteo API** - free API no-key needed

## What was implemented?
- work with asynchronous code using `async/await` and `try/catch` for error handling
- making request to two different API endpoints with sequential processing
- work with the browser's geolocation API
- keeping application state in a variable (last location) to power the refresh button
- date formatting with locale support
- responsive layout

## How to launch?
```bash
git clone https://github.com/kwewk/weather-app.git
cd weather-app
python -m http.server 8000
```

Then open `http://localhost:8000` in the browser.

**Important:** For geolocation to work, the page must be opened via `http://` or `https://`, not `file://`. Use `live-server` or any other simple server.

## Plans for future
- [ ] dynamic background that changes with weather conditions
- [ ] save last 5 searches to localStorage
- [ ] favorite cities list
- [ ] temperature chart using Chart.js
- [ ] °C / °F toggle
- [ ] dark/light theme
- [ ] port to TypeScript
- [ ] unit test coverage (Vitest)