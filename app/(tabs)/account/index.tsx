import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {router, useRouter} from "expo-router";

export default function AccountListScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* 상단 코드 박스 */}
            <View style={styles.codeBox}>
                <Text style={styles.label}>모의</Text>
                <Text style={styles.code}>1213-123-123</Text>
            </View>
            <View style={styles.codeBox}>
                <Text style={styles.label}>모의</Text>
                <Text style={styles.code}>1213-123-123</Text>
            </View>
            {/* 플러스 버튼 */}
            <TouchableOpacity style={styles.plusBox} onPress={() => router.push('account/add')}>
                <Feather name="plus" size={32} color="#2B4C59" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    codeBox: {
        width: '90%',
        backgroundColor: '#B5EAD7',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 24,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    label: {
        position: 'absolute',
        top: -7,
        left: 16,
        paddingHorizontal: 6,
        fontSize: 19,
        color: '#a6b411',
        zIndex: 1,
        fontFamily: 'Nanum-Regular'
    },
    code: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2B4C59',
    },
    plusBox: {
        width: '90%',
        backgroundColor: '#B5EAD7',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
});

