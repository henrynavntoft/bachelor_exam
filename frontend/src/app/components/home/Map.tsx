'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import axios from 'axios';
import MapPopup from '@/app/components/home/MapPopup';
import { renderToString } from 'react-dom/server';
import { useTheme } from 'next-themes';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Event {
    id: string;
    title: string;
    location: string;
    date: string;
}

interface MapProps {
    events: Event[];
}

export default function Map({ events = [] }: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const activePopupRef = useRef<mapboxgl.Popup | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: theme === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/streets-v12',
            center: [10.5683, 51.6761],
            zoom: 4,
        });

        // Close popup when clicking on the map
        map.on('click', () => {
            if (activePopupRef.current) {
                activePopupRef.current.remove();
                activePopupRef.current = null;
            }
        });

        mapRef.current = map;

        return () => map.remove();
    }, [theme]);

    // When theme changes, update the map style
    useEffect(() => {
        if (!mapRef.current) return;

        mapRef.current.setStyle(
            theme === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/streets-v12'
        );
    }, [theme]);

    // Add markers when events change
    useEffect(() => {
        if (!mapRef.current) return;

        // Ensure events is an array
        const validEvents = Array.isArray(events) ? events : [];

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add custom popup styles once, using CSS variables from your theme
        const popupStyle = document.createElement('style');
        popupStyle.textContent = `
            .mapboxgl-popup-content {
                padding: 0 !important;
                background-color: var(--background) !important;
                color: var(--foreground) !important;
                overflow: hidden !important;
                border: none;
                border-radius: 0 !important;
                outline: none;
            }
            
            .mapboxgl-popup-close-button {
                padding: 8px !important;
                border-radius: 0 !important;
                font-size: 20px !important;
                color: var(--muted-foreground) !important;
                background: transparent !important;
                border: none !important;
                cursor: pointer !important;
                transition: color 0.2s !important;
                z-index: 10 !important;
            }
            
            .mapboxgl-popup-close-button:hover {
                border-radius: 0 !important;
                color: var(--brand) !important;
                background: transparent !important;
            }
        `;
        document.head.appendChild(popupStyle);

        // Add markers for each event with additional safety checks
        validEvents.forEach(event => {
            // Skip events with missing required data
            if (!event || !event.id || !event.location) {
                console.warn('Skipping invalid event:', event);
                return;
            }

            // Create a popup with a clickable link to the event detail page
            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false
            }).setHTML(renderToString(
                <MapPopup
                    id={event.id}
                    title={event.title || 'Unnamed Event'}
                    location={event.location || 'Unknown Location'}
                    date={event.date || 'No date provided'}
                />
            ));

            // Close popup when its close button is clicked
            popup.on('close', () => {
                if (activePopupRef.current === popup) {
                    activePopupRef.current = null;
                }
            });

            // Create a custom marker element
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.backgroundImage = 'url(/pin.svg)';
            el.style.backgroundSize = 'cover';
            el.style.cursor = 'pointer';

            // Create and add the marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat([12.5683, 55.6761]) // Default to Copenhagen for now
                .addTo(mapRef.current!);

            // Handle marker click
            marker.getElement().addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent map click from immediately closing the popup

                // Close any existing popup
                if (activePopupRef.current) {
                    activePopupRef.current.remove();
                }

                // Set popup on marker and open it
                marker.setPopup(popup);
                marker.togglePopup();

                // Set this popup as active
                activePopupRef.current = popup;

                // Get the marker's position
                const lngLat = marker.getLngLat();

                // Fly to the marker with animation but don't zoom in too much
                mapRef.current?.flyTo({
                    center: lngLat,
                    zoom: 12, // Less zoomed in than before
                    duration: 1000,
                    essential: true
                });
            });

            markersRef.current.push(marker);

            // Geocode the location
            axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(event.location)}.json?access_token=${mapboxgl.accessToken}`)
                .then(response => {
                    const data = response.data;
                    if (data.features && data.features.length > 0) {
                        const [lng, lat] = data.features[0].center;
                        marker.setLngLat([lng, lat]);
                    }
                })
                .catch(error => {
                    console.error('Error geocoding location:', error);
                });
        });
    }, [events, theme]);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }}
            className="rounded-lg"
        />
    );
}