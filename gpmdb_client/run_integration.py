import gpmdb

gpmdb.set_base_url("http://localhost:8000")

print("Testing metadata...")
meta = gpmdb.get_metadata()
print(f"  Name = {meta['name']}")

print("\nTesting query...")
df = gpmdb.get_data(CONTINENT="Australia", AGE_MIN=150, AGE_MAX=450, limit=10)
print(f"  Got {len(df)} results")
print(f"  Columns: {df.columns.tolist()}")

if len(df) > 0:
    print(f"\nSample row:")
    print(df.iloc[0])