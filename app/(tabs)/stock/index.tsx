import React, {useEffect, useState} from "react";
import {StyleSheet, TextInput, View, FlatList, Text, TouchableOpacity} from "react-native";
import {router} from "expo-router";
import {getAccountList, searchStock} from "../../../contexts/backEndApi";
import {StockStatus} from "../../../types/stock";

const stockList = [
    "Apple Inc.",
    "Microsoft Corp.",
    "Amazon.com Inc.",
    "Tesla Inc.",
    "Google LLC",
    "Meta Platforms Inc.",
    "Samsung Electronics",
    "NVIDIA Corp.",
    "Intel Corp.",
    "Netflix Inc.",
];

export default function SearchStockScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [stocks, setStocks] = useState<StockStatus[]>();
    useEffect(() => {
        const fetchStockList = async () => {
            const response = await searchStock(searchQuery);
            setStocks(response?.data || []);
        };
        if (searchQuery.length !== 0){
            fetchStockList();
        }
    }, [searchQuery]);

    const handleStockPress = (stockName: string, stCode: string) => {
        router.push({
            pathname: "stock/price",
            params: { stockName, stCode },
        });
    };

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search stock..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filtered Stock List */}
            <FlatList
                data={stocks}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.stockItem}
                        onPress={() => handleStockPress(item.NAME, item.ST_CODE)}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
                            <View style={[styles.stockCodeText, { marginRight: 12 }]}>
                                <Text>{item.ST_CODE}</Text>
                            </View>
                            <Text style={[styles.stockText, { flex: 1 }]}>{item.NAME}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No stocks found.</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        padding: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    stockItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    stockText: {
        fontSize: 16,
        color: "#333",
    },
    stockCodeText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333333", // Neutral dark gray for text
        backgroundColor: "#F5F5F5", // Light gray background
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        textAlign: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    emptyText: {
        textAlign: "center",
        color: "#999",
        marginTop: 20,
    },
});