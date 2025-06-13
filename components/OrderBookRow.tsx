import { View, Text, StyleSheet } from 'react-native';



interface RowProps {
    item: {
        quantity: number;
        price: number;
        rate: string;
    };
    type: 'ask' | 'bid';
    currentPrice: number;
    maxQuantity: number;
}


export default function OrderBookRow({ item, type, currentPrice, maxQuantity }:RowProps) {
    return (
        <View style={[
            item.price === currentPrice 
            ? (type === 'ask' ? styles.highlightedAsk : styles.highlightedBid) 
            : styles.row
        ]}>
            {type === 'ask' ? (
                <>
                    <View style={styles.quantityContainer}>
                        <Text style={[styles.quantity, { textAlign: 'right', flex: 1 }]}>
                            {item.quantity.toLocaleString()}
                        </Text>
                        <View
                            style={[
                                styles.gauge,
                                { width: `${(item.quantity / maxQuantity) * 100}%`, backgroundColor: '#d8e7fc', right: 0 },
                            ]}
                        />
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{item.price.toLocaleString()}</Text>
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{item.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.quantityContainer}>
                        <View
                            style={[
                                styles.gauge,
                                { width: `${(item.quantity / maxQuantity) * 100}%`, backgroundColor: '#fce1e1', left: 0 },
                            ]}
                        />
                        <Text style={styles.quantity}>{item.quantity.toLocaleString()}</Text>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 8,
    },
    highlightedAsk: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: '#d8e7fc',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 8,
    },
    highlightedBid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: '#fce1e1',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 8,
    },

    priceContainer: {
        flex: 0.5,
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
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
});
