export type UpdateUserProfileRequest = {
    USER_NAME: string;
    PHONE: string;
};

export type NotiSettingItem = {
    NOTI_TYPE: string;   // 'BUY', 'SELL', 'SIGNAL' 등
    USE_YN: string;      // 'Y' or 'N'
};

export type UpdateNotificationRequest = {
    NOTI_TYPE: string;
    USE_YN: string;
};

export type PushTokenRegisterRequest = {
    PUSH_TOKEN: string;
    DEVICE_TYPE?: string;
};

export type PushTokenDeleteRequest = {
    PUSH_TOKEN: string;
};
