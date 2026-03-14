// Parse URL to get artifact ID
function getArtifactIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');
    
    // Support multiple URL formats:
    // 1. /artifact/TEMPLE_001_ARTIFACT_005
    // 2. /artifact?id=TEMPLE_001_ARTIFACT_005
    // 3. /?artifact=TEMPLE_001_ARTIFACT_005
    
    if (pathParts.includes('artifact') && pathParts.length > 2) {
        return pathParts[pathParts.indexOf('artifact') + 1];
    }
    
    return urlParams.get('id') || urlParams.get('artifact');
}

// Fetch artifact data from API
async function fetchArtifactData(artifactId) {
    try {
        // API endpoint for Sanaathana Aalaya Charithra
        // Domain loaded from global config or environment
        const DOMAIN_ROOT = window.DOMAIN_ROOT || 'charithra.org';
        const API_BASE_URL = `https://api.${DOMAIN_ROOT}`;
        const response = await fetch(`${API_BASE_URL}/artifacts/${artifactId}`);
        
        if (!response.ok) {
            throw new Error('Artifact not found');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching artifact:', error);
        return null;
    }
}

// Display artifact content
function displayArtifactContent(data) {
    const contentDiv = document.getElementById('artifact-content');
    
    const html = `
        <div class="artifact-header">
            <h2>${data.name || 'Temple Artifact'}</h2>
            <div class="artifact-meta">
                <p><strong>Temple:</strong> ${data.templeName || 'Unknown'}</p>
                <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
            </div>
        </div>
        
        ${data.content?.about ? `
            <div class="artifact-section">
                <h3>About</h3>
                <p>${data.content.about}</p>
            </div>
        ` : ''}
        
        ${data.content?.history ? `
            <div class="artifact-section">
                <h3>History</h3>
                <p>${data.content.history}</p>
            </div>
        ` : ''}
        
        ${data.content?.significance ? `
            <div class="artifact-section">
                <h3>Significance</h3>
                <p>${data.content.significance}</p>
            </div>
        ` : ''}
        
        <div class="notice">
            <strong>📱 Want the full experience?</strong>
            Download our mobile app to access audio guides, offline content, and more features!
        </div>
    `;
    
    contentDiv.innerHTML = html;
    contentDiv.style.display = 'block';
}

// Show error message
function showError(message) {
    const contentDiv = document.getElementById('artifact-content');
    contentDiv.innerHTML = `
        <div class="artifact-header">
            <h2>⚠️ Content Not Available</h2>
        </div>
        <p>${message}</p>
        <p>Please download our mobile app to access all temple content.</p>
    `;
    contentDiv.style.display = 'block';
}

// Initialize page
async function init() {
    const loadingDiv = document.getElementById('loading');
    const defaultContent = document.getElementById('default-content');
    const artifactId = getArtifactIdFromURL();
    
    if (artifactId) {
        // Hide default content
        defaultContent.style.display = 'none';
        
        // Fetch and display artifact data
        const data = await fetchArtifactData(artifactId);
        
        // Hide loading
        loadingDiv.style.display = 'none';
        
        if (data) {
            displayArtifactContent(data);
        } else {
            showError('This artifact could not be found. It may have been moved or deleted.');
        }
    } else {
        // No artifact ID - show default landing page
        loadingDiv.style.display = 'none';
        defaultContent.style.display = 'block';
    }
}

// Detect if app is installed (for deep linking)
function tryOpenInApp() {
    const artifactId = getArtifactIdFromURL();
    if (!artifactId) return;
    
    // Try to open in app
    const appUrl = `templeheritage://artifact/${artifactId}`;
    const timeout = setTimeout(() => {
        // App not installed, stay on web page
    }, 2000);
    
    window.location = appUrl;
    
    // If app opens, this won't execute
    window.addEventListener('blur', () => {
        clearTimeout(timeout);
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Try to open in app if installed
    // Uncomment when app deep linking is ready
    // tryOpenInApp();
});

// Handle back button
window.addEventListener('popstate', () => {
    init();
});
