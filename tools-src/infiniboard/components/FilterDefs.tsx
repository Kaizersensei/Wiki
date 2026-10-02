import React from 'react';
import { ColorFilters } from '../types';

interface FilterDefsProps {
  id: string;
  filters: ColorFilters;
}

export const FilterDefs: React.FC<FilterDefsProps> = ({ id, filters }) => {
  // Hex to Normalized RGB for Tint
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
  };

  const tint = hexToRgb(filters.tintColor);

  // Matrix math for RGB channels + Exposure (offset)
  // R' = R * redVal + exposure
  // G' = G * greenVal + exposure
  // B' = B * blueVal + exposure
  // A' = A

  // We combine RGB scaling with Tinting in one matrix if possible, or stick to simple channel scaling
  // Here we do Channel Scaling

  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <filter id={`filter-${id}`} colorInterpolationFilters="sRGB">
          {/* 1. Component Transfer: Gamma & RGB Scaling */}
          <feComponentTransfer>
            <feFuncR type="gamma" amplitude={filters.red} exponent={filters.gamma} offset={filters.exposure / 100} />
            <feFuncG type="gamma" amplitude={filters.green} exponent={filters.gamma} offset={filters.exposure / 100} />
            <feFuncB type="gamma" amplitude={filters.blue} exponent={filters.gamma} offset={filters.exposure / 100} />
          </feComponentTransfer>

          {/* 2. Tinting via Color Matrix if intensity > 0 */}
          {filters.tintIntensity > 0 && (
             <feColorMatrix type="matrix" values={`
               ${1 - filters.tintIntensity + (tint.r * filters.tintIntensity)} 0 0 0 0
               0 ${1 - filters.tintIntensity + (tint.g * filters.tintIntensity)} 0 0 0
               0 0 ${1 - filters.tintIntensity + (tint.b * filters.tintIntensity)} 0 0
               0 0 0 1 0
             `} />
          )}
        </filter>
      </defs>
    </svg>
  );
};
