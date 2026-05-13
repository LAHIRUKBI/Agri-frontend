# Smart Agriculture Support System

## Research Overview
This project focuses on developing a Smart Agriculture Support System tailored for Sri Lankan farmers, aiming to optimize crop yield, soil health, and market profitability. The system integrates machine learning models, IoT sensor fusion, advanced CNN image analysis, and generative AI (Gemini) into a unified platform. By continuously analyzing real-time environmental conditions, historical crop data, and precise agrochemical inputs, the system provides actionable, data-driven insights. It delivers end-to-end support—from calculating current soil N-P-K levels and recommending suitable crops per district, to guiding the cultivation process and forecasting crop market prices. This research bridges agricultural science, hardware integration, and artificial intelligence to reduce uncertainty and support smarter, sustainable farming decisions.

## Main Components
1. Crop Rotation Planning
2. Crop Cultivation Guidance
3. IoT Fusion Soil Health Scoring System
4. Crop Market Intelligence System

## 1. Crop Rotation Planning

An intelligent ML-based system that predicts current N-P-K soil nutrient levels based on land size, historical crop data, fertilizer usage, and environmental conditions. This component helps farmers make data-driven decisions on crop suitability. The system calculates precise fertilizer applications and assesses current soil health against target crop requirements.

### Novelty
The novelty of this system lies in its self-learning capability powered by AI. It dynamically adds missing crop N-P-K levels into the dataset for continuous model training. It functions as a smart tool that matches crops to soil while providing highly targeted advice on soil fertility.

### Key Features
- **N-P-K Prediction Model:** Developed an ML model predicting N-P-K per sq. ft. utilizing specific agrochemical inputs strictly categorized as *Fertilizers* and *Pesticides*, omitting unnecessary variables like applied days after planting or subjective reason fields to ensure precise, noise-free ML inputs.
- **Nutrient Calculator:** Computes current N-P-K utilizing the formula: `Baseline + ML Prediction − Environmental Loss` (factoring in pH and rainfall).
- **Land Calculator:** Converts acres to sq. ft. and computes per-sq. ft. fertilizer amounts.
- **Fertile Soil Baseline Comparison:** Checks current N-P-K against a fertile soil range (`SoilConfig.js`) with exact difference calculations.
- **AI-Powered Self-Learning Dataset:** Integrates Gemini AI to automatically retrieve and store missing crop N-P-K data directly into the system's training datasets.
- **Smart Alternatives:** Suggests 2 alternative crops via AI reasoning when the target crop is deemed unsuitable for the current soil profile.


### Technologies Used
- **Frontend:** Next.js / React (Rotation Plan Page UI)
- **Backend & ML:** Python, Machine Learning regression models
- **AI Integration:** Gemini AI API
- **Data Handling:** CSV datasets (`nutrients_data_set.csv`), Google Colab for model training

## 2. Crop Cultivation Guidance

An ML-powered Cultivation Page that predicts which crops are most suitable for a farmer's specific district in a given month or season. Beyond initial recommendations, it provides comprehensive, step-by-step cultivation guidance encompassing land preparation, fertilizer schedules, irrigation, pest control, and harvesting.

### Novelty
This component goes beyond static recommendations by offering guided, end-to-end cultivation tracking. It automatically detects the correct season, recommends suitable crops, and provides a real-time tracker equipped with smart alerts to ensure farmers follow optimal agricultural practices.

### Key Features
- **District & Seasonal Prediction:** Trained ML model predicts suitable crops based on district-wise parameters and target months.
- **Automated UI Detection:** The Cultivation Page UI auto-detects the current month, allowing farmers to easily select their district and proceed.
- **Comprehensive Step-by-Step Guidance:** Retrieves crucial steps (land prep, seeding, fertilizer schedule, irrigation, pest/disease control, and harvesting) from a curated CSV dataset.
- **Dynamic AI Retrieval:** Gemini AI automatically retrieves and stores cultivation steps for any unlisted crops into the CSV file.

