import React, { useState, useEffect, useRef } from 'react';

import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import * as Location from 'expo-location';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDistance } from 'geolib';

import { Ionicons } from '@expo/vector-icons';

import axios from 'axios';

import HistoryScreen from './HistoryScreen';
import CalculatorScreen from './CalculatorScreen';

export default function App() {

  // =========================================================
  // STATES
  // =========================================================

  const [isTracking, setIsTracking] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const [showCalculator, setShowCalculator] = useState(false);

  const [history, setHistory] = useState([]);

  const [distance, setDistance] = useState(0);

  const [time, setTime] = useState(0);

  const [weather, setWeather] = useState(null);

  const [currentDateTime, setCurrentDateTime] = useState('');

  const [initialLocation, setInitialLocation] = useState(null);

  // =========================
  // NEW SPEED STATES
  // =========================

  const [speed, setSpeed] = useState(0);

  const [avgSpeed, setAvgSpeed] = useState(0);

  // =========================================================
  // REFS
  // =========================================================

  const webviewRef = useRef(null);

  const WebView =
    Platform.OS !== 'web'
      ? require('react-native-webview').WebView
      : null;

  const routeRef = useRef([]);

  const lastMoveTime = useRef(Date.now());

  const distanceRef = useRef(0);

  const timeRef = useRef(0);

  const locationSubscription = useRef(null);

  const lastValidLocation = useRef(null);

  // =========================
  // SPEED SMOOTHING BUFFER
  // =========================

  const speedBuffer = useRef([]);

  // =========================================================
  // ANIMATIONS
  // =========================================================

  const cloudAnim = useRef(
    new Animated.Value(0)
  ).current;

  const pulseAnim = useRef(
    new Animated.Value(1)
  ).current;

  // =========================================================
  // INITIAL EFFECT
  // =========================================================

  useEffect(() => {

    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudAnim, {
          toValue: -5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(cloudAnim, {
          toValue: 5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadHistory();

    const updateDateTime = () => {
      const now = new Date();

      setCurrentDateTime(
        now.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      );
    };

    updateDateTime();

    const interval = setInterval(
      updateDateTime,
      60000
    );

    return () => clearInterval(interval);

  }, []);

  // =========================================================
  // LOCATION PERMISSION + INITIAL LOCATION
  // =========================================================

  useEffect(() => {

    let isMounted = true;

    (async () => {

      try {

        let { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Denied!'
          );
          return;
        }

        let loc =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });

        if (isMounted) {

          setInitialLocation(loc.coords);

          lastValidLocation.current = loc.coords;

          fetchWeather(
            loc.coords.latitude,
            loc.coords.longitude
          );
        }

      } catch (error) {

        console.warn(
          'Location error:',
          error
        );

      }

    })();

    return () => {
      isMounted = false;
    };

  }, []);

  // =========================================================
  // WEATHER API
  // =========================================================

  const fetchWeather = async (
    lat,
    lon
  ) => {

    try {

      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );

      if (
        response.data &&
        response.data.current_weather
      ) {

        setWeather(
          response.data.current_weather.temperature
        );
      }

    } catch (error) {

      console.log(
        'Weather fetch failed:',
        error.message
      );

      setWeather('--');

    }
  };

  // =========================================================
  // LOAD HISTORY
  // =========================================================

  const loadHistory = async () => {

    try {

      const savedData =
        await AsyncStorage.getItem(
          'walkHistory'
        );

      if (savedData) {

        setHistory(
          JSON.parse(savedData)
        );
      }

    } catch (e) {

      console.log(
        'Failed to load history'
      );

    }
  };

  // =========================================================
  // SAVE SESSION
  // =========================================================

  const saveSession = async (
    dist,
    duration,
    path
  ) => {

    if (dist < 2) return;

    const averageSpeed =
      duration > 0
        ? (
            (dist / duration) * 3.6
          ).toFixed(2)
        : 0;

    const newSession = {

      id: Date.now().toString(),

      date: new Date().toLocaleString(),

      distance: dist,

      time: duration,

      avgSpeed: averageSpeed,

      route: path,
    };

    try {

      const oldData =
        await AsyncStorage.getItem(
          'walkHistory'
        );

      const parsed = oldData
        ? JSON.parse(oldData)
        : [];

      const newData = [
        newSession,
        ...parsed,
      ];

      await AsyncStorage.setItem(
        'walkHistory',
        JSON.stringify(newData)
      );

      setHistory(newData);

    } catch (e) {

      console.log(
        'Error saving session'
      );

    }
  };

  // =========================================================
  // MAP HTML
  // =========================================================

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport"
      content="width=device-width,
      initial-scale=1.0,
      maximum-scale=1.0,
      user-scalable=no" />

      <link rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

      <style>

        body {
          padding: 0;
          margin: 0;
          background-color: #E5E7EB;
        }

        #map {
          height: 100vh;
          width: 100vw;
        }

        .custom-marker {
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

      </style>
    </head>

    <body>

      <div id="map"></div>

      <script>

        var map, marker, polyline;

        function initMap(lat, lng) {

          map = L.map('map', {
            zoomControl: false
          }).setView([lat, lng], 18);

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }
          ).addTo(map);

          var myIcon = L.divIcon({
            className: 'custom-marker',
            iconSize: [20, 20]
          });

          marker = L.marker(
            [lat, lng],
            {icon: myIcon}
          ).addTo(map);

          polyline = L.polyline(
            [],
            {
              color: '#3b82f6',
              weight: 6,
              opacity: 0.8
            }
          ).addTo(map);
        }

        function updateMap(
          lat,
          lng,
          routeArray
        ) {

          if(!map)
            initMap(lat, lng);

          var newLatLng =
            new L.LatLng(lat, lng);

          marker.setLatLng(newLatLng);

          map.panTo(newLatLng, {
            animate: true,
            duration: 0.5
          });

          if(
            routeArray &&
            routeArray.length > 0
          ) {
            polyline.setLatLngs(routeArray);
          }
        }

        ${
          initialLocation
            ? `initMap(
                ${initialLocation.latitude},
                ${initialLocation.longitude}
              );`
            : ''
        }

      </script>

    </body>
    </html>
  `;

  // =========================================================
  // SEND LOCATION TO MAP
  // =========================================================

  const sendLocationToMap = (
    lat,
    lng,
    routeData
  ) => {

    if (webviewRef.current) {

      const formattedRoute =
        routeData.map(c => [
          c.latitude,
          c.longitude,
        ]);

      const jsCode = `
        updateMap(
          ${lat},
          ${lng},
          ${JSON.stringify(formattedRoute)}
        );
        true;
      `;

      webviewRef.current.injectJavaScript(
        jsCode
      );
    }
  };

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {

    let timerInterval;

    if (isTracking) {

      timerInterval = setInterval(() => {

        const now = Date.now();

        const idleTime =
          now - lastMoveTime.current;

        if (idleTime > 60000) {

          setIsTracking(false);

          if (
            locationSubscription.current
          ) {

            locationSubscription.current.remove();

            locationSubscription.current = null;
          }

          lastValidLocation.current = null;

          if (distanceRef.current > 2) {

            saveSession(
              distanceRef.current,
              timeRef.current,
              routeRef.current
            );

            Alert.alert(
              'Auto-Stopped!',
              `Inactive for 60s`
            );

          }

        } else {

          timeRef.current += 1;

          setTime(timeRef.current);

          // =========================
          // AVG SPEED
          // =========================

          if (
            timeRef.current > 0
          ) {

            const average =
              (
                (distanceRef.current /
                  timeRef.current) *
                3.6
              );

            if (
              isFinite(average)
            ) {

              setAvgSpeed(
                average.toFixed(2)
              );
            }
          }
        }

      }, 1000);
    }

    return () =>
      clearInterval(timerInterval);

  }, [isTracking]);

  // =========================================================
  // START TRACKING
  // =========================================================

  const startTracking = async () => {

    if (
      locationSubscription.current
    ) {

      locationSubscription.current.remove();

      locationSubscription.current = null;
    }

    setIsTracking(true);

    distanceRef.current = 0;

    timeRef.current = 0;

    routeRef.current = [];

    lastValidLocation.current = null;

    speedBuffer.current = [];

    setDistance(0);

    setTime(0);

    setSpeed(0);

    setAvgSpeed(0);

    lastMoveTime.current = Date.now();

    // =========================
    // LOCATION TRACKING
    // =========================

    locationSubscription.current =
      await Location.watchPositionAsync(

        {
          accuracy:
            Location.Accuracy.Highest,

          timeInterval: 2000,

          distanceInterval: 1,
        },

        (loc) => {

          const newCoords =
            loc.coords;

          // =========================
          // GPS ACCURACY FILTER
          // =========================

          if (
            newCoords.accuracy !==
              null &&
            newCoords.accuracy > 20
          ) return;

          // =========================
          // LIVE GPS SPEED
          // =========================

          const gpsSpeed =
            newCoords.speed;

          if (
            gpsSpeed !== null &&
            gpsSpeed >= 0
          ) {

            const speedKmh =
              gpsSpeed * 3.6;

            // =========================
            // SPEED SMOOTHING
            // =========================

            speedBuffer.current.push(
              speedKmh
            );

            if (
              speedBuffer.current
                .length > 5
            ) {

              speedBuffer.current.shift();
            }

            const smoothSpeed =
              speedBuffer.current.reduce(
                (a, b) => a + b,
                0
              ) /
              speedBuffer.current.length;

            setSpeed(
              smoothSpeed.toFixed(2)
            );
          }

          // =========================
          // FIRST LOCATION
          // =========================

          if (
            !lastValidLocation.current
          ) {

            lastValidLocation.current =
              newCoords;

            routeRef.current = [
              newCoords,
            ];

            lastMoveTime.current =
              Date.now();

            sendLocationToMap(
              newCoords.latitude,
              newCoords.longitude,
              routeRef.current
            );

            return;
          }

          // =========================
          // DISTANCE CALCULATION
          // =========================

          const addedDistance =
            getDistance(
              {
                latitude:
                  lastValidLocation
                    .current.latitude,

                longitude:
                  lastValidLocation
                    .current.longitude,
              },

              {
                latitude:
                  newCoords.latitude,

                longitude:
                  newCoords.longitude,
              }
            );

          // =========================
          // MOVEMENT FILTER
          // =========================

          const isActuallyMoving =
            addedDistance > 1 &&
            addedDistance < 100;

          if (
            isActuallyMoving
          ) {

            distanceRef.current +=
              addedDistance;

            setDistance(
              Math.floor(
                distanceRef.current
              )
            );

            routeRef.current = [
              ...routeRef.current,
              newCoords,
            ];

            lastValidLocation.current =
              newCoords;

            lastMoveTime.current =
              Date.now();

          } else if (
            addedDistance > 0
          ) {

            routeRef.current = [
              ...routeRef.current,
              newCoords,
            ];

            lastValidLocation.current =
              newCoords;
          }

          // =========================
          // UPDATE MAP
          // =========================

          sendLocationToMap(
            newCoords.latitude,
            newCoords.longitude,
            routeRef.current
          );
        }
      );
  };

  // =========================================================
  // STOP TRACKING
  // =========================================================

  const stopTracking = () => {

    setIsTracking(false);

    if (
      locationSubscription.current
    ) {

      locationSubscription.current.remove();

      locationSubscription.current = null;
    }

    lastValidLocation.current = null;

    if (
      distanceRef.current > 2
    ) {

      saveSession(
        distanceRef.current,
        timeRef.current,
        routeRef.current
      );

      Alert.alert(
        'Tracking Stopped',
        `Distance: ${distanceRef.current}m
