import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AccountScreen: React.FC = () => {
    const [mockAccounts, setMockAccounts] = useState<string[]>(['Mock Account 1']);
    const [realAccounts, setRealAccounts] = useState<string[]>(['Real Account 1']);

    const handleAddMockAccount = () => {
        const newAccount = `Mock Account ${mockAccounts.length + 1}`;
        setMockAccounts((prev) => [...prev, newAccount]);
    };

    const handleAddRealAccount = () => {
        const newAccount = `Real Account ${realAccounts.length + 1}`;
        setRealAccounts((prev) => [...prev, newAccount]);
    };

    const renderAccountItem = ({ item }: { item: string }) => (
        <View style={styles.accountBox}>
            <Text style={styles.accountText}>{item}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Mock Investment Accounts Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mock Investment Accounts</Text>
                <FlatList
                    data={mockAccounts}
                    keyExtractor={(item, index) => `mock-${index}`}
                    renderItem={renderAccountItem}
                    contentContainerStyle={styles.listContainer}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddMockAccount}>
                    <Icon name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Real Investment Accounts Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Real Investment Accounts</Text>
                <FlatList
                    data={realAccounts}
                    keyExtractor={(item, index) => `real-${index}`}
                    renderItem={renderAccountItem}
                    contentContainerStyle={styles.listContainer}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddRealAccount}>
                    <Icon name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    listContainer: {
        marginBottom: 10,
    },
    accountBox: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    accountText: {
        fontSize: 16,
        color: '#333',
    },
    addButton: {
        alignSelf: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#B5EAD7',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default AccountScreen;