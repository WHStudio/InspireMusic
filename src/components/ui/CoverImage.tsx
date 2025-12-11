import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { clsx } from 'clsx';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  iconSize?: number | string;
}

export const CoverImage = React.forwardRef<HTMLImageElement, CoverImageProps>(
  ({ src, alt, className, iconSize = "40%", ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setHasError(false);
    }, [src]);

    if (!src || hasError) {
      return (
        <div
          className={clsx("flex items-center justify-center bg-gray-800 text-gray-600 overflow-hidden", className)}
          role="img"
          aria-label={alt}
        >
          <Music size={iconSize} />
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setHasError(true)}
        {...props}
      />
    );
  }
);

CoverImage.displayName = 'CoverImage';
