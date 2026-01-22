class WeatherService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.generalData = 'https://api.openweathermap.org/data/2.5/weather';
        this.forecastData = 'https://api.openweathermap.org/data/2.5/onecall';
        this.units = 'imperial';
        this.geolocationButton = document.querySelector('#geolocation-button');
        this.cities;
    }

    async byName(location) {
        return await axios.get(
            `${this.generalData}?q=${location}&appid=${this.apiKey}&units=${this.units}`
        );
    }

    async fetchDailyForecast(coordinates) {
        const response = await axios.get(
            `${this.forecastData}?lat=${coordinates.lat}&lon=${coordinates.lon}&exclude=minutely,hourly,alerts&appid=${this.apiKey}&units=${this.units}`
        );
        dailyWeather.displayForecast(response);
    }

    async byGeolocation(location) {
        const { latitude: lat, longitude: lon } = location.coords;
        const response = await axios.get(
            `${this.generalData}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.units}`
        );
        selectedLocationWeather.displayCurrentTemperature(response);
    }

    displaySelectedLocationWeather(location) {
		this.byName(location).then(response =>
			selectedLocationWeather.displayCurrentTemperature(response)
		);
	}

    initializeGeolocation() {

        if (!this.geolocationButton) {
            console.warn("Button not found");
            return;
        }
		this.geolocationButton.addEventListener('click', () => {
			navigator.geolocation.getCurrentPosition(this.byGeolocation.bind(this));
		});
	}

    fetchCityList() {
        fetch('/json/cities.json')
            .then(response => response.json())
            .then(data => {
                this.cities = data; 
            });
    }

    getSavedLocation() {
		const userLocation = localStorage.getItem('location');
		if (userLocation) {
			this.displaySelectedLocationWeather(userLocation);
		} else {
			this.displaySelectedLocationWeather('New York');
		}
	}

    async renderIcons(location, dataId, dataIcon, imgEl) {
		const response = await axios.get('/json/icons.json');
		const customIcons = response.data;

		const iconMatch = customIcons.find(icon => icon.id === dataId && icon.icon === dataIcon);

		if (iconMatch) {
			const icon = location.querySelector(imgEl);
			icon.setAttribute('src', iconMatch.src);
			icon.setAttribute('alt', iconMatch.alt);
		}
	}
}


const themeManager = {
	body: document.querySelector('body'),
	themeToggle: document.querySelector('#flexSwitchCheckChecked'),

	initialize: function () {
		this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
		this.getSavedTheme();
	},

	toggleTheme: function () {
		this.body.classList.toggle('dark');
		localStorage.setItem('theme', this.body.classList.contains('dark') ? 'dark' : 'light');
	},

	getSavedTheme: function () {
		const userTheme = localStorage.getItem('theme');
		if (userTheme === 'dark') {
			this.themeToggle.click();
		}
	},
};


const searchManager = {
    suggestionsList: document.querySelector('.serach-suggestions'),
    searchBtn: document.querySelector('.search-form'),
    searchInput: document.querySelector('#search-input'),

    initialize: function () {
        this.searchBtn.addEventListener('submit', this.submitCity.bind(this));
        this.searchInput.addEventListener('keyup', this.typeInput.bind(this));
        document.addEventListener('click', this.clickOutsideInput.bind(this));

    },

    submitCity: function (event) {
        event.preventDefault();
        const searchInputValue = this.searchInput.ariaValueMax;
        if (searchInputValue) {
            weatherService.displaySelectedLocationWeather(searchInputValue);
        }
    },

    typeInput: function () {
        const inputText = this.searchInput.value.trim();
        this.clearSuggestions();

        if (inputText.length > 0) {
            let suggestions = weatherService.cities.filter(city =>
                city.name.toLowerCase().startsWith(inputText.toLowerCase()))
                .slice(0, 5);
            this.showSuggestions(suggestions);
        }
    },

    clickOutsideInput: function (event) {
        if (!this.searchBtn.contains(event.target)) {
            this.clearSuggestions();
        }   
    },

    showSuggestions: function (suggestions) {
        suggestions.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city.name;
            this.suggestionsList.appendChild(li);
            this.suggestionsList.style.opacity = '1';

            li.addEventListener('click', () => {
                li.textContent;
                weatherService.displaySelectedLocationWeather(li.textContent);
            });
        });
    },

    clearSuggestions: function () {
        this.suggestionsList.innerHTML = '';
        this.suggestionsList.style.opacity = '0';
    },
};

