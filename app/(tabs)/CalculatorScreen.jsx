import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CalculatorScreen({ onBack }) {
  const [width, setWidth] = useState('');
  const [speed, setSpeed] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [area, setArea] = useState('');
  const [time, setTime] = useState('');

  const [tfc, setTfc] = useState(null);
  const [efc, setEfc] = useState(null);
  const [realEfc, setRealEfc] = useState(null);

  const calculateValues = () => {
    const w = parseFloat(width);
    const s = parseFloat(speed);
    const eff = parseFloat(efficiency);
    const a = parseFloat(area);
    const t = parseFloat(time);

    // Validation
    if (!w || !s) {
      Alert.alert("Missing Input", "Please enter Width and Speed");
      return;
    }

    // ✅ TFC
    const tfcValue = (w * s) / 10;
    setTfc(tfcValue.toFixed(2));

    // ✅ EFC (with default efficiency if not entered)
    const effValue = eff || 75; // default 75%
    const efcValue = tfcValue * (effValue / 100);
    setEfc(efcValue.toFixed(2));

    // ✅ Real EFC (Area/Time)
    if (a && t) {
      const real = (a / 10000) / (t / 3600);
      setRealEfc(real.toFixed(2));
    } else {
      setRealEfc(null);
    }
  };

  const InputField = ({ label, value, setValue }) => (
    <View className="mb-4">
      <Text className="text-gray-600 mb-1 font-semibold">{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        placeholder="Enter value"
        className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-100"
      />
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} className="flex-1 bg-white">

        {/* Header */}
        {onBack && (
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={onBack} className="flex-row items-center">
              <Ionicons name="chevron-back" size={28} color="black" />
              <Text className="text-lg font-semibold ml-2">Back</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView className="flex-1 px-5 py-6">

          <Text className="text-2xl font-bold mb-6 text-center">
            Field Calculator 🌾
          </Text>

          {/* Inputs */}
          <InputField label="Width (meter)" value={width} setValue={setWidth} />
          <InputField label="Speed (km/h)" value={speed} setValue={setSpeed} />
          <InputField label="Efficiency (%) (optional)" value={efficiency} setValue={setEfficiency} />

          <Text className="text-lg font-bold mt-4 mb-2">Optional (for Real EFC)</Text>

          <InputField label="Area (m²)" value={area} setValue={setArea} />
          <InputField label="Time (seconds)" value={time} setValue={setTime} />

          {/* Button */}
          <TouchableOpacity
            onPress={calculateValues}
            className="bg-green-500 py-4 rounded-xl mt-4"
          >
            <Text className="text-white text-center font-bold text-lg">
              CALCULATE
            </Text>
          </TouchableOpacity>

          {/* Results */}
          <View className="mt-8 bg-gray-100 p-5 rounded-xl">

            {tfc && (
              <Text className="text-lg font-semibold mb-2">
                🚜 TFC: {tfc} ha/hr
              </Text>
            )}

            {efc && (
              <Text className="text-lg font-semibold mb-2">
                🌱 EFC: {efc} ha/hr
              </Text>
            )}

            {realEfc && (
              <Text className="text-lg font-semibold">
                📊 Real EFC (Area/Time): {realEfc} ha/hr
              </Text>
            )}

          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}