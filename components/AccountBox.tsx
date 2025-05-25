import {StyleSheet, Text, View} from "react-native";
import React from 'react';



export default function AccountBox({account}) {
    return (
        <View style={styles.codeBox}>
            <Text style={styles.label}>{account.SIMULATION_YN === 'Y' ? '실전' : '모의'}</Text>
            <Text style={styles.accountNo}>{account.ACCOUNT_NO}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
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
        shadowOffset: {width: 0, height: 2},
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
    accountNo: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2B4C59',
    },
});