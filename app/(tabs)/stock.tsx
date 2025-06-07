import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from "react";

const mockOutput1 = {
    askp_rsqn1: "500",
    askp_rsqn2: "400",
    askp_rsqn3: "300",
    askp_rsqn4: "200",
    askp_rsqn5: "100",
    askp_rsqn6: "90",
    askp_rsqn7: "80",
    askp_rsqn8: "70",
    askp_rsqn9: "60",
    askp_rsqn10: "50",
    bidp_rsqn1: "450",
    bidp_rsqn2: "350",
    bidp_rsqn3: "250",
    bidp_rsqn4: "150",
    bidp_rsqn5: "50",
    bidp_rsqn6: "40",
    bidp_rsqn7: "30",
    bidp_rsqn8: "20",
    bidp_rsqn9: "10",
    bidp_rsqn10: "5",
};

const mockOutput2 = {
    stck_prpr: "10050", // 현재가
    stck_sdpr: "10000", // 기준가
};

export default function StockScreen() {
    const referencePrice = parseFloat(mockOutput2.stck_sdpr);

    const askData = Array.from({ length: 10 }, (_, i) => ({
        quantity: parseInt(mockOutput1[`askp_rsqn${10 - i}`], 10),
        price: parseFloat(mockOutput1[`askp${10 - i}`]),
        rate: (((parseFloat(mockOutput1[`askp${10 - i}`]) - referencePrice) / referencePrice) * 100).toFixed(2),
    }));

    const bidData = Array.from({ length: 10 }, (_, i) => ({
        quantity: parseInt(mockOutput1[`bidp_rsqn${i + 1}`], 10),
        price: parseFloat(mockOutput1[`bidp${i + 1}`]),
        rate: (((parseFloat(mockOutput1[`bidp${i + 1}`]) - referencePrice) / referencePrice) * 100).toFixed(2),
    }));

    const maxQuantity = Math.max(
        ...askData.map((item) => item.quantity),
        ...bidData.map((item) => item.quantity)
    );

    const renderRow = (item, type) => (
        <View style={styles.row}>
            {type === 'ask' && (
                <>
                    <View style={[styles.quantityContainer]}>
                        <Text style={[styles.quantity, { textAlign: 'right', flex: 1 }]}>{item.quantity.toLocaleString()}</Text>
                        <View
                            style={[
                                styles.gauge,
                                { width: `${(item.quantity / maxQuantity) * 100}%` },
                                { backgroundColor: '#d8e7fc', alignSelf: 'flex-end', right: 0, position: 'absolute' },
                            ]}
                        />
                    </View>
                    <View style={{ flex: 0.5, alignItems: 'center' }}>
                        <Text style={styles.price}>{item.price.toLocaleString()}</Text>
                    </View>
                </>
            )}
            {type === 'bid' && (
                <>
                    <View style={{ flex: 0.5, alignItems: 'center' }}>
                        <Text style={styles.price}>{item.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.quantityContainer}>
                        <View
                            style={[
                                styles.gauge,
                                { width: `${(item.quantity / maxQuantity) * 100}%` },
                                { backgroundColor: '#fce1e1', alignSelf: 'flex-start' },
                            ]}
                        />
                        <Text style={styles.quantity}>{item.quantity.toLocaleString()}</Text>
                    </View>
                </>
            )}
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ flex: 2 }}>
                    {askData.map((item, index) => (
                        <React.Fragment key={index}>
                            {renderRow(item, 'ask')}
                        </React.Fragment>
                    ))}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.additionalContainer}>
                        <Text style={styles.upperLimit}>상한가: 123</Text>
                        <Text style={styles.lowerLimit}>하한가: 123</Text>
                        <Text style={styles.additionalText}>시작: 123</Text>
                        <Text style={styles.additionalText}>최고: 123</Text>
                        <Text style={styles.additionalText}>최저: 123</Text>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <View style={styles.additionalContainer}>
                        <Text style={styles.upperLimit}>상한가: 123</Text>
                        <Text style={styles.lowerLimit}>하한가: 123</Text>
                    </View>
                </View>
                <View style={{ flex: 2 }}>
                    {askData.map((item, index) => (
                        <React.Fragment key={index}>
                            {renderRow(item, 'bid')}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 16,
    },
    section: {
        marginVertical: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        width: 80,
        textAlign: 'center',
    },
    quantityContainer: {
        flex: 0.5,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    gauge: {
        position: 'absolute',
        height: '100%',
        borderRadius: 4,
    },
    quantity: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        zIndex: 1,
    },
    additionalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    additionalText: {
        fontSize: 14,
        color: '#666',
    },
    upperLimit: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ff0000',
        marginBottom: 4,
    },
    lowerLimit: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0000ff',
    },
});