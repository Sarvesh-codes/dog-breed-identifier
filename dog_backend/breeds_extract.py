import pandas as pd

# Load labels.csv from wherever it is
df = pd.read_csv(r"dog_backend/labels.csv")

# Get sorted unique breeds
unique_breeds = sorted(df['breed'].unique())

# Convert to DataFrame
breed_df = pd.DataFrame(unique_breeds, columns=["breed"])

# Save as CSV in the backend folder
breed_df.to_csv(r"dog_backend/breeds.csv", index=False)

print(f"{len(unique_breeds)} breeds saved to class_names.csv in backend folder.")