### Technologies Used
- **Frontend:** Next.js / React
- **Backend & ML:** Python, Scikit-learn
- **AI Integration:** Gemini AI API
- **Data Processing:** Pandas (CSV parsing)

## 3. IoT Fusion Soil Health Scoring System

An AI and IoT-based soil health analysis system developed specifically for Sri Lankan smallholder farmers. The system combines smartphone soil image analysis with portable IoT sensor readings to predict soil health conditions. It generates comprehensive fertilizer recommendations and crop suitability guidance.

### Novelty
The primary novelty is the combination of CNN image analysis and IoT sensor fusion in a single platform, offering a dual-mode operation for farmers with or without hardware sensors. It is highly localized, providing Sri Lanka soil-zone specific predictions and integrating real-time BLE sensor data with a mobile dashboard.

### Key Features
- **Dual-Mode Operation:** Supports an Image-Only mode and a Full IoT Fusion mode depending on available hardware.
- **IoT Sensor Integration:** Utilizes an ESP32 Bluetooth-enabled sensor kit with Web Bluetooth API to measure pH, N, P, K, and moisture values.
- **CNN Image Analysis:** Employs a trained EfficientNet-B0 CNN model for advanced soil image feature extraction.
- **Sensor Fusion Model:** Uses a Random Forest fusion model to combine image features, IoT readings, and metadata.
- **Soil Health Score:** Generates a 0–100 score classified into Poor, Fair, Good, or Excellent with distinct color indicators.
- **Localized Dashboard:** Responsive farmer dashboard featuring native Sinhala language support.

### System Architecture
The architecture relies on an ESP32 edge layer for raw sensor data collection and BLE transmission, fused with an AI backend processing EfficientNet-B0 image features and Random Forest classifications.

### Technologies Used
- **Hardware:** ESP32, Portable Soil Sensors (pH, NPK, Moisture)
- **Communication:** Web Bluetooth API (BLE)
- **Machine Learning:** EfficientNet-B0 (CNN), Random Forest
- **Frontend:** Next.js / React 

## 4. Crop Market Intelligence System

The Sri Lankan Crop Market Intelligence System is an AI-based platform designed to assist farmers and wholesale sellers in making optimized crop selling decisions. It predicts future crop prices by analyzing historical market data, weather conditions, and inflation trends, directly reducing uncertainty in the agricultural supply chain.

### Novelty
This system is uniquely integrated, combining crop prices, weather, inflation, and wholesale market data into a single intelligence platform. It actively compares nearby wholesale markets and delivers simple, actionable "sell now or wait" recommendations backed by future price estimates and AI reasoning.

### Key Features
- **Future Price Forecasting:** Predicts future crop prices utilizing a Random Forest machine learning model (achieving ~70% accuracy).
- **Multi-variable Integration:** Combines historical market prices, weather data, inflation trends, and agricultural data.
- **Smart Recommendations:** Implements an intelligent "sell now or wait" workflow with future price analysis.
- **Market Comparison:** Compares nearby wholesale markets to suggest the most profitable selling options based on transport and current rates.
- **Earnings Estimation:** Provides a user-friendly dashboard featuring earnings comparison and AI reasoning capabilities to justify the recommendations.

### Technologies Used
- **Frontend:** Next.js / React
- **Backend & ML:** Python, Random Forest Regressor
- **Data Integration:** Weather APIs, Market Price Data streams
- **Data Processing:** Pandas, NumPy

---
**Backend Repository Link:** [https://github.com/LAHIRUKBI/Agri-backend]
**Frontend Repository Link:** [https://github.com/LAHIRUKBI/Agri-frontend]

## Getting Started backend

First, run the backend(open backend terminal):
```bash
npm run dev
```
second, run the model(\Agri\Agri-backend\model>):
```bash
\venv\Scripts\Activate 
```
when it activate correctly then run:
```bash
uvicorn app:app --reload --port 8000 
```

## Getting Started Frontend

Run the frontend(open  terminal):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
