import Reactotron, { networking } from 'reactotron-react-native';

Reactotron
  .configure({ name: 'My React Native App' }) 
  .useReactNative() 
  .use(networking()) // Ye network calls (API) dekhne ke liye hai
  .connect();