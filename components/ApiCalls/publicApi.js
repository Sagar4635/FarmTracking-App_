// import axios from "axios";

// // const BASE_URL = import.meta.env.BASE_URL  ?? "http://localhost:8000/api";  
// const api = axios.create({
//   baseURL: "https://girlsafty.onrender.com/api",
//   timeout: 100000,
//   headers: {
//     "Content-Type": "application/json",
//     "Accept": "application/json",
//   },
// });

// export default api;



import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: "https://girlsafty.onrender.com/api",
  timeout: 100000, // Render server ke sleep issue ke liye 100s
});

// Interceptor: Har request server tak jane se pehle yahan se guzregi
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. AsyncStorage se token nikalo
      const token = await AsyncStorage.getItem("token"); // Note: Apni key ka naam check kar lena
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Dynamic Headers (Ye APK ka bug solve karega)
      // Agar hum FormData bhej rahe hain, toh Axios khud header manage karega
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Agar normal text/data hai, toh JSON lagayega
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
      }

      return config;
    } catch (error) {
      console.log("Token error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;