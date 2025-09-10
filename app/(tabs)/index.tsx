import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LinearGradient } from 'expo-linear-gradient';
import { useBLE, SOSSignal } from '@/hooks/useBLE';
import { useAudio } from '@/hooks/useAudio';
import { SOSModal } from '@/components/SOSModal';

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
  const [isReadyToHelp, setIsReadyToHelp] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<SOSSignal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { 
    startBroadcasting, 
    stopBroadcasting, 
    startListening, 
    stopListening, 
    isBroadcasting,
    isListening 
  } = useBLE();
  const { playBeepSound } = useAudio();
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

  const handleReadyToHelp = async () => {
    try {
      if (!isReadyToHelp) {
        // Start listening for SOS signals
        await startListening(handleSOSReceived);
        setIsReadyToHelp(true);
        Alert.alert(
          'Ready to Help',
          'You are now listening for emergency signals from nearby devices.'
        );
      } else {
        // Stop listening
        stopListening();
        setIsReadyToHelp(false);
        Alert.alert(
          'Stopped Listening',
          'You are no longer listening for emergency signals.'
        );
      }
    } catch (error) {
      console.error('Error toggling ready to help:', error);
      Alert.alert(
        'Error',
        'Failed to toggle ready to help mode. Please check your device settings.'
      );
    }
  };

  const handleSOSReceived = async (signal: SOSSignal) => {
    console.log('SOS signal received:', signal);
    
    // Play beep sound
    await playBeepSound();
    
    // Show modal with signal details
    setCurrentSignal(signal);
    setShowModal(true);
    
    // Show system notification if possible
    Alert.alert(
      '🚨 EMERGENCY ALERT',
      'Someone nearby needs help! Check the emergency details.',
      [
        { text: 'View Details', onPress: () => setShowModal(true) },
        { text: 'Dismiss', style: 'cancel' }
      ]
    );
  };

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
        // Get current location and broadcast SOS
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        console.log('Broadcasting SOS from location:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        await startBroadcasting({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          timestamp: new Date().toISOString(),
          type: 'SOS'
        });
        
        Alert.alert(
          'SOS Activated',
          'Your emergency signal is being broadcast to nearby devices.'
        );
      } else {
        await stopBroadcasting();
        Alert.alert(
          'SOS Deactivated',
          'Your emergency signal has been stopped.'
        );
      }
    } catch (error) {
      console.error('Error handling SOS:', error);
      Alert.alert(
        'Error',
        'Failed to activate SOS. Please try again or check your device settings.'
      );
    }
  };

  const handleNavigateToLocation = () => {
    if (currentSignal && Platform.OS === 'android') {
      const { latitude, longitude } = currentSignal.location;
      const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(Emergency Location)`;
      
      // This will open Google Maps on Android
      import('expo-linking').then(({ default: Linking }) => {
        Linking.openURL(url).catch(() => {
          // Fallback to Google Maps web
          const webUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        });
      });
    }
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#16213E', '#0F3460']}
        style={styles.background}
      />
      
      {/* Ready to Help Button */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={[styles.readyButton, isReadyToHelp && styles.readyButtonActive]}
          onPress={handleReadyToHelp}
          activeOpacity={0.7}
        >
          <Text style={styles.readyButtonText}>
            {isReadyToHelp ? 'LISTENING FOR HELP' : 'READY TO HELP'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.statusIndicator}>
          {isReadyToHelp ? '🟢 Listening for emergency signals' : '🔴 Not listening'}
        </Text>
      </View>
      
      {/* SOS Button */}
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
          {sosActive ? 'Broadcasting emergency signal...' : 'Press SOS button in emergency'}
        </Text>
      </View>
      
      {/* SOS Modal */}
      <SOSModal
        visible={showModal}
        signal={currentSignal}
        userLocation={location?.coords ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null}
        onClose={() => setShowModal(false)}
        onNavigate={handleNavigateToLocation}
      />
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
  topSection: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  readyButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
  },
  readyButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  statusIndicator: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
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
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});