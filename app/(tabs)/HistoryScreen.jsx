import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen({ history, setHistory, onBack }) {
  
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 🗑️ Individual Item Delete Function
  const handleDeleteItem = (id) => {
    Alert.alert("Delete Session", "Are you sure you want to delete this field session?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          const updatedHistory = history.filter(item => item.id !== id);
          setHistory(updatedHistory); // UI update karega
          await AsyncStorage.setItem('walkHistory', JSON.stringify(updatedHistory)); // Storage se delete karega
        } 
      }
    ]);
  };

  // 💥 Clear All History Function
  const handleClearAll = () => {
    if (history.length === 0) return; // Agar pehle se khali hai toh kuch mat karo
    
    Alert.alert("Clear All History", "Are you sure you want to delete ALL field sessions? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete All", 
        style: "destructive", 
        onPress: async () => {
          setHistory([]); // Sab kuch khali kar dega
          await AsyncStorage.removeItem('walkHistory'); // Storage clear kar dega
        } 
      }
    ]);
  };

  return (
    <SafeAreaView className={`flex-1 bg-gray-50 ${Platform.OS === 'android' ? 'pt-10' : ''}`}>
      
      {/* 🔙 BACK BUTTON & HEADER */}
      <View className="flex-row items-center justify-between p-5 bg-white shadow-sm border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="p-2 mr-3 bg-gray-100 rounded-full">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">🚜 Field Sessions</Text>
        </View>

        {/* 💥 CLEAR ALL BUTTON */}
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} className="p-2 bg-red-50 rounded-full">
            <Ionicons name="trash-bin" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📋 HISTORY LIST */}
      <View className="flex-1 p-5">
        {history.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="footsteps-outline" size={60} color="#ccc" />
            <Text className="text-center text-gray-500 mt-4 text-lg">No field sessions saved yet!</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
                {/* Date & Individual Delete Icon */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-bold text-gray-600">{item.date}</Text>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)} className="p-1">
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between items-center bg-blue-50 p-3 rounded-xl">
                  <Text className="text-base text-blue-600 font-bold">📏 {item.distance} m</Text>
                  <Text className="text-base text-blue-600 font-bold">⏱️ {formatTime(item.time)}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

    </SafeAreaView>
  );
}