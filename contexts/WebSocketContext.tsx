import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

interface WebSocketContextType {
    isConnected: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    sendMessage: (message: any, onResponse?: (data: any) => void) => boolean;
    connect: () => void;
    disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
    url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const socketRef = useRef<WebSocket | null>(null);
    const responseCallbackRef = useRef<((data: any) => void) | null>(null);
    const hasSentInitialToken = useRef(false);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setConnectionStatus('connecting');
        
        try {
            const socket = new WebSocket(url);
            
            socket.onopen = async () => {
                console.log('WebSocket 연결됨');
                setIsConnected(true);
                setConnectionStatus('connected');
                
                // 최초 연결 시 토큰 전송 (한 번만)
                if (!hasSentInitialToken.current) {
                    try {
                        // SecureStore에서 토큰 가져오기
                        const token = await SecureStore.getItemAsync('access_token');
                        
                        if (token) {
                            const authMessage = {
                                type: 'auth',
                                token: token
                            };
                            socket.send(JSON.stringify(authMessage));
                            console.log('최초 토큰 인증 메시지 전송');
                        } else {
                            console.warn('저장된 토큰이 없습니다.');
                        }
                        
                        hasSentInitialToken.current = true;
                    } catch (error) {
                        console.error('토큰 가져오기 실패:', error);
                    }
                }
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket 메시지 수신:', data);
                    
                    // 응답 콜백이 있으면 실행
                    if (responseCallbackRef.current) {
                        responseCallbackRef.current(data);
                        responseCallbackRef.current = null; // 한 번만 실행
                    }
                } catch (error) {
                    console.error('메시지 파싱 오류:', error);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket 오류:', error);
                setIsConnected(false);
                setConnectionStatus('error');
            };

            socket.onclose = (event) => {
                console.log('WebSocket 연결 종료:', event.code, event.reason);
                setIsConnected(false);
                setConnectionStatus('disconnected');
                hasSentInitialToken.current = false; // 재연결 시 다시 토큰 전송
            };

            socketRef.current = socket;
        } catch (error) {
            console.error('WebSocket 생성 오류:', error);
            setConnectionStatus('error');
        }
    }, [url]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        
        setIsConnected(false);
        setConnectionStatus('disconnected');
    }, []);

    const sendMessage = useCallback((message: any, onResponse?: (data: any) => void) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            // 응답 콜백 저장
            if (onResponse) {
                responseCallbackRef.current = onResponse;
            }
            
            socketRef.current.send(JSON.stringify(message));
            return true;
        }
        console.warn('WebSocket이 연결되지 않았습니다.');
        return false;
    }, []); // 빈 의존성 배열로 안정성 보장

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    const value: WebSocketContextType = {
        isConnected,
        connectionStatus,
        sendMessage,
        connect,
        disconnect
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
}; 