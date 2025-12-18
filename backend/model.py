import os
import time
import schedule
import pymysql.cursors
import logging
from threading import Thread
from dotenv import load_dotenv

# --- 1. Configuration & Constants ---
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Declare a variable for the dataset filename (for future ML training)
DATASET_FILENAME = 'historical_zone_snapshots.csv'

# 🟢 CRITICAL CONSTANT: Maximum allowed radius in meters
MAX_RADIUS = 600 

# Database configuration (using environment variables)
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# SQL Queries
FETCH_ZONES_SQL = "SELECT * FROM zones"
UPDATE_PREDICTION_SQL = """
    UPDATE zones SET 
        predicted_population_next_month = %s, 
        predicted_risk_radius = %s,
        updated_at = NOW()
    WHERE zone_id = %s
"""

# --- 2. Prediction Logic (Rule-Based Model) ---

def run_prediction_logic(zone_data):
    """
    Applies the rule-based prediction model and enforces the maximum radius.
    """
    # Cast and safely default numerical values
    dog_population = float(zone_data.get('dog_population') or 0)
    radius_meters = float(zone_data.get('radius_meters') or 0)
    food_score = float(zone_data.get('food_score') or 0)
    water_score = float(zone_data.get('water_score') or 0)
    vaccinated_dogs = float(zone_data.get('vaccinated_dogs') or 0)
    sterilized_dogs = float(zone_data.get('sterilized_dogs') or 0)
    affected_by_rabies = float(zone_data.get('affected_by_rabies') or 0)
    bite_cases = float(zone_data.get('bite_cases') or 0)
    
    # 🧠 Algorithm 1: predicted_population_next_month (INT)
    predicted_population = dog_population + (
        (food_score + water_score) * 0.2
        - vaccinated_dogs * 0.1
        - sterilized_dogs * 0.2
        + affected_by_rabies * 0.3
    )
    predicted_population = max(0, round(predicted_population)) 

    # 🧠 Algorithm 2: predicted_risk_radius (FLOAT)
    divisor = dog_population + 1 
    predicted_risk_radius = radius_meters * (
        1 + (affected_by_rabies + bite_cases) / divisor * 0.5
    )
    predicted_risk_radius = round(predicted_risk_radius, 2)
    
    # 🟢 CRITICAL FIX: Enforce Maximum Radius Constraint
    if predicted_risk_radius > MAX_RADIUS:
        predicted_risk_radius = MAX_RADIUS
        
    return predicted_population, predicted_risk_radius


# --- 3. ML Engine Core Functionality ---

def fetch_and_update_predictions():
    """
    Connects to MySQL, fetches data, calculates predictions, and updates the database.
    """
    conn = None
    try:
        logging.info("Starting scheduled prediction update...")
        
        if not all(DB_CONFIG.values()):
            logging.error("Database environment variables are incomplete.")
            return

        conn = pymysql.connect(**DB_CONFIG)
        
        with conn.cursor() as cursor:
            # 1. Fetch all zones
            cursor.execute(FETCH_ZONES_SQL)
            zones = cursor.fetchall()
        
        if not zones:
            logging.warning("No zones found to predict.")
            return

        updates = []
        for zone in zones:
            # 2. Run prediction logic (includes max radius check)
            predicted_pop, predicted_radius = run_prediction_logic(zone)
            
            # 3. Prepare update tuple
            updates.append((
                predicted_pop, 
                predicted_radius, 
                zone['zone_id']
            ))

        with conn.cursor() as cursor:
            # 4. Execute batch update
            cursor.executemany(UPDATE_PREDICTION_SQL, updates)
            conn.commit()
            
        logging.info(f"Successfully updated predictions for {len(updates)} zones.")

    except Exception as e:
        logging.error(f"Failed to update predictions: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


# --- 4. Autonomous Scheduler and Parallel Execution ---

def run_scheduler_loop():
    """The function that runs inside the separate thread to check the schedule."""
    while True:
        schedule.run_pending()
        time.sleep(1) # Wait one second between checks

def start_autoloop():
    """Sets the schedule and starts the background thread."""
    
    # 1. Run once immediately on startup for quick feedback
    fetch_and_update_predictions() 
    
    # 2. Set the DAILY schedule
    schedule.every().day.do(fetch_and_update_predictions) 
    
    logging.info("ML Engine scheduled to run DAILY in the background.")
    
    # 3. Start the scheduler in a separate thread
    scheduler_thread = Thread(target=run_scheduler_loop)
    scheduler_thread.daemon = True 
    scheduler_thread.start()
    
    # 4. Keep the main thread alive indefinitely
    logging.info("Main script running. Press Ctrl+C to stop the process.")
    try:
        while True:
            time.sleep(60) 
    except KeyboardInterrupt:
        logging.info("Autonomous ML Predictor stopped by user.")


if __name__ == '__main__':
    logging.info("🚀 Autonomous ML Predictor starting...")
    start_autoloop()
