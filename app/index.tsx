import { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { refreshAccessToken } from '../contexts/backEndApi';

export default function StartPageScreen() {
    const [route, setRoute] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('refresh_token');
            if (token) {
                try {
                    const response = await refreshAccessToken(token);
                    await SecureStore.setItemAsync('access_token', response!.access_token);
                    setRoute('/account');
                } catch {
                    setRoute('/login');
                }
            } else {
                setRoute('/login');
            }
        })();
    }, []);

    if (!route) {
        return (
            <View style={styles.container}>
                <Image
                    style={styles.logo}
                    source={require('../assets/main.png')}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" color="#B5EAD7" style={styles.spinner} />
            </View>
        );
    }

    return <Redirect href={route} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 300,
        height: 300,
    },
    spinner: {
        marginTop: 20,
    },
});
