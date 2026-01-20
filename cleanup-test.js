// Quick test script to run cleanup
// Run with: node cleanup-test.js

import fetch from 'node-fetch';

const cleanup = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/super-admin/cleanup-unmanaged', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        console.log('Cleanup result:', result);
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
};

cleanup();