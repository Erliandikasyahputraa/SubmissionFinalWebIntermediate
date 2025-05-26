import { map, tileLayer, Icon, icon, marker, popup } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
 
export default class Map {
  #zoom = 5;
  #map = null;
 
  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }
 
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
 
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  constructor(selector, options = {}) {
    if (!selector) {
      throw new Error('Map selector is required');
    }

    const container = document.querySelector(selector);
    if (!container) {
      throw new Error(`Map container not found for selector: ${selector}`);
    }

    // Wait for container to be properly mounted in DOM
    if (!container.offsetWidth || !container.offsetHeight) {
      throw new Error('Map container has no dimensions. Ensure the container is visible and has dimensions.');
    }

    this.#zoom = options.zoom ?? this.#zoom;

    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    });

    try {
      this.#map = map(container, {
        zoom: this.#zoom,
        scrollWheelZoom: false,
        layers: [tileOsm],
        ...options,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      throw new Error('Map initialization failed. Please ensure the container is properly rendered.');
    }
  }

  static async build(selector, options = {}) {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        if ('center' in options && options.center) {
          return new Map(selector, options);
        }

        const jakartaCoordinate = [-6.2, 106.816666];

        if ('locate' in options && options.locate) {
          try {
            const position = await Map.getCurrentPosition();
            const coordinate = [position.coords.latitude, position.coords.longitude];
            return new Map(selector, { ...options, center: coordinate });
          } catch (error) {
            console.warn('Geolocation failed, using default coordinates:', error);
            return new Map(selector, { ...options, center: jakartaCoordinate });
          }
        }

        return new Map(selector, { ...options, center: jakartaCoordinate });
      } catch (error) {
        lastError = error;
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    throw lastError || new Error('Failed to initialize map after multiple attempts');
  }
 
  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }
  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }
  
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
  
    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }
      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }
  
      newMarker.bindPopup(popupOptions.content);
    }
  
    newMarker.addTo(this.#map);
  
    return newMarker;
  }  
}