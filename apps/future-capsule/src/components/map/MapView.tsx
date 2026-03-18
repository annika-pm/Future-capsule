'use client';

import { useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MOOD_EMOJIS, Mood } from '../../types/capsule';

interface Location {
  latitude: number;
  longitude: number;
  title: string;
  unlockDate: number;
  mood: Mood;
  id: string;
}

interface MapViewProps {
  locations: Location[];
  className?: string;
}

const MOOD_COLORS: Record<Mood, string> = {
  Happy: '#10B981', // green
  Motivated: '#F59E0B', // amber
  Confused: '#8B5CF6', // violet
  Sad: '#3B82F6', // blue
  Grateful: '#EF4444', // red
  Hopeful: '#EC4899', // pink
};

function MapComponent({ locations }: { locations: Location[] }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = locations.map((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map,
        title: location.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: MOOD_COLORS[location.mood],
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${location.title}</h3>
            <p style="margin: 0 0 4px 0;">${MOOD_EMOJIS[location.mood]} ${location.mood}</p>
            <p style="margin: 0; color: #666; font-size: 14px;">
              Unlocks: ${new Date(location.unlockDate).toLocaleDateString()}
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.latitude, lng: location.longitude });
      });
      map.fitBounds(bounds);

      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [locations, markers]);

  const onUnmount = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    setMap(null);
  }, [markers]);

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={{ lat: 0, lng: 0 }}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
      />
    </div>
  );
}

function GoogleMap({
  onLoad,
  onUnmount,
  ...props
}: google.maps.MapOptions & {
  onLoad?: (map: google.maps.Map) => void;
  onUnmount?: () => void;
}) {
  return (
    <div ref={(node) => {
      if (node && !node['map']) {
        const map = new google.maps.Map(node, props);
        node['map'] = map;
        if (onLoad) onLoad(map);
      }
    }} />
  );
}

function LoadingComponent() {
  return <div className="flex items-center justify-center h-96">Loading map...</div>;
}

function ErrorComponent() {
  return (
    <div className="flex items-center justify-center h-96 text-red-500">
      Error loading map. Please check your API key.
    </div>
  );
}

export function MapView({ locations, className = '' }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Map unavailable</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Google Maps API key not configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Wrapper
        apiKey={apiKey}
        libraries={['places']}
        render={(status) => {
          switch (status) {
            case Status.LOADING:
              return <LoadingComponent />;
            case Status.FAILURE:
              return <ErrorComponent />;
            case Status.SUCCESS:
              return <MapComponent locations={locations} />;
            default:
              return <LoadingComponent />;
          }
        }}
      />
    </div>
  );
}