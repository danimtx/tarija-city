import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const RetoMapaScreen = () => {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [location, setLocation] = useState(null);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const webviewRef = useRef(null);

  useEffect(() => {
    const checkLocation = async () => {
      const hasServices = await Location.hasServicesEnabledAsync();
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (hasServices && status === 'granted') {
        setLocationEnabled(true);
        getLocation();
      } else {
        Alert.alert(
          'Ubicación requerida',
          'Debes activar los servicios de ubicación y conceder permisos para acceder a esta pantalla.'
        );
      }
    };

    checkLocation();
  }, []);

  const getLocation = async () => {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        setLocation({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
        });
        if (!initialLocationSet) {
          setInitialLocationSet(true);
        }
      }
    );
  };

  useEffect(() => {
    if (location) {
      const message = JSON.stringify({
        ...location,
        isInitialLocation: !initialLocationSet,
      });
      webviewRef.current?.postMessage(message);
    }
  }, [location, initialLocationSet]);

  if (!locationEnabled) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Los servicios de ubicación deben estar activados para acceder a este mapa.
        </Text>
      </View>
    );
  }

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        #map { height: 100vh; width: 100%; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var defaultCenter = [-21.535, -64.731]; // Coordenadas de Tarija, Bolivia
        var map = L.map('map', {
          center: defaultCenter,
          zoom: 13,
          maxZoom: 17,
        });

        var vectorLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        });

        vectorLayer.addTo(map);

        var userMarker = null;
        var markersLayer = L.layerGroup().addTo(map);

        function updateUserLocation(lat, lng, isInitialLocation) {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            userMarker = L.circleMarker([lat, lng], {
              radius: 8,
              fillColor: '#007bff',
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            });
            markersLayer.addLayer(userMarker);
            userMarker.bindPopup('Estás aquí').openPopup();
          }
          
          if (isInitialLocation) {
            map.setView([lat, lng], 13);
          }
        }

        document.addEventListener('message', function(event) {
          var data = JSON.parse(event.data);
          if (data.latitude && data.longitude) {
            updateUserLocation(data.latitude, data.longitude, data.isInitialLocation);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ html: mapHtml }}
        style={styles.map}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});

export default RetoMapaScreen;