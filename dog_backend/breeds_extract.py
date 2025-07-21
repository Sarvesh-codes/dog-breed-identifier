import pandas as pd

df = pd.read_csv(r"dog_backend/labels.csv")
unique_breeds = sorted(df['breed'].unique())
breed_df = pd.DataFrame(unique_breeds, columns=["breed"])
breed_df.to_csv(r"dog_backend/breeds.csv", index=False)

print(f"{len(unique_breeds)} breeds saved to class_names.csv in backend folder.")
