import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LinearGradient } from 'expo-linear-gradient';
import { useBLE } from '@/hooks/useBLE';

const LOCATION_TASK_NAME = 'background-location-task';

// Only define task manager for native platforms
if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const { locations } = data;
      // Handle location update
      console.log('Location received in background:', locations);
    }
  });
}

export default function EmergencyScreen() {
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const { startBroadcasting, stopBroadcasting, isBroadcasting } = useBLE();
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          return;
        }

        // Platform-specific location tracking setup
        if (Platform.OS !== 'web') {
          if (Platform.OS === 'android') {
            const { status: backgroundStatus } = 
              await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
              console.error('Permission to access background location was denied');
              return;
            }
          }

          // Start background location updates for native platforms
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
            foregroundService: Platform.OS === 'android' ? {
              notificationTitle: "SaveHer is active",
              notificationBody: "Monitoring your location for safety",
              notificationColor: "#E94560"
            } : undefined
          });
        } else {
          // Web platform: Use watchPosition instead
          const id = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 5,
            },
            (location) => {
              console.log('Location update:', location);
              setLocation(location);
            }
          );
          setWatchId(id);
        }
      } catch (error) {
        console.error('Error setting up location tracking:', error);
      }
    })();

    return () => {
      // Cleanup location tracking
      if (Platform.OS !== 'web') {
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
          .then((hasStarted) => {
            if (hasStarted) {
              Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
          })
          .catch(console.error);
      } else if (watchId) {
        watchId.remove();
      }
    };
  }, []);

  const handleSOSPress = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Platform Notice',
          'SOS functionality is limited on web platform. Please use the mobile app for full functionality.'
        );
        return;
      }

      setSosActive(!sosActive);
      if (!sosActive) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        await startBroadcasting({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          timestamp: new Date().toISOString()
        });
      } else {
        await stopBroadcasting();
      }
    } catch (error) {
      console.error('Error handling SOS:', error);
      Alert.alert(
        'Error',
        'Failed to activate SOS. Please try again or check your device settings.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#16213E', '#0F3460']}
        style={styles.background}
      />
      <TouchableOpacity
        style={[styles.sosButton, sosActive && styles.sosButtonActive]}
        onPress={handleSOSPress}
        activeOpacity={0.7}
      >
        <Text style={styles.sosText}>
          {sosActive ? 'SOS ACTIVE' : 'PRESS FOR SOS'}
        </Text>
      </TouchableOpacity>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {sosActive ? 'Broadcasting emergency signal...' : 'Ready to help'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E94560',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 8 : 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosButtonActive: {
    backgroundColor: '#ff0000',
    transform: [{ scale: 1.1 }],
  },
  sosText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});