const timeManager = {
    convertUnixToTime: function (unixTimestamp, timezoneOffset) {
        const date = new Date();
        const timestamp = unixTimestamp;
        const offset = date.getTimezoneOffset() * 60_000;
        const utc = timestamp * 1000 + offset;
        const convertDateObj = new Date(utc + timezoneOffset * 1000);
        return convertDateObj;
    },

    formatTime: function (obj,options,method) {
        if(method === 'toLocaleTimeString') {
            return obj.toLocaleTimeString('en-US', options);
        } else if(method === 'toLocaleDateString') {
            return obj.toLocaleDateString('en-US', options);
        }
    },

    formatDay: function (unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        const day = date.getDay();
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return daysOfWeek[day];
    },

    printLocalDate: function(data, dateObject) {
        const localDateString = this.formatDate(
            this.convertUnixToTime(dateObject, data.timezone),
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            'toLocaleDateString'
        );

        const localTimeString = this.convertUnixToTime(dateObject, data.timezone).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const todaysDate = document.querySelector('#today');
        todaysDate.innerHTML = `${localDateString} at ${localTimeString}`;
    },

    displaySunserSunriseTime: function(data, localDateObject, sunriseTime, sunsetTime) {
        const sunrise = document.querySelector('#sunrise');
        const sunset = document.querySelector('#sunset');

        sunrise.innerHTML = this.formatTime(
            this.convertUnixToTimezone(sunriseTime, data.timezone),
            { hour: '2-digit', minute: '2-digit', hour12: true },
            'toLocaleTimeString'
        );

        sunset.innerHTML = this.formatTime(
            this.convertUnixToTimezone(sunsetTime, data.timezone),
            { hour: '2-digit', minute: '2-digit', hour12: true },
            'toLocaleTimeString'
        );

        this.changeSceneryImage(data, localDateObject, sunriseTime, sunsetTime);
    },

    changeSceneryImage: function(data, localDateObject, sunriseTime, sunsetTime) {
        const scenery = document.querySelector('#scenery');
        const sunriseHour = this.convertUnixToTimezone(sunriseTime, data.timezone).getHours();
        const sunsetHour = this.convertUnixToTimezone(sunsetTime, data.timezone).getHours();

        if (
            this.convertUnixToTimezone(localDateObject, data.timezone).getHours() < sunriseHour ||
            this.convertUnixToTimezone(localDateObject, data.timezone).getHours() >= sunsetHour
        ) {
            scenery.src='/assets/night-landscape.png';
            scenery.setAttribute('alt', 'night scenery with moon and stars');
        } else {
            scenery.src='/assets/day-landscape.png';
            scenery.setAttribute('alt', 'daytime scenery with sun and blue sky');
        }

    },
};

