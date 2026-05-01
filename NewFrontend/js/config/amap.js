const AMAP_CONFIG = {
  KEY: '4e90b4242ed26bcf402a0bb7f46197de',
  SECURITY_JS_CODE: '94d4378db1ad21baeed37a958a324f6a',
  DEFAULT_CENTER: {
    lng: 116.397428,
    lat: 39.90923
  },
  DEFAULT_ZOOM: 15,
  LOCATION_ZOOM: 17,
  FENCE_ZOOM: 16,
  GEOLOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    convert: true,
    showButton: false,
    showMarker: false,
    panToLocation: false,
    zoomToAccuracy: false
  }
}

export default AMAP_CONFIG