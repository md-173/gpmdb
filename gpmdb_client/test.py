import gpmdb

gpmdb.set_base_url("http://localhost:7777")

# Test metadata endpoint
print(gpmdb.get_metadata())

# Test a simple query
df = gpmdb.get_data(limit=5)
print(df)

# Test with filters
df = gpmdb.get_data(CONTINENT="Australia", limit=10)
print(df)
print(f"Got {len(df)} results")
