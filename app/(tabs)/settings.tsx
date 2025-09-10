import { View, StyleSheet, Text, Switch, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useBLE } from '@/hooks/useBLE';

export default function SettingsScreen() {
  const [isReceiverMode, setIsReceiverMode] = useState(true);
  const [autoActivate, setAutoActivate] = useState(false);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(true);
  const { receivedSignals } = useBLE();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingText}>Receiver Mode</Text>
          <Text style={styles.settingDescription}>
            Listen for emergency signals from nearby devices
          </Text>
          <Switch
            value={isReceiverMode}
            onValueChange={setIsReceiverMode}
            trackColor={{ false: '#767577', true: '#E94560' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingText}>Auto-activate in danger zones</Text>
          <Text style={styles.settingDescription}>
            Automatically start listening in high-risk areas
          </Text>
          <Switch
            value={autoActivate}
            onValueChange={setAutoActivate}
            trackColor={{ false: '#767577', true: '#E94560' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingText}>High Priority Alerts</Text>
          <Text style={styles.settingDescription}>
            Show emergency alerts even when phone is silent
          </Text>
          <Switch
            value={highPriorityAlerts}
            onValueChange={setHighPriorityAlerts}
            trackColor={{ false: '#767577', true: '#E94560' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency History</Text>
        <Text style={styles.historyText}>
          Received signals: {receivedSignals.length}
        </Text>
        <Text style={styles.historyDescription}>
          Emergency signals received in the last 30 days
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#16213E',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#16213E',
    marginBottom: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 2,
    flex: 1,
  },
  historyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E94560',
    marginBottom: 5,
  },
  historyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  button: {
    backgroundColor: '#E94560',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});