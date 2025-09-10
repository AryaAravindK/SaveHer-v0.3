import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

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

export const useBLE = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
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
      }
    }, true);

    return () => {
      subscription?.remove();
      if (Platform.OS === 'android') {
        bleManager?.destroy();
      }
    };
  }, [bleManager]);

  const startBroadcasting = async (userData: any) => {
    try {
      if (Platform.OS === 'web') {
        console.log('BLE broadcasting not available on web platform');
        setIsBroadcasting(true);
        return;
      }

      if (Platform.OS === 'android') {
        await bleManager.startAdvertising({
          serviceUUIDs: [SERVICE_UUID],
          manufacturerData: Buffer.from(JSON.stringify(userData)).toString('base64'),
        });
      }
      setIsBroadcasting(true);
    } catch (error) {
      console.error('Error broadcasting:', error);
      setIsBroadcasting(false);
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
    } catch (error) {
      console.error('Error stopping broadcast:', error);
    }
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
    startScanning,
    stopScanning,
    isScanning,
    isBroadcasting,
    devices,
  };
};