// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LoadingIndicator from "../components/LoadingIndicator";
import { useMarketStore } from "../utils/useMarketStore";

SplashScreen.preventAutoHideAsync(); // 앱 시작 시 Splash 유지
export default function RootLayout() {
    const [loaded, error] = useFonts({
        'Nanum-Regular': require('../assets/fonts/NanumBrushScript-Regular.ttf'),
    });
    const [marketReady, setMarketReady] = useState(false);

    useEffect(() => {
        useMarketStore.getState().loadSavedMarket().then(() => setMarketReady(true));
    }, []);

    useEffect(() => {
        if ((loaded || error) && marketReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error, marketReady]);

    if (!loaded && !error || !marketReady) {
        return <LoadingIndicator />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="account" options={{ headerShown: false }} />
            </Stack>
        </GestureHandlerRootView>
    );
}
