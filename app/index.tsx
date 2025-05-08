import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { refreshAccessToken } from '../contexts/backEndApi';

export default function Index()
const router = useRouter();
    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('refresh_token');
            if (token) {
                try {
                    const response = await refreshAccessToken(token);
                    return router.replace(response ? '/account' : '/login');
                } catch {
                    console.error('Error refreshing token');
                }
            }
            router.replace('/Login');
        })();
    }, []);

    return <AppLayout />;
}