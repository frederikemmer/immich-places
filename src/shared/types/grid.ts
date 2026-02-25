import type {TAssetRow} from '@/shared/types/asset';
import type {UIEvent} from 'react';

export type TVirtualizedGridState = {
	handleScroll: (event: UIEvent<HTMLDivElement>) => void;
	rowHeight: number;
	startIndex: number;
	visibleAssets: TAssetRow[];
	topSpacerHeight: number;
	bottomSpacerHeight: number;
	viewportHeight: number;
};
