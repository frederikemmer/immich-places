export type TAuthUser = {
	ID: string;
	email: string;
	createdAt: string;
};

export type TMeResponse = {
	user: TAuthUser;
	hasImmichAPIKey: boolean;
};

export type TAuthErrorCode = 'notAuthenticated';
