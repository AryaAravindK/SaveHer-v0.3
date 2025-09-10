import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { UserPlus } from 'lucide-react-native';

const MOCK_CONTACTS = [
  { id: '1', name: 'Emergency Contact 1', phone: '+1 234 567 8900' },
  { id: '2', name: 'Emergency Contact 2', phone: '+1 234 567 8901' },
];

export default function ContactsScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactPhone}>{item.phone}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addButton}>
          <UserPlus size={24} color="#E94560" />
        </TouchableOpacity>
      </View>
      <FlashList
        data={MOCK_CONTACTS}
        renderItem={renderItem}
        estimatedItemSize={73}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#16213E',
  },
  addButton: {
    padding: 10,
  },
  listContent: {
    padding: 20,
  },
  contactItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#16213E',
  },
  contactPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 5,
  },
});