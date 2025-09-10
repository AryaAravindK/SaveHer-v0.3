import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { X, MapPin, Clock } from 'lucide-react-native';
import { SOSSignal } from '@/hooks/useBLE';

const { width, height } = Dimensions.get('window');

interface SOSModalProps {
  visible: boolean;
  signal: SOSSignal | null;
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onNavigate: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  visible,
  signal,
  userLocation,
  onClose,
  onNavigate,
}) => {
  if (!signal) return null;

  const calculateDistance = () => {
    if (!userLocation) return 'Unknown';
    
    const R = 6371; // Earth's radius in km
    const dLat = (signal.location.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (signal.location.longitude - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(signal.location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🚨 EMERGENCY ALERT</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                Someone nearby needs help!
              </Text>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <MapPin size={20} color="#E94560" />
                <Text style={styles.infoText}>
                  Distance: {calculateDistance()}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Clock size={20} color="#E94560" />
                <Text style={styles.infoText}>
                  Time: {formatTime(signal.timestamp)}
                </Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <Text style={styles.locationTitle}>Emergency Location:</Text>
              <Text style={styles.coordinates}>
                Lat: {signal.location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinates}>
                Lng: {signal.location.longitude.toFixed(6)}
              </Text>
            </View>
            
            {userLocation && (
              <View style={styles.locationContainer}>
                <Text style={styles.locationTitle}>Your Location:</Text>
                <Text style={styles.coordinates}>
                  Lat: {userLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinates}>
                  Lng: {userLocation.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
              <Text style={styles.navigateButtonText}>Navigate to Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#E94560',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  alertBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  alertText: {
    color: '#856404',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#16213E',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 2,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  navigateButton: {
    backgroundColor: '#E94560',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  dismissButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});