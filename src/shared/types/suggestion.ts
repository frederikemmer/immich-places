export type TSuggestionCategoryKey = 'suggested' | 'album' | 'sameDay' | 'twoDay' | 'weekly' | 'frequent';

export type TLocationCluster = {
	latitude: number;
	longitude: number;
	label: string;
	count: number;
};

export type TSuggestionsResponse = {
	sameDayClusters: TLocationCluster[];
	twoDayClusters: TLocationCluster[];
	weeklyClusters: TLocationCluster[];
	frequentLocations: TLocationCluster[];
	albumClusters: TLocationCluster[];
};

export type TRawSuggestionsResponse = {
	sameDayClusters: TLocationCluster[] | null;
	twoDayClusters: TLocationCluster[] | null;
	weeklyClusters: TLocationCluster[] | null;
	frequentLocations: TLocationCluster[] | null;
	albumClusters: TLocationCluster[] | null;
};

export type TSuggestionCategory = {
	key: string;
	label: string;
	clusters: TLocationCluster[];
};
