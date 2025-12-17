"""HTTP client for GPMDB API."""

import requests
import pandas as pd


class GPMDBError(Exception):
    """Exception raised for GPMDB API errors."""
    pass


class GPMDBClient:
    """Client for the Global Paleomagnetic Database API."""
    
    DEFAULT_BASE_URL = "https://gpmdb.net"
    
    def __init__(self, base_url=None, timeout=60):
        """
        Initialize the GPMDB client.
        
        Parameters
        ----------
        base_url : str, optional
            Base URL for the API. Defaults to production server.
        timeout : int, optional
            Request timeout in seconds (default 60)
        """
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip('/')
        self.timeout = timeout
    
    def _request(self, endpoint, params=None):
        """Make a request to the API."""
        url = f"{self.base_url}/api/v1/{endpoint}/"
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
        except (requests.exceptions.ConnectionError, ConnectionError):
            raise GPMDBError(f"Could not connect to GPMDB at {self.base_url}")
        except requests.exceptions.Timeout:
            raise GPMDBError(f"Request timed out after {self.timeout}s")
        
        # Try to parse JSON response first (API returns JSON even for errors)
        try:
            data = response.json()
        except ValueError:
            # Not JSON - fall back to HTTP status check
            if not response.ok:
                raise GPMDBError(f"HTTP error: {response.status_code}")
            raise GPMDBError("Invalid response from server")
        
        # Check for API-level errors (success: false)
        if not data.get('success'):
            raise GPMDBError(data.get('error', 'Unknown API error'))
        
        return data
    
    def metadata(self):
        """Get database metadata."""
        response = self._request('metadata')
        return response.get('data', {})
    
    def query(self, **kwargs):
        """
        Query the database and return a DataFrame.
        
        Parameters are passed directly as URL query parameters.
        """
        # Filter out None values
        params = {k: v for k, v in kwargs.items() if v is not None}
        
        response = self._request('query', params)
        
        data = response.get('data', [])
        columns = response.get('columns', [])
        
        if not data:
            return pd.DataFrame(columns=columns)
        
        return pd.DataFrame(data, columns=columns)