const selectedLocationWeather = {
    locationHeading: document.querySelector('#location'),
    allTemps: document.querySelectorAll('#temp-now, .temps, .faded-temps'),
    fahrenheit: document.querySelectorAll('.fahrenheit'),
    celsius: document.querySelectorAll('.celsius'),
    windUnit: document.querySelector('#wind-unit'),
    currentTemp: document.querySelector('#temp-now'),
    highTemp: document.querySelector('#high-temp'),
    lowTemp: document.querySelector('#low-temp'),
    feelsLikeTemp: document.querySelector('#feels-like-temp'),
    tempDescription: document.querySelector('#temp-description'),
    wind: document.querySelector('#wind'),
    humidity: document.querySelector('#humidity'),
    visibility: document.querySelector('#visibility'),
    clouds: document.querySelector('#clouds'),
    conditionMsg: document.querySelector('#condition-msg'),

    initialize: function () {
        this.celsius.addEventListener('click', this.toggleTemp.bind(this));
    },

    toggleTemp: function (event) {
        event.preventDefault();
        if (weatherService.units === 'metric') {
            this.celsius.innerHTML = 'C';
            this.fahrenheit.forEach(el => (el.innerHTML = 'F'));
            this.windUnit.innerHTML = 'mph';
            weatherService.units = 'imperial';
        } else if (weatherService.units === 'imperial') {
            this.fahrenheit.innerHTML = 'F';
            this.celsius.forEach(el => (el.innerHTML = 'C'));
            this.windUnit.innerHTML = 'm/s';
            weatherService.units = 'metric';    
        }

        weatherService.displaySelectedLocationWeather(this.locationHeading.textContent);
        globalWeather.getGlobalTemps();
    },

    displayCurrentTemperature: function (response) {
        if (response.status === 200) {
            const data = response.data;

            this.displayWeatherDetails(data);
            this.displayWeatherConditions(data.weather[0].main);
            weatherService.renderIcons(
                document,
                data.weather[0].id,
                data.weather[0].icon,
                '.default-main-icon'
            );


            const localDateObject = new Date().getTime();
            timeManager.printLocalDate(data, localDateObject);

            const apiSunrise = data.sys.sunrise * 1000;
            const apiSunset = data.sys.sunset * 1000;
            timeManager.displaySunserSunriseTime(data, localDateObject, apiSunrise, apiSunset);

            localStorage.setItem('location', `${data.name}`);
        }
    },

    displayWeatherDetails: function (data) {
        this.locationHeading.innerHTML = `${data.name}, ${data.sys.country}`;
        this.currentTemp.innerHTML = `${Math.round(data.main.temp)}`;
        this.highTemp.innerHTML = `${Math.round(data.main.temp_max)}`;
        this.lowTemp.innerHTML = `${Math.round(data.main.temp_min)}`;
        this.feelsLikeTemp.innerHTML = `${Math.round(data.main.feels_like)}`;
        this.tempDescription.innerHTML = `${data.weather[0].description}`;
        this.wind.innerHTML = `${Math.round(data.wind.speed)}`;
        this.humidity.innerHTML = `${data.main.humidity}`;
        this.visibility.innerHTML = `${(data.visibility / 1000).toFixed(1)}`;
        this.clouds.innerHTML = `${data.clouds.all}`;
    },

    displayWeatherConditions: function (data) {
        const weatherType = data;

        switch (weatherType) {
            case 'Rain':
            case 'Drizzle':
            case 'Clouds':
                this.conditionMsg.innerHTML = 'Grab your umbrella! ☔️';
                break;
            case 'Thunderstorm':
            case 'Tornado':
                this.conditionMsg.innerHTML = 'Stay indoors and stay safe! ⚡️';
                break;  
            case 'Snow':
                this.conditionMsg.innerHTML = 'Bundle up, it\'s snowy outside! ❄️';
                break;
            case 'Clear':
                this.conditionMsg.innerHTML = 'It\'s a bright and sunny day! ☀️';
                break;
            case 'Mist':
            case 'Fog':
            case 'Haze':
                this.conditionMsg.innerHTML = 'Drive safely in the fog! 🌫️';    
                break;
            default:
                this.conditionMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Poor Air Quality`;
        }
    },
};  

const dailyWeather = {
    dewPoint: document.querySelectorAll('#dew-point'),
    forecastContainer: document.querySelector('.full-forecast'),

    displayForecast: function (response) {
        this.dewPoint.innerHTML = `${Math.round(response.data.current.dew_point)}`;
        const forecastData = response.data.daily;
        let forecastHTML = '';

        forecastData.forEach((day, index) => {
            if (index < 7) {
                forecastHTML += `
                <div class="daily m-2 m-md-0">
                    <p>${timeManager.formatDay(day.dt)}</p>
                        <img
                            src="/assets/loading.svg"
                            class="weather-icon forecasr-icon mb-2"
                            height="45"
                            width="50"
                            alt="Loading icon"
                            id="icon-${index}"
                        />
                    <p>
                        <span class="temps">${Math.round(day.temp.max)}</span>°<span class="fahrenheit">${weatherService.units === 'metric' ? 'C' : 'F'}</span>
                        
                        <br />
                        <span class="daily-low">
                            <span class"forecast-low temps">${Math.round(day.temp.min)}</span>°<span class="fahrenheit">${weatherService.units === 'metric' ? 'C' : 'F'}</span>
                            </span>
                            </span>
                        </p>
                    </div>`;
                        this.forecastContainer.innerHTML = forecastHTML;

                        weatherService.renderIcons(
                            this.forecastContainer,
                            day.weather[0].id,
                            day.weather[0].icon,
                            `#icon-${index}`
                        );  
                    }
                });
        },

    };

    const globalWeather = {
        globalContainer: document.querySelectorAll('.global-items-wrapper'),
        cityTemps: document.querySelectorAll('.global-temp'),
        cityWeatherDesc: document.querySelectorAll('.global-descriptions'),
        cityNames: document.querySelectorAll('.global-name'),
        countryNames: document.querySelectorAll('.country-name'),
        countryRows: document.querySelectorAll('.global-item'),
        randomCities: ['Tokyo', 'London', 'Sydney', 'Paris', 'Berlin', 'Moscow', 'Rio de Janeiro', 'Cape Town'].sort(() => Math.random() - 0.5),

        initialize: function () {
            this.globalContainer.addEventListener('click', this.updateWeatherData.bind(this));
            this.getGlobalTemps();
        },

        getGlobalTemps: function () {
            this.countryRows.forEach((item, i) => {
                weatherService.byName(this.randomCities[i]).then(response => this.displayGlobalTemps(response, i, item));

            });
        },

        displayGlobalTemps: function (response, i, item) {
            this.cityNames[i].innerHTML = `${response.data.name}`;
            this.countryNames[i].innerHTML = `${response.data.sys.country}`;
            this.cityTemps[i].innerHTML = `${Math.round(response.data.main.temp)}°`;
            this.cityWeatherDesc[i].innerHTML = `${response.data.weather[0].description}`;

            weatherService.renderIcons(
                item,
                response.data.weather[0].id,
                response.data.weather[0].icon,
                `.global-icon`
            );
        },

        updateWeatherData: function (event) {
            const clickE1 = event.target.closet('.global-item');
            const clickedCountry = clickE1.querySelector('.global-name').textContent;
            weatherService.displaySelectedLocationWeather(clickedCountry);
            window.scrollTo({
                top: 0,
                behavior: 'smooth',

            });
        },

    };


    const OPENWEATHER_KEY = 'API-KEY-HERE';
    const weatherService = new WeatherService(OPENWEATHER_KEY);

    weatherService.initializeGeolocation();
    weatherService.fetchCityList();
    weatherService.getSavedLocation();
    themeManager.initialize();
    searchManager.initialize();
    selectedLocationWeather.initialize();
    globalWeather.initialize();
    

    
