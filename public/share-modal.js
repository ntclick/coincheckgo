// Share modal functionality
setTimeout(function() {
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Share functionality
            if (navigator.share) {
                navigator.share({
                    title: 'ConfidentialSwap',
                    text: 'Check out this FHE swap!',
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('Link copied to clipboard!');
                });
            }
        });
    } else {
        // Element not found - this is expected for confidential-swap-demo.html
        console.log('Share button not found - this is normal for the demo page');
    }
}, 1000); // Wait 1 second for DOM to load