Time: ${formatTime(timeRef.current)}
Avg Speed: ${avgSpeed} km/h`
      );
    }
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (
    totalSeconds
  ) => {

    const mins =
      Math.floor(totalSeconds / 60);

    const secs =
      totalSeconds % 60;

    return `
      ${mins < 10 ? '0' : ''}
      ${mins}
      :
      ${secs < 10 ? '0' : ''}
      ${secs}
    `.replace(/\s/g, '');
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  if (showCalculator) {

    return (
      <CalculatorScreen
        onBack={() =>
          setShowCalculator(false)
        }
      />
    );
  }

  if (showHistory) {

    return (
      <HistoryScreen
        history={history}
        setHistory={setHistory}
        onBack={() =>
          setShowHistory(false)
        }
      />
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <SafeAreaView
      className={`flex-1 bg-gray-50 ${
        Platform.OS === 'android'
          ? 'pt-10'
          : ''
      }`}
    >

      {/* HEADER */}

      <View className="flex-row justify-between items-center p-5 bg-white rounded-b-3xl shadow-md z-10">

        <View>

          <Text className="text-gray-500 text-sm font-semibold">
            {currentDateTime}
          </Text>

          <Text className="text-2xl font-extrabold text-gray-900 mt-1">
            Field Tracker
          </Text>

        </View>

        <View className="items-center justify-center bg-blue-50 px-3 py-2 rounded-xl flex-row gap-2">

          <Animated.View
            style={{
              transform: [
                {
                  translateY:
                    cloudAnim,
                },
              ],
            }}
          >

            <Ionicons
              name="partly-sunny"
              size={24}
              color="#1E88E5"
            />

          </Animated.View>

          <View className="items-center">

            <Text className="text-lg font-bold text-blue-600">

              {weather !== null
                ? `${weather}°C`
                : '--°C'}

            </Text>

            <Text className="text-[10px] text-blue-500 font-semibold">
              Temp
            </Text>

          </View>

        </View>

      </View>

      {/* MAP */}

      <View className="flex-1 bg-gray-200 overflow-hidden">

        {initialLocation ? (

          Platform.OS !== 'web' &&
          WebView ? (

            <WebView
              ref={webviewRef}
              originWhitelist={['*']}
              source={{ html: mapHTML }}
              style={{
                flex: 1,
                marginBottom: -20,
              }}
              scrollEnabled={false}
            />

          ) : (

            <View className="flex-1 bg-[#E5E7EB]">

              <iframe
                title="Map Preview"
                srcDoc={mapHTML}
                style={{
                  width: '100%',
                  height: '100%',
                  borderWidth: 0,
                }}
              />

            </View>

          )

        ) : (

          <View className="flex-1 justify-center items-center bg-[#E5E7EB]">

            <Animated.View
              style={{
                transform: [
                  {
                    scale: pulseAnim,
                  },
                ],
              }}
            >

              <Ionicons
                name="location"
                size={60}
                color="#4A90E2"
              />

            </Animated.View>

            <Text className="text-blue-500 font-bold mt-4 tracking-widest text-lg">
              LOCATING YOU...
            </Text>

          </View>

        )}

      </View>

      {/* BOTTOM PANEL */}

      <View className="bg-white p-6 rounded-t-3xl shadow-lg pb-10">

        {/* DISTANCE + TIME */}

        <View className="flex-row justify-between mb-6">

          <View className="flex-1 items-center">

            <Text className="text-gray-500 text-sm font-semibold mb-1">
              Distance
            </Text>

            <Text className="text-3xl font-black text-gray-900">
              {distance}
              <Text className="text-lg font-bold">
                {' '}m
              </Text>
            </Text>

          </View>

          <View className="w-px bg-gray-300 mx-2" />

          <View className="flex-1 items-center">

            <Text className="text-gray-500 text-sm font-semibold mb-1">
              Active Time
            </Text>

            <Text className="text-3xl font-black text-gray-900">
              {formatTime(time)}
            </Text>

          </View>

        </View>

        {/* SPEED SECTION */}

        <View className="flex-row justify-between mb-6">

          <View className="flex-1 items-center bg-blue-50 py-4 rounded-2xl mr-2">

            <Text className="text-gray-500 text-sm font-semibold">
              Live Speed
            </Text>

            <Text className="text-2xl font-black text-blue-600 mt-1">
              {speed} km/h
            </Text>

          </View>

          <View className="flex-1 items-center bg-green-50 py-4 rounded-2xl ml-2">

            <Text className="text-gray-500 text-sm font-semibold">
              Avg Speed
            </Text>

            <Text className="text-2xl font-black text-green-600 mt-1">
              {avgSpeed} km/h
            </Text>

          </View>

        </View>

        {/* BUTTONS */}

        <View className="flex-row justify-around gap-4">

          <TouchableOpacity
            className={`flex-1 py-4 rounded-2xl items-center shadow-md ${
              isTracking
                ? 'bg-red-500'
                : 'bg-green-500'
            }`}
            onPress={
              isTracking
                ? stopTracking
                : startTracking
            }
            activeOpacity={0.8}
          >

            <Text className="text-white text-base font-bold tracking-widest">

              {isTracking
                ? '⏹️ STOP'
                : '▶️ START'}

            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-4 rounded-2xl items-center shadow-md bg-blue-500"
            onPress={() =>
              setShowHistory(true)
            }
            activeOpacity={0.8}
          >

            <Text className="text-white text-base font-bold tracking-widest">
              📋 HISTORY
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-4 rounded-2xl items-center shadow-md bg-purple-500"
            onPress={() =>
              setShowCalculator(true)
            }
            activeOpacity={0.8}
          >

            <Text className="text-white text-base font-bold tracking-widest">
              🧮 CALCULATOR
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </SafeAreaView>
  );
}






// import React, { useState, useEffect, useRef } from 'react';
// // import { Text, View, TouchableOpacity, Alert, SafeAreaView, Animated, Platform } from 'react-native';
// import { Text, View, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as Location from 'expo-location';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getDistance, getPathLength } from 'geolib';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import HistoryScreen from './HistoryScreen';
// import CalculatorScreen from './CalculatorScreen';

// export default function App() {
//   const [isTracking, setIsTracking] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);
//   const [showCalculator, setShowCalculator] = useState(false);
//   const [history, setHistory] = useState([]);
  
//   const [distance, setDistance] = useState(0); 
//   const [time, setTime] = useState(0); 
//   const [weather, setWeather] = useState(null);
//   const [currentDateTime, setCurrentDateTime] = useState('');
//   const [initialLocation, setInitialLocation] = useState(null);

//   const webviewRef = useRef(null);
//   const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;
//   const routeRef = useRef([]);
//   const lastMoveTime = useRef(Date.now());
//   const distanceRef = useRef(0);
//   const timeRef = useRef(0);
//   const locationSubscription = useRef(null);
  
//   // 🚀 NAYA REF: Pichli valid location store karne ke liye
//   const lastValidLocation = useRef(null);

//   const cloudAnim = useRef(new Animated.Value(0)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(cloudAnim, { toValue: -5, duration: 1000, useNativeDriver: true }),
//         Animated.timing(cloudAnim, { toValue: 5, duration: 1000, useNativeDriver: true }),
//       ])
//     ).start();

//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
//         Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
//       ])
//     ).start();

//     loadHistory();
//     const updateDateTime = () => {
//       const now = new Date();
//       setCurrentDateTime(now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
//     };
//     updateDateTime();
//     const interval = setInterval(updateDateTime, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     let isMounted = true; 

//     (async () => {
//       try {
//         let { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//           Alert.alert('Location Permission Denied!');
//           return;
//         }

//         let loc = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.Balanced, 
//         });

//         if (isMounted) {
//           setInitialLocation(loc.coords);
//           lastValidLocation.current = loc.coords;
//           fetchWeather(loc.coords.latitude, loc.coords.longitude);
//         }
//       } catch (error) {
//         console.warn("Location error:", error);
//       }
//     })();

//     return () => { isMounted = false; };
//   }, []);

//   const fetchWeather = async (lat, lon) => {
//     try {
//       const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
//       if (response.data && response.data.current_weather) {
//         setWeather(response.data.current_weather.temperature);
//       }
//     } catch (error) {
//       console.log("Axios weather fetch failed:", error.message);
//       setWeather("--"); 
//     }
//   };

//   const loadHistory = async () => {
//     try {
//       const savedData = await AsyncStorage.getItem('walkHistory');
//       if (savedData) setHistory(JSON.parse(savedData));
//     } catch (e) {
//       console.log("Failed to load history");
//     }
//   };

//   const saveSession = async (dist, duration, path) => {
//     if (dist < 2) return; 
//     const newSession = {
//       id: Date.now().toString(),
//       date: new Date().toLocaleString(),
//       distance: dist,
//       time: duration,
//       route: path
//     };
//     try {
//       const oldData = await AsyncStorage.getItem('walkHistory');
//       const parsed = oldData ? JSON.parse(oldData) : [];
//       const newData = [newSession, ...parsed];
//       await AsyncStorage.setItem('walkHistory', JSON.stringify(newData));
//       setHistory(newData);
//     } catch (e) {
//       console.log("Error saving session");
//     }
//   };

//   const mapHTML = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
//       <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//       <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//       <style>
//         body { padding: 0; margin: 0; background-color: #E5E7EB; }
//         #map { height: 100vh; width: 100vw; }
//         .custom-marker {
//           background-color: #3b82f6;
//           border: 3px solid white;
//           border-radius: 50%;
//           box-shadow: 0 0 10px rgba(0,0,0,0.5);
//         }
//         .leaflet-marker-icon { transition: transform 0.5s linear; }
//       </style>
//     </head>
//     <body>
//       <div id="map"></div>
//       <script>
//         var map, marker, polyline;

//         function initMap(lat, lng) {
//           map = L.map('map', { zoomControl: false }).setView([lat, lng], 18);
          
//           L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             maxZoom: 19,
//             attribution: '© OpenStreetMap'
//           }).addTo(map);

//           var myIcon = L.divIcon({ className: 'custom-marker', iconSize: [20, 20] });
//           marker = L.marker([lat, lng], {icon: myIcon}).addTo(map);

//           polyline = L.polyline([], {color: '#3b82f6', weight: 6, opacity: 0.8}).addTo(map);
//         }

//         function updateMap(lat, lng, routeArray) {
//           if(!map) initMap(lat, lng);
//           var newLatLng = new L.LatLng(lat, lng);
          
//           marker.setLatLng(newLatLng);
//           map.panTo(newLatLng, { animate: true, duration: 0.5 });
          
//           if(routeArray && routeArray.length > 0) {
//              polyline.setLatLngs(routeArray);
//           }
//         }
        
//         ${initialLocation ? `initMap(${initialLocation.latitude}, ${initialLocation.longitude});` : ''}
//       </script>
//     </body>
//     </html>
//   `;

