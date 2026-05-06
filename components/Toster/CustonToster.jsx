import Toast, { BaseToast } from 'react-native-toast-message';
import { View } from 'react-native';

export const toastConfig = {
  success: (props) => (
    <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
      <BaseToast {...props} />
    </View>
  ),
};