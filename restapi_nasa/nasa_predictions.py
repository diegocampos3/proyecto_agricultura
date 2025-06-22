import sys
import json
import requests
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

url = "https://power.larc.nasa.gov/api/temporal/climatology/point"

def fetch_data(latitude, longitude):
    params = {
        "start": "1981",
        "end": "2022",
        "latitude": latitude,
        "longitude": longitude,
        "community": "ag",
        "parameters": "T2M_MIN,T2M_MAX,PRECTOT",
        "format": "JSON"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        properties_data = data['properties']
        parameter_data = properties_data['parameter']
        df = pd.DataFrame(parameter_data)
        df['YEAR'] = df.index.str.extract('(\d{4})', expand=False).fillna(0).astype(int)
        df['MONTH'] = df.index.str.extract('-(\d{2})', expand=False).fillna(0).astype(int)
        df = df.reset_index(drop=True)
        return df
    else:
        return None

def main(year, month, latitude, longitude):
    df = fetch_data(latitude, longitude)
    if df is not None and 'PRECTOTCORR' in df.columns:
        X = df[['YEAR', 'MONTH']]
        y = df[['T2M_MIN', 'T2M_MAX', 'PRECTOTCORR']]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = LinearRegression()
        model.fit(X_train, y_train)

        input_data = pd.DataFrame({'YEAR': [year], 'MONTH': [month]})
        prediction = model.predict(input_data)

        result = {
            "T2M_MIN": float(prediction[0][0]),
            "T2M_MAX": float(prediction[0][1]),
            "PRECTOTCORR": float(prediction[0][2])
        }
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "'PRECTOTCORR' column not found in API response"}))

if __name__ == "__main__":
    input_data = sys.stdin.read().strip().split(",")
    year = int(input_data[0])
    month = int(input_data[1])
    latitude = float(input_data[2])
    longitude = float(input_data[3])
    main(year, month, latitude, longitude)
