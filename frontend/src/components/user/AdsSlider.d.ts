import React from 'react';
import { Advertisement } from '../../contexts/DataContext';
interface AdsSliderProps {
    ads: Advertisement[];
    autoRotate?: boolean;
    interval?: number;
}
declare const AdsSlider: React.FC<AdsSliderProps>;
export default AdsSlider;
