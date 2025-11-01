// Share modal functionality
(function() {
    'use strict';
    setTimeout(function() {
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                // Share functionality
                if (navigator.share) {
                    navigator.share({
                        title: 'CoinCheckGo - AI Crypto Research Platform',
                        text: 'Check out CoinCheckGo!',
                        url: window.location.href
                    }).catch(function(err) {
                        // Share failed silently
                        console.log('Share cancelled or failed:', err);
                    });
                } else if (navigator.clipboard) {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href).then(function() {
                        alert('Link copied to clipboard!');
                    }).catch(function(err) {
                        console.error('Failed to copy to clipboard:', err);
                    });
                }
            });
        }
    }, 1000);
})();
