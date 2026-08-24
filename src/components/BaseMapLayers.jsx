import React from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';

const { BaseLayer } = LayersControl;

const BaseMapLayers = () => {
    return (
        <LayersControl position="topright">
            <BaseLayer checked name="Google Maps">
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Maps"
                 maxZoom={22} />
            </BaseLayer>
            <BaseLayer name="Google Satélite">
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Maps"
                 maxZoom={22} />
            </BaseLayer>
        </LayersControl>
    );
};

export default BaseMapLayers;
