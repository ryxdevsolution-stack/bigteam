export declare const authService: {
    login: (credentials: {
        email: string;
        password: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<never>;
};
