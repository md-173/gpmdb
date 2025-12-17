"""Tests for GPMDB client."""

import pytest
import responses
import pandas as pd
from gpmdb import get_data, get_metadata, set_base_url, GPMDBClient, GPMDBError


class TestMetadata:
    """Tests for get_metadata()."""
    
    @responses.activate
    def test_get_metadata_success(self):
        """Test successful metadata retrieval."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/metadata/",
            json={
                "success": True,
                "data": {"name": "Global Paleomagnetic Database", "api_version": "1.0"}
            },
            status=200,
        )
        
        result = get_metadata()
        
        assert result["name"] == "Global Paleomagnetic Database"
        assert result["api_version"] == "1.0"


class TestQuery:
    """Tests for get_data()."""
    
    @responses.activate
    def test_get_data_returns_dataframe(self):
        """Test that get_data returns a pandas DataFrame."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/query/",
            json={
                "success": True,
                "data": [
                    [100, 500, "Test Rock", 2020, "Smith, J."],
                    [101, 501, "Another Rock", 2021, "Jones, A."],
                ],
                "columns": ["REFNO", "RESULTNO", "ROCKNAME", "YEAR", "AUTHORS"],
                "count": 2,
            },
            status=200,
        )
        
        df = get_data(limit=2)
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 2
        assert list(df.columns) == ["REFNO", "RESULTNO", "ROCKNAME", "YEAR", "AUTHORS"]
    
    @responses.activate
    def test_get_data_with_filters(self):
        """Test that filters are passed correctly."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/query/",
            json={
                "success": True,
                "data": [[100, 500, "Australian Rock", 2020, "Smith"]],
                "columns": ["REFNO", "RESULTNO", "ROCKNAME", "YEAR", "AUTHORS"],
                "count": 1,
            },
            status=200,
        )
        
        df = get_data(CONTINENT="Australia", AGE_MIN=150, AGE_MAX=450)
        
        # Check that the request was made with correct params
        assert "CONTINENT=Australia" in responses.calls[0].request.url
        assert "AGE_MIN=150" in responses.calls[0].request.url
        assert "AGE_MAX=450" in responses.calls[0].request.url
        
        assert len(df) == 1
    
    @responses.activate
    def test_get_data_empty_result(self):
        """Test handling of empty results."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/query/",
            json={
                "success": True,
                "data": [],
                "columns": ["REFNO", "RESULTNO", "ROCKNAME"],
                "count": 0,
            },
            status=200,
        )
        
        df = get_data(CONTINENT="NonexistentPlace")
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 0
        assert list(df.columns) == ["REFNO", "RESULTNO", "ROCKNAME"]


class TestErrors:
    """Tests for error handling."""
    
    @responses.activate
    def test_api_error_raises_exception(self):
        """Test that API errors raise GPMDBError."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/query/",
            json={
                "success": False,
                "error": "AGE_MIN must be numeric",
            },
            status=400,
        )
        
        with pytest.raises(GPMDBError) as exc_info:
            get_data(AGE_MIN="invalid")
        
        assert "AGE_MIN must be numeric" in str(exc_info.value)
    
    @responses.activate
    def test_connection_error(self):
        """Test handling of connection errors."""
        responses.add(
            responses.GET,
            "https://gpmdb.net/api/v1/query/",
            body=ConnectionError("Network error"),
        )
        
        with pytest.raises(GPMDBError) as exc_info:
            get_data()
        
        assert "Could not connect" in str(exc_info.value)


class TestCustomBaseUrl:
    """Tests for set_base_url()."""
    
    @responses.activate
    def test_custom_base_url(self):
        """Test using a custom base URL."""
        # Set custom URL
        set_base_url("http://localhost:8000")
        
        responses.add(
            responses.GET,
            "http://localhost:8000/api/v1/metadata/",
            json={"success": True, "data": {"name": "Test DB"}},
            status=200,
        )
        
        result = get_metadata()
        
        assert result["name"] == "Test DB"
        
        # Reset to default
        set_base_url("https://gpmdb.net")


class TestGPMDBClient:
    """Tests for GPMDBClient class directly."""
    
    def test_client_default_url(self):
        """Test that client uses default URL."""
        client = GPMDBClient()
        assert client.base_url == "https://gpmdb.net"
    
    def test_client_custom_url(self):
        """Test client with custom URL."""
        client = GPMDBClient(base_url="http://localhost:8000")
        assert client.base_url == "http://localhost:8000"
    
    def test_client_strips_trailing_slash(self):
        """Test that trailing slashes are stripped."""
        client = GPMDBClient(base_url="http://localhost:8000/")
        assert client.base_url == "http://localhost:8000"