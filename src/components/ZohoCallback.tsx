import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ZohoCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/calendar');
        return;
      }

      if (!code) {
        console.error('No code received');
        navigate('/calendar');
        return;
      }

      try {
        const response = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: '1000.SZS5EZNISPE47DXV10AEFEVBW6LPHN',
            client_secret: 'b508ffe0a03956496840b4b594e63f2e339360b0fc',
            redirect_uri: 'https://onpointgroundworks.netlify.app/callback',
            grant_type: 'authorization_code',
            data_center: 'EU'
          }).toString(),
        });

        if (!response.ok) {
          throw new Error('Failed to get refresh token');
        }

        const data = await response.json();
        if (data.refresh_token) {
          localStorage.setItem('zoho_refresh_token', data.refresh_token);
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }

      // Redirect back to calendar page
      navigate('/calendar');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Connecting to Zoho Calendar...</h2>
        <div className="text-gray-600">Please wait while we complete the authentication process.</div>
      </div>
    </div>
  );
} 