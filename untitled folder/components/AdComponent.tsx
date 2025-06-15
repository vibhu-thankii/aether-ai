'use client';

import React, { useEffect, useRef } from 'react';
// The next/script import is no longer needed here
// import Script from 'next/script'; 

const AdComponent = () => {
    const adPushed = useRef(false);

    useEffect(() => {
        // This check ensures that even if React's Strict Mode runs this
        // effect twice in development, we only push the ad once.
        if (adPushed.current) {
            return;
        }
 
        try {
            // Because the AdSense script is now loaded globally in layout.tsx,
            // we can safely assume window.adsbygoogle will be available here.
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            // Mark the ad as pushed so it doesn't happen again.
            adPushed.current = true;
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }, []);
    
    return (
        // This container will hold our ad and its placeholder styles.
        <div className="w-full max-w-sm mx-auto my-4 min-h-[100px] border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center">
            {/* The <Script> tag has been removed, as the AdSense script
                is now loaded globally in the root layout. */}
            <ins
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100px',
                }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
                data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT_ID}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
};

export default AdComponent;
