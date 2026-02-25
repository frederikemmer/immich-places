import {GeistSans} from 'geist/font/sans';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import './globals.css';

import type {Metadata} from 'next';
import type {ReactElement} from 'react';

export const metadata: Metadata = {
	title: 'Immich Places',
	description: 'Geolocate your Immich photos missing GPS coordinates',
	icons: {icon: '/logo.svg'}
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>): ReactElement {
	return (
		<html lang={'en'}>
			<body className={`${GeistSans.variable} ${GeistSans.className}`}>{children}</body>
		</html>
	);
}
