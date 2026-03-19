'use client';

import {useEffect, useRef, useState} from 'react';

import type {RefObject} from 'react';

type TUseScrollHeightReturn = {
	ref: RefObject<HTMLDivElement | null>;
	heightPx: number;
};

export function useScrollHeight(): TUseScrollHeightReturn {
	const ref = useRef<HTMLDivElement | null>(null);
	const [heightPx, setHeightPx] = useState(160);

	useEffect(() => {
		const element = ref.current;
		if (!element) {
			return;
		}
		const update = (): void => {
			setHeightPx(element.scrollHeight);
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => {
			observer.disconnect();
		};
	}, []);

	return {ref, heightPx};
}