//   const sendLocationToMap = (lat, lng, routeData) => {
//     if (webviewRef.current) {
//       const formattedRoute = routeData.map(c => [c.latitude, c.longitude]);
//       const jsCode = `updateMap(${lat}, ${lng}, ${JSON.stringify(formattedRoute)}); true;`;
//       webviewRef.current.injectJavaScript(jsCode);
//     }
//   };

//   useEffect(() => {
//     let timerInterval;
//     if (isTracking) {
//       timerInterval = setInterval(() => {
//         const now = Date.now();
//         const idleTime = now - lastMoveTime.current;

//         if (idleTime > 60000) {
//           setIsTracking(false); 
//           if (locationSubscription.current) {
//             locationSubscription.current.remove();
//             locationSubscription.current = null;
//           }
//           lastValidLocation.current = null;
//           if (distanceRef.current > 2) {
//             saveSession(distanceRef.current, timeRef.current, routeRef.current);
//             Alert.alert("Auto-Stopped!", `You were inactive for 60s.\nField route of ${distanceRef.current}m saved to history.`);
//           } else {
//             Alert.alert("Auto-Stopped", "Tracking stopped as no movement was detected.");
//           }
//         } else {
//           timeRef.current += 1;
//           setTime(timeRef.current);
//         }
//       }, 1000);
//     }
//     return () => clearInterval(timerInterval);
//   }, [isTracking]);

