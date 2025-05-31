import {View, Text, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TopHeader() {

    return (
        <SafeAreaView edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>🔥 내 커스텀 타이틀 🔥</Text>
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    header: {
        height: 26, // 기본 타이틀 영역 높이
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});