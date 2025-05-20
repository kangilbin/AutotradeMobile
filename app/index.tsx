// app/index.tsx
import { useEffect, useState } from 'react';
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

    if (!route) return null;

    return <Redirect href={route} />;
}
