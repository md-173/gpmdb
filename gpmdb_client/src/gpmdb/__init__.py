"""
GPMDB - Python client for the Global Paleomagnetic Database

Usage:
    import gpmdb
    df = gpmdb.get_data(CONTINENT="Australia", AGE_MIN=150, AGE_MAX=450)
"""

from .client import GPMDBClient, GPMDBError

_client = GPMDBClient()


def get_data(**kwargs):
    """
    Query the Global Paleomagnetic Database.
    
    Parameters
    ----------
    CONTINENT : str, optional
        Filter by continent (partial match)
    ROCKTYPE : str, optional
        Filter by rock type (intrusives, extrusives, sediments)
    ROCKNAME : str, optional
        Filter by rock name (partial match)
    AGE_MIN, AGE_MAX : float, optional
        Rock age range in Ma
    MAGAGE_MIN, MAGAGE_MAX : float, optional
        Magnetic age range in Ma
    LAT_MIN, LAT_MAX : float, optional
        Site latitude bounds
    LON_MIN, LON_MAX : float, optional
        Site longitude bounds
    PLAT_MIN, PLAT_MAX : float, optional
        Pole latitude bounds
    PLON_MIN, PLON_MAX : float, optional
        Pole longitude bounds
    DEC_MIN, DEC_MAX : float, optional
        Declination bounds (degrees)
    INC_MIN, INC_MAX : float, optional
        Inclination bounds (degrees)
    K_MIN, K_MAX : float, optional
        Fisher K parameter bounds
    A95_MIN, A95_MAX : float, optional
        Alpha-95 bounds
    DP_MIN, DP_MAX : float, optional
        DP bounds
    DM_MIN, DM_MAX : float, optional
        DM bounds
    QSUM_MIN : float, optional
        Minimum Q quality score
    RSUM_MIN : float, optional
        Minimum R reliability score
    AUTHORS : str, optional
        Filter by author name (partial match)
    JOURNAL : str, optional
        Filter by journal name (partial match)
    YEAR_MIN, YEAR_MAX : int, optional
        Publication year bounds
    REFNO : int, optional
        Filter by reference number (exact)
    RESULTNO : int, optional
        Filter by result number (exact)
    limit : int, optional
        Maximum results (default 10000, max 50000)
    offset : int, optional
        Pagination offset
    
    Returns
    -------
    pandas.DataFrame
        Query results
    
    Examples
    --------
    >>> import gpmdb
    >>> df = gpmdb.get_data(CONTINENT="Australia", AGE_MIN=150, AGE_MAX=450)
    >>> df = gpmdb.get_data(ROCKTYPE="intrusives", QSUM_MIN=4)
    """
    return _client.query(**kwargs)


def get_metadata():
    """
    Get database metadata and version information.
    
    Returns
    -------
    dict
        Database metadata including name and API version
    """
    return _client.metadata()


def set_base_url(url):
    """
    Set custom API URL (for development/testing).
    
    Parameters
    ----------
    url : str
        Base URL (e.g., "http://localhost:8000")
    """
    global _client
    _client = GPMDBClient(base_url=url)


__all__ = ['get_data', 'get_metadata', 'set_base_url', 'GPMDBClient', 'GPMDBError']
__version__ = '0.1.0'