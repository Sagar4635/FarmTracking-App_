// import { Stack } from 'expo-router';

// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="FirstPage" options={{ title: 'FirstPage', headerShown: false }} />
//       <Stack.Screen name="login" options={{title: 'Login', headerShown: false }} />
//       <Stack.Screen name="register" options={{title: 'Register', headerShown: false }} /> 
//       <Stack.Screen name="(tabs)" options={{title: 'Home', headerShown: false }} /> 
//     </Stack>
//   );
// }


import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* <Stack.Screen name="login" />
      <Stack.Screen name="register" /> */}
      {/* <Stack.Screen name="(tabs)" /> */}
      {/* <Stack.Screen name="chat" /> */}
    </Stack>
  );
} 