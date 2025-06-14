import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import React, {useState} from "react";
import OrderBookRow from "../../components/OrderBookRow";

const mockOutput1 = {
    askp1: "10100",
    askp2: "10200",
    askp3: "10300",
    askp4: "10400",
    askp5: "10500",
    askp6: "10600",
    askp7: "10700",
    askp8: "10800",
    askp9: "10900",
    askp10: "11000",
    bidp1: "10050",
    bidp2: "9900",
    bidp3: "9800",
    bidp4: "9700",
    bidp5: "9600",
    bidp6: "9500",
    bidp7: "9400",
    bidp8: "9300",
    bidp9: "9200",
    bidp10: "9100",
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
    stck_hgpr : "10500", // 최고가
    stck_lwpr : "9500", // 최저가
};

export default function StockScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const referencePrice = parseFloat(mockOutput2.stck_prpr);

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

    const maxAsk = Math.max(...askData.map((a) => a.quantity));
    const maxBid = Math.max(...bidData.map((b) => b.quantity));

    return (
        <>
            {/* Stock Search Input */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="주식 검색..."
                    value={searchQuery}
                    editable={false}
                />
            </View>
            <ScrollView style={styles.container}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 2 }}>
                        {askData.map((item, index) => (
                            <OrderBookRow
                                key={`ask-${index}`}
                                currentPrice={referencePrice}
                                item={item}
                                type="ask"
                                maxQuantity={maxAsk}
                            />
                        ))}
                    </View>
                    <View style={{ flex: 1, padding: 8 }}>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>상한가</Text>
                            <Text style={styles.additionalText}>3,000</Text>
                        </View>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>하한가</Text>
                            <Text style={styles.additionalText}>2,000</Text>
                        </View>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>시작</Text>
                            <Text style={styles.additionalText}>1,000</Text>
                        </View>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>고가</Text>
                            <Text style={styles.additionalText}>2,000</Text>
                        </View>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>저가</Text>
                            <Text style={styles.additionalText}>21,000</Text>
                        </View>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>상한가</Text>
                            <Text style={styles.additionalText}>3,000</Text>
                        </View>
                        <View style={styles.additionalContainer}>
                            <Text style={styles.additionalText}>하한가</Text>
                            <Text style={styles.additionalText}>2,000</Text>
                        </View>
                    </View>
                    <View style={{ flex: 2 }}>
                        {bidData.map((item, index) => (
                            <OrderBookRow
                                key={`bid-${index}`}
                                currentPrice={referencePrice}
                                item={item}
                                type="bid"
                                maxQuantity={maxBid}
                            />

                        ))}
                    </View>
                </View>
            </ScrollView>
        </>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    additionalText: {
        padding:1,
        fontSize: 12,
        color: '#939393',
        textAlign: 'left',
    },
    searchContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});