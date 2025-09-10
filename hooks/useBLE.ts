import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock BLE functionality for web platform
const WebBLEManager = {
  startAdvertising: async () => console.log('BLE advertising not available on web'),
  stopAdvertising: async () => console.log('BLE stop advertising not available on web'),
  startDeviceScan: () => console.log('BLE scanning not available on web'),
  stopDeviceScan: () => console.log('BLE stop scanning not available on web'),
  destroy: () => console.log('BLE destroy not available on web'),
  onStateChange: () => ({
    remove: () => console.log('BLE state change not available on web')
  })
};

// Only import BLE dependencies for native platforms
let BleManager;
if (Platform.OS !== 'web') {
  try {
    const { BleManager: NativeBleManager } = require('react-native-ble-plx');
    BleManager = NativeBleManager;
  } catch (error) {
    console.warn('BLE functionality not available:', error);
    BleManager = null;
  }
}

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const SOS_STORAGE_KEY = 'sos_signals';

export interface SOSSignal {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  deviceId: string;
}

export const useBLE = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [receivedSignals, setReceivedSignals] = useState<SOSSignal[]>([]);
  
  // Initialize with web mock or native manager
  const [bleManager] = useState(() => {
    if (Platform.OS === 'web') return WebBLEManager;
    if (!BleManager) {
      console.warn('BLE manager not available, using mock implementation');
      return WebBLEManager;
    }
    return new BleManager();
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = bleManager?.onStateChange((state: string) => {
      if (state === 'PoweredOn') {
        console.log('Bluetooth is powered on');
        loadStoredSignals();
      }
    }, true);

    return () => {
      subscription?.remove();
      if (Platform.OS === 'android') {
        bleManager?.destroy();
      }
    };
  }, [bleManager]);

  const loadStoredSignals = async () => {
    try {
      const stored = await AsyncStorage.getItem(SOS_STORAGE_KEY);
      if (stored) {
        setReceivedSignals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading stored signals:', error);
    }
  };

  const storeSignal = async (signal: SOSSignal) => {
    try {
      const existing = await AsyncStorage.getItem(SOS_STORAGE_KEY);
      const signals = existing ? JSON.parse(existing) : [];
      const updated = [signal, ...signals.slice(0, 49)]; // Keep last 50 signals
      await AsyncStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));
      setReceivedSignals(updated);
    } catch (error) {
      console.error('Error storing signal:', error);
    }
  };

  const startBroadcasting = async (userData: any) => {
    try {
      if (Platform.OS === 'web') {
        console.log('BLE broadcasting not available on web platform');
        setIsBroadcasting(true);
        return;
      }

      const sosData = {
        type: 'SOS',
        ...userData,
        deviceId: Math.random().toString(36).substr(2, 9)
      };

      if (Platform.OS === 'android') {
        await bleManager.startAdvertising({
          serviceUUIDs: [SERVICE_UUID],
          manufacturerData: Buffer.from(JSON.stringify(sosData)).toString('base64'),
          localName: 'SaveHer_SOS'
        });
      }
      setIsBroadcasting(true);
      console.log('Broadcasting SOS signal:', sosData);
    } catch (error) {
      console.error('Error broadcasting:', error);
      setIsBroadcasting(false);
      Alert.alert('Error', 'Failed to broadcast SOS signal. Please check Bluetooth permissions.');
    }
  };

  const stopBroadcasting = async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('BLE broadcasting not available on web platform');
        setIsBroadcasting(false);
        return;
      }

      if (Platform.OS === 'android') {
        await bleManager.stopAdvertising();
      }
      setIsBroadcasting(false);
      console.log('Stopped broadcasting SOS signal');
    } catch (error) {
      console.error('Error stopping broadcast:', error);
    }
  };

  const startListening = async (onSignalReceived?: (signal: SOSSignal) => void) => {
    try {
      if (Platform.OS === 'web') {
        console.log('BLE listening not available on web platform');
        setIsListening(true);
        return;
      }

      setIsListening(true);
      console.log('Started listening for SOS signals...');
      
      bleManager.startDeviceScan(null, {
        allowDuplicates: true,
      }, (error: any, device: any) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }
        
        if (device && device.manufacturerData) {
          try {
            const data = Buffer.from(device.manufacturerData, 'base64').toString();
            const sosData = JSON.parse(data);
            
            if (sosData.type === 'SOS' && sosData.location) {
              const signal: SOSSignal = {
                id: sosData.deviceId || device.id,
                location: sosData.location,
                timestamp: sosData.timestamp,
                deviceId: sosData.deviceId || device.id
              };
              
              console.log('Received SOS signal:', signal);
              storeSignal(signal);
              onSignalReceived?.(signal);
            }
          } catch (parseError) {
            // Not an SOS signal, ignore
          }
        }
      });
    } catch (error) {
      console.error('Error starting listening:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start listening for SOS signals. Please check Bluetooth permissions.');
    }
  };

  const stopListening = () => {
    if (Platform.OS === 'web') {
      setIsListening(false);
      return;
    }
    
    bleManager?.stopDeviceScan();
    setIsListening(false);
    console.log('Stopped listening for SOS signals');
  };

  const startScanning = async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('BLE scanning not available on web platform');
        setIsScanning(true);
        return;
      }

      setIsScanning(true);
      bleManager.startDeviceScan([SERVICE_UUID], {
        allowDuplicates: false,
      }, (error: any, device: any) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }
        if (device) {
          setDevices(prev => {
            if (prev.find(d => d.id === device.id)) {
              return prev;
            }
            return [...prev, device];
          });
        }
      });
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (Platform.OS === 'web') {
      setIsScanning(false);
      return;
    }
    
    bleManager?.stopDeviceScan();
    setIsScanning(false);
  };

  return {
    startBroadcasting,
    stopBroadcasting,
    startListening,
    stopListening,
    startScanning,
    stopScanning,
    isScanning,
    isBroadcasting,
    isListening,
    devices,
    receivedSignals,
  };
};