//   const startTracking = async () => {
//     if (locationSubscription.current) {
//       locationSubscription.current.remove();
//       locationSubscription.current = null;
//     }

//     setIsTracking(true);
//     distanceRef.current = 0;
//     timeRef.current = 0;
//     routeRef.current = [];
//     lastValidLocation.current = null;
//     setDistance(0);
//     setTime(0);
//     lastMoveTime.current = Date.now();

//     locationSubscription.current = await Location.watchPositionAsync(
//       {
//         accuracy: Location.Accuracy.BestForNavigation, // Tractor ke liye best GPS accuracy use karenge
//         timeInterval: 2000, // 2 second mein location update, field use ke liye better
//         distanceInterval: 1, // Chhote movements/slow tractor speed ke liye
//       },
//       (loc) => {
//         const newCoords = loc.coords;
        
//         // 🚀 FILTER 1: Relaxed Accuracy Check. Agar GPS signal weak (error > 20m) hai, to ignore karo.
//         if (newCoords.accuracy !== null && newCoords.accuracy > 20) return;
        
//         // Agar pehli baar chalna shuru kar rahe hain
//         if (!lastValidLocation.current) {
//              lastValidLocation.current = newCoords;
//              routeRef.current = [newCoords];
//              lastMoveTime.current = Date.now();
//              sendLocationToMap(newCoords.latitude, newCoords.longitude, routeRef.current);
//              return;
//         }

//         // Pichli valid location se distance calculate karo
//         const addedDistance = getDistance(
//           { latitude: lastValidLocation.current.latitude, longitude: lastValidLocation.current.longitude },
//           { latitude: newCoords.latitude, longitude: newCoords.longitude }
//         );

//         // 🚀 FILTER 2: Fake movement detector
//         // 1. addedDistance > 1 (Chhoti movements / gps jitter ignore kare, but less strict)
//         // 2. addedDistance < 100 (Allow larger jumps, GPS can be inaccurate)
//         // 3. Remove speed check as it's unreliable on many devices
//         const isActuallyMoving = addedDistance > 1 && addedDistance < 100;

//         if (isActuallyMoving) { 
//           distanceRef.current += addedDistance;
//           setDistance(Math.floor(distanceRef.current)); 
          
//           // Nayi coordinate save karo aur route update karo
//           routeRef.current = [...routeRef.current, newCoords];
//           lastValidLocation.current = newCoords; // Next check ke liye isko set karo
//           lastMoveTime.current = Date.now(); 
//         } else if (addedDistance > 0) {
//           // Agar movement detect nahi hua but thoda distance hai, to route update karo for path display
//           routeRef.current = [...routeRef.current, newCoords];
//           lastValidLocation.current = newCoords;
//         }

//         // HTML Map ko naya data hamesha bhejte raho taki marker move kare (bhale hi distance add na hua ho)
//         sendLocationToMap(newCoords.latitude, newCoords.longitude, routeRef.current);
//       }
//     );
//   };

//   const stopTracking = () => {
//     setIsTracking(false);
//     if (locationSubscription.current) {
//       locationSubscription.current.remove();
//       locationSubscription.current = null;
//     }
//     lastValidLocation.current = null;
//     if (distanceRef.current > 2) {
//       saveSession(distanceRef.current, timeRef.current, routeRef.current);
//       Alert.alert("Field Tracking Stopped", `Saved to History!\nDistance: ${distanceRef.current}m\nTime: ${formatTime(timeRef.current)}`);
//     }
//   };

//   const formatTime = (totalSeconds) => {
//     const mins = Math.floor(totalSeconds / 60);
//     const secs = totalSeconds % 60;
//     return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
//   };

//   if (showCalculator) {
//     return <CalculatorScreen onBack={() => setShowCalculator(false)} />;
//   }

//   if (showHistory) {
//     return <HistoryScreen history={history} setHistory={setHistory} onBack={() => setShowHistory(false)} />;
//   }

//   return (
//     <SafeAreaView className={`flex-1 bg-gray-50 ${Platform.OS === 'android' ? 'pt-10' : ''}`}>
//       <View className="flex-row justify-between items-center p-5 bg-white rounded-b-3xl shadow-md z-10">
//         <View>
//           <Text className="text-gray-500 text-sm font-semibold">{currentDateTime}</Text>
//           <Text className="text-2xl font-extrabold text-gray-900 mt-1">Field Tracker</Text>
//         </View>
//         <View className="items-center justify-center bg-blue-50 px-3 py-2 rounded-xl flex-row gap-2">
//           <Animated.View style={{ transform: [{ translateY: cloudAnim }] }}>
//             <Ionicons name="partly-sunny" size={24} color="#1E88E5" />
//           </Animated.View>
//           <View className="items-center">
//             <Text className="text-lg font-bold text-blue-600">{weather !== null ? `${weather}°C` : '--°C'}</Text>
//             <Text className="text-[10px] text-blue-500 font-semibold">Temp</Text>
//           </View>
//         </View>
//       </View>

//       <View className="flex-1 bg-gray-200 overflow-hidden">
//         {initialLocation ? (
//           Platform.OS !== 'web' && WebView ? (
//             <WebView
//               ref={webviewRef}
//               originWhitelist={['*']}
//               source={{ html: mapHTML }}
//               style={{ flex: 1, marginBottom: -20 }}
//               scrollEnabled={false}
//               showsVerticalScrollIndicator={false}
//               showsHorizontalScrollIndicator={false}
//             />
//           ) : (
//             <View className="flex-1 bg-[#E5E7EB]">
//               <iframe
//                 title="Map Preview"
//                 srcDoc={mapHTML}
//                 style={{ width: '100%', height: '100%', borderWidth: 0, minHeight: 300 }}
//               />
//             </View>
//           )
//         ) : (
//           <View className="flex-1 justify-center items-center bg-[#E5E7EB]">
//             <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
//               <Ionicons name="location" size={60} color="#4A90E2" />
//             </Animated.View>
//             <View className="w-10 h-3 bg-gray-300 rounded-full mt-2 opacity-50" />
//             <Text className="text-blue-500 font-bold mt-4 tracking-widest text-lg">
//               LOCATING YOU...
//             </Text>
//           </View>
//         )}
//       </View>

//       <View className="bg-white p-6 rounded-t-3xl shadow-lg pb-10">
//         <View className="flex-row justify-between mb-6">
//           <View className="flex-1 items-center">
//             <Text className="text-gray-500 text-sm font-semibold mb-1">Distance</Text>
//             <Text className="text-3xl font-black text-gray-900">{distance} <Text className="text-lg font-bold">m</Text></Text>
//           </View>
//           <View className="w-px bg-gray-300 mx-2" />
//           <View className="flex-1 items-center">
//             <Text className="text-gray-500 text-sm font-semibold mb-1">Active Time</Text>
//             <Text className="text-3xl font-black text-gray-900">{formatTime(time)}</Text>
//           </View>
//         </View>

//         <View className="flex-row justify-around gap-4">
//           <TouchableOpacity 
//             className={`flex-1 py-4 rounded-2xl items-center shadow-md ${isTracking ? 'bg-red-500' : 'bg-green-500'}`}
//             onPress={isTracking ? stopTracking : startTracking}
//             activeOpacity={0.8}
//           >
//             <Text className="text-white text-base font-bold tracking-widest">{isTracking ? "⏹️ STOP" : "▶️ START"}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             className="flex-1 py-4 rounded-2xl items-center shadow-md bg-blue-500"
//             onPress={() => setShowHistory(true)}
//             activeOpacity={0.8}
//           >
//             <Text className="text-white text-base font-bold tracking-widest">📋 HISTORY</Text>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             className="flex-1 py-4 rounded-2xl items-center shadow-md bg-purple-500"
//             onPress={() => setShowCalculator(true)}
//             activeOpacity={0.8}
//           >
//             <Text className="text-white text-base font-bold tracking-widest">🧮 CALCULATOR</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }