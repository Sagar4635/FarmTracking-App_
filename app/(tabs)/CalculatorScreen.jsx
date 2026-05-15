import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

export default function CalculatorScreen({ onBack }) {

  // =========================
  // INPUT STATES
  // =========================
  const [width, setWidth] = useState('');
  const [speed, setSpeed] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [area, setArea] = useState('');
  const [time, setTime] = useState('');

  // =========================
  // RESULT STATES
  // =========================
  const [tfc, setTfc] = useState(null);
  const [efc, setEfc] = useState(null);
  const [realEfc, setRealEfc] = useState(null);
  const [calculatedEfficiency, setCalculatedEfficiency] = useState(null);

  // =========================
  // MAIN CALCULATION FUNCTION
  // =========================
  const calculateValues = () => {

    const w = parseFloat(width);
    const s = parseFloat(speed);
    const eff = parseFloat(efficiency);
    const a = parseFloat(area);
    const t = parseFloat(time);

    // =========================
    // VALIDATION
    // =========================
    if (isNaN(w) || isNaN(s)) {
      Alert.alert(
        'Missing Input',
        'Please enter valid Width and Speed'
      );
      return;
    }

    if (w <= 0 || s <= 0) {
      Alert.alert(
        'Invalid Input',
        'Width and Speed must be greater than 0'
      );
      return;
    }

    // =========================
    // THEORETICAL FIELD CAPACITY
    // Formula:
    // TFC = (Width × Speed) / 10
    // =========================
    const tfcValue = (w * s) / 10;

    setTfc(tfcValue.toFixed(2));

    // =========================
    // EFFECTIVE FIELD CAPACITY
    // Formula:
    // EFC = TFC × Efficiency / 100
    // =========================

    // Default efficiency = 75%
    const effValue = !isNaN(eff) ? eff : 75;

    // Validation for efficiency
    if (effValue <= 0 || effValue > 100) {
      Alert.alert(
        'Invalid Efficiency',
        'Efficiency must be between 1 and 100'
      );
      return;
    }

    const efcValue =
      tfcValue * (effValue / 100);

    setEfc(efcValue.toFixed(2));

    // =========================
    // REAL EFFECTIVE FIELD CAPACITY
    // Formula:
    // Real EFC = Area / Time
    // =========================
    if (
      !isNaN(a) &&
      !isNaN(t) &&
      a > 0 &&
      t > 0
    ) {

      const real = a / t;

      setRealEfc(real.toFixed(2));

      // =========================
      // FIELD EFFICIENCY
      // Formula:
      // Efficiency = (Real EFC / TFC) × 100
      // =========================
      const actualEfficiency =
        (real / tfcValue) * 100;

      setCalculatedEfficiency(
        actualEfficiency.toFixed(2)
      );

    } else {

      setRealEfc(null);
      setCalculatedEfficiency(null);
    }
  };

  // =========================
  // RESET FUNCTION
  // =========================
  const clearAll = () => {

    setWidth('');
    setSpeed('');
    setEfficiency('');
    setArea('');
    setTime('');

    setTfc(null);
    setEfc(null);
    setRealEfc(null);
    setCalculatedEfficiency(null);
  };

  // =========================
  // INPUT COMPONENT
  // =========================
  const InputField = ({
    label,
    value,
    setValue,
    placeholder,
  }) => (
    <View className="mb-4">

      <Text className="text-gray-700 mb-2 font-semibold text-base">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="numeric"
        placeholder={placeholder || 'Enter value'}
        placeholderTextColor="#9CA3AF"
        className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-base"
      />

    </View>
  );

  return (
    <SafeAreaProvider>

      <SafeAreaView
        edges={['top']}
        className="flex-1 bg-white"
      >

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        {onBack && (
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200">

            <TouchableOpacity
              onPress={onBack}
              className="flex-row items-center"
            >

              <Ionicons
                name="chevron-back"
                size={28}
                color="black"
              />

              <Text className="text-lg font-semibold ml-2">
                Back
              </Text>

            </TouchableOpacity>

          </View>
        )}

        {/* ========================= */}
        {/* MAIN CONTENT */}
        {/* ========================= */}

        <ScrollView
          className="flex-1 px-5 py-6"
          showsVerticalScrollIndicator={false}
        >

          {/* TITLE */}

          <Text className="text-3xl font-bold text-center mb-2">
            🌾 Field Calculator
          </Text>

          <Text className="text-center text-gray-500 mb-8">
            Agricultural Field Capacity Calculator
          </Text>

          {/* ========================= */}
          {/* INPUTS */}
          {/* ========================= */}

          <InputField
            label="Implement Width (meter)"
            value={width}
            setValue={setWidth}
            placeholder="Example: 2.5"
          />

          <InputField
            label="Speed (km/h)"
            value={speed}
            setValue={setSpeed}
            placeholder="Example: 5"
          />

          <InputField
            label="Field Efficiency (O) (%)"
            value={efficiency}
            setValue={setEfficiency}
            placeholder="Default = 75%"
          />

          {/* OPTIONAL SECTION */}

          <View className="mt-4 mb-2">

            <Text className="text-xl font-bold text-gray-800">
              📊 Real Field Data (Optional)
            </Text>

            <Text className="text-gray-500 mt-1">
              Used for actual field efficiency calculation
            </Text>

          </View>

          <InputField
            label="Covered Area (ha)"
            value={area}
            setValue={setArea}
            placeholder="Example: 4"
          />

          <InputField
            label="Time Taken (hours)"
            value={time}
            setValue={setTime}
            placeholder="Example: 5"
          />

          {/* ========================= */}
          {/* BUTTONS */}
          {/* ========================= */}

          <TouchableOpacity
            onPress={calculateValues}
            className="bg-green-600 py-4 rounded-2xl mt-4 shadow"
          >

            <Text className="text-white text-center font-bold text-lg">
              CALCULATE
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearAll}
            className="bg-red-500 py-4 rounded-2xl mt-4"
          >

            <Text className="text-white text-center font-bold text-lg">
              RESET
            </Text>

          </TouchableOpacity>

          {/* ========================= */}
          {/* RESULTS */}
          {/* ========================= */}

          {(tfc || efc || realEfc || calculatedEfficiency) && (

            <View className="mt-8 bg-gray-100 p-5 rounded-2xl">

              <Text className="text-2xl font-bold mb-5 text-center">
                📈 Results
              </Text>

              {/* TFC */}

              {tfc && (
                <View className="mb-4 bg-white p-4 rounded-xl">

                  <Text className="text-lg font-bold text-gray-800">
                    🚜 Theoretical Field Capacity
                  </Text>

                  <Text className="text-2xl font-bold text-green-600 mt-2">
                    {tfc} ha/hr
                  </Text>

                </View>
              )}

              {/* EFC */}

              {efc && (
                <View className="mb-4 bg-white p-4 rounded-xl">

                  <Text className="text-lg font-bold text-gray-800">
                    🌱 Effective Field Capacity (O)
                  </Text>

                  <Text className="text-2xl font-bold text-green-600 mt-2">
                    {efc} ha/hr
                  </Text>

                </View>
              )}

              {/* REAL EFC */}

              {realEfc && (
                <View className="mb-4 bg-white p-4 rounded-xl">

                  <Text className="text-lg font-bold text-gray-800">
                    📊 Real Effective Field Capacity
                  </Text>

                  <Text className="text-2xl font-bold text-blue-600 mt-2">
                    {realEfc} ha/hr
                  </Text>

                </View>
              )}

              {/* FIELD EFFICIENCY */}

              {calculatedEfficiency && (
                <View className="bg-white p-4 rounded-xl">

                  <Text className="text-lg font-bold text-gray-800">
                    ⚙️ Field Efficiency
                  </Text>

                  <Text className="text-2xl font-bold text-orange-500 mt-2">
                    {calculatedEfficiency} %
                  </Text>

                </View>
              )}

            </View>
          )}

          {/* FOOTER */}

          <View className="mt-8 mb-10">

            <Text className="text-center text-gray-400 text-sm">
              Developed for Agricultural Machinery Calculations
            </Text>

          </View>

        </ScrollView>

      </SafeAreaView>

    </SafeAreaProvider>
  );
}