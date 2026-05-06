import { Stack } from 'expo-router';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import "../global.css";
import { toastConfig } from '@/components/Toster/CustonToster';

if (__DEV__) {
  require('../ReactotronConfig');
}

// 🔴 VERY IMPORTANT
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    const hideSplash = async () => {
      await SplashScreen.hideAsync(); // 🔴 splash yahin hide hogi
    };

    hideSplash();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast config={toastConfig} />
    </QueryClientProvider>
  );
}





// import { Stack, usePathname, useRouter } from 'expo-router';
// import { QueryClientProvider } from "@tanstack/react-query";
// import { queryClient } from "../queryClient";
// import Toast from 'react-native-toast-message';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useEffect, useState } from 'react';
// import { View, ActivityIndicator } from 'react-native';
// import "../global.css";
// import { toastConfig } from '@/components/Toster/CustonToster';

// if (__DEV__) {
//   require('../ReactotronConfig');
// }

// export default function RootLayout() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [isReady, setIsReady] = useState(false);

//   // 1. App start ya refresh hone par last route aur token check karna
//   useEffect(() => {
//     const restoreState = async () => {
//       try {
//         const lastRoute = await AsyncStorage.getItem("LAST_ROUTE");
//         const token = await AsyncStorage.getItem("Token");

//         // Agar token hai aur last route bhi hai, toh wahi bhej do
//         if (token && lastRoute && lastRoute !== '/') {
//           router.replace(lastRoute);
//         }
//       } catch (error) {
//         console.error("Route restore failed:", error);
//       } finally {
//         setIsReady(true);
//       }
//     };

//     // Expo Router ko properly mount hone ke liye halka sa delay zaroori hai
//     setTimeout(() => {
//       restoreState();
//     }, 100);
//   }, []);

//   // 2. Route change hone par storage me update karna (jab app ready ho jaye)
//   useEffect(() => {
//     if (isReady && pathname) {
//       AsyncStorage.setItem("LAST_ROUTE", pathname);
//     }
//   }, [pathname, isReady]);

//   // 3. Jab tak routing decide ho rahi hai, ek loading screen dikhao
//   if (!isReady) {
//     return (
//       <View className="flex-1 justify-center items-center bg-black">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <Stack screenOptions={{ headerShown: false }} />
//       <Toast config={toastConfig} />
//     </QueryClientProvider>
//   );
